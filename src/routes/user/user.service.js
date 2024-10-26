const wordService = require('../word/word.service');
const userRepository = require('./user.repository');
const redisClient = require('../../common/modules/redis');
const { generateTokens } = require('../../common/utils/auth');
const { getKakaoToken, getUserInfo } = require('../../common/utils/kakao');
const config = require('../../common/config');

exports.register = async (userData) => {
    const newUser = {
        email: userData.email,
        password: userData.password,
        nickname: userData.nickname,
    };
    return await userRepository.createUser(newUser);
};

exports.kakaoRegister = async (newUser) => {
    return await userRepository.createUser(newUser);
};

exports.handleLogin = async (user) => {
    const tokens = await generateTokens(user);
    await this.storeRefreshToken(user.email, tokens.refreshToken);
    return tokens;
};

exports.handleKakaoLogin = async (code) => {
    const kakaoUser = await this.fetchKakaoUser(code);
    let user = await this.isKaKaoUserExist(kakaoUser.snsId);
    if (!user) {
        user = await this.kakaoRegister(kakaoUser);
    }
    const tokens = await generateTokens(user);
    await this.storeRefreshToken(user.email, tokens.refreshToken);
    return tokens;
};

exports.fetchKakaoUser = async (code) => {
    const { kakaoAccessToken } = await getKakaoToken(code);
    const kakaoData = await getUserInfo(kakaoAccessToken);
    return {
        snsId: kakaoData.snsId,
        email: kakaoData.email,
        nickname: kakaoData.nickname,
        provider: 'kakao',
    };
};

exports.storeRefreshToken = async (email, refreshToken) => {
    await redisClient.set(email, refreshToken);
    await redisClient.expire(email, config.cookieInRefreshTokenOptions.maxAge / 1000);
};

exports.refreshTokens = async (user, oldRefreshToken) => {
    const storedRefreshToken = await redisClient.get(user.email);

    if (storedRefreshToken !== oldRefreshToken) {
        await redisClient.del(user.email);
        return null;
    }

    const tokens = await generateTokens(user);
    await redisClient.set(user.email, tokens.refreshToken);
    await redisClient.expire(user.email, config.cookieInRefreshTokenOptions.maxAge / 1000);

    return tokens;
};

exports.isNicknameExist = async (nickname) => {
    return await userRepository.findUserByNickname(nickname);
};

exports.isEmailExist = async (email) => {
    return await userRepository.findUserByEmail(email);
};

exports.isKaKaoUserExist = async (snsId) => {
    return await userRepository.getUserBySnsId(snsId);
};

exports.findUserById = async (userId) => {
    return await userRepository.findUserById(userId);
};

exports.isUserExist = async (userId) => {
    return await userRepository.findUserById(userId);
};

exports.logout = async (email) => {
    await redisClient.del(email);
};

exports.getRecentSearches = async (userId) => {
    return await userRepository.getRecentSearches(userId);
};

exports.delRecentSearch = async (userId, searchTerm) => {
    return await userRepository.delRecentSearch(userId, searchTerm);
};

exports.updateRecentSearch = async (userID, searchTerm) => {
    if (userID) {
        await userRepository.updateRecentSearch(userID, searchTerm);
    }
};

exports.postWords = async (userId, formData, nickname, type) =>
    await userRepository.postWords(userId, formData, nickname, type);

exports.getUserRequests = async (userId) => await userRepository.getUserRequests(userId);

exports.getUserRequestsAll = async () => await userRepository.getUserRequestsAll();

exports.deleteRequest = async (userId, requestWord) => await userRepository.deleteRequest(userId, requestWord);

exports.getRole = async (userId) => await userRepository.getRole(userId);

exports.findUserByRequestId = async (requestId) => await userRepository.findUserByRequestId(requestId);

exports.updateRequest = async (requestId, formData) => {
    if (requestId) {
        await userRepository.updateRequest(requestId, formData);
    }
};

exports.updateRequestState = async (userId, requestId, status, formData, requestType) => {
    if (userId) {
        await userRepository.updateRequestState(requestId, status);
        if (requestType === 'add') {
            await wordService.addWord(requestId, formData);
            await userRepository.updateRequest(requestId, formData);
        } else if (requestType === 'mod') {
            await wordService.updateWord(requestId, formData);
            await userRepository.updateRequest(requestId, formData);
        }
    }
};

exports.deleteUserAndRelatedData = async (_id) => {
    await wordService.deleteWordContributor(_id);
    return await userRepository.deleteUserById(_id);
};
