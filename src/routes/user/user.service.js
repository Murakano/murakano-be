const wordService = require('../word/word.service');
const userRepository = require('./user.repository');
const redisClient = require('../../common/modules/redis');
const { generateAccessToken, generateRefreshToken } = require('../../common/utils/auth');
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
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await redisClient.set(user.email, refreshToken);
    await redisClient.expire(user.email, config.cookieInRefreshTokenOptions.maxAge / 1000);

    return { accessToken, refreshToken };
};

exports.handleKakaoLogin = async (code) => {
    const { kakaoAccessToken } = await getKakaoToken(code);
    const { snsId, email, nickname } = await getUserInfo(kakaoAccessToken);

    const kakaoUser = { snsId, email, nickname, provider: 'kakao' };

    let user = await this.isKaKaoUserExist(kakaoUser.snsId);
    if (!user) {
        user = await this.kakaoRegister(kakaoUser);
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await redisClient.set(user.email, refreshToken);
    await redisClient.expire(user.email, config.cookieInRefreshTokenOptions.maxAge / 1000);

    return { accessToken, refreshToken };
};

exports.isNicknameExist = async (nickname) => {
    const isUserExist = await userRepository.findUserByNickname(nickname);
    return isUserExist;
};

exports.isEmailExist = async (email) => {
    const isUserExist = await userRepository.findUserByEmail(email);
    return isUserExist;
};

exports.isKaKaoUserExist = async (snsId) => {
    const user = await userRepository.getUserBySnsId(snsId);
    return user;
};

exports.findUserById = async (userId) => {
    return await userRepository.findUserById(userId);
};

exports.isUserExist = async (userId) => {
    return await userRepository.findUserById(userId);
};

exports.getRecentSearches = async (userId) => {
    const recentSearches = await userRepository.getRecentSearches(userId);
    return recentSearches;
};

exports.delRecentSearch = async (userId, searchTerm) => {
    return await userRepository.delRecentSearch(userId, searchTerm);
};

exports.updateRecentSearch = async (userID, searchTerm) => {
    if (userID) {
        await userRepository.updateRecentSearch(userID, searchTerm);
    }
};

exports.postWords = async (userId, formData, nickname, type) => {
    const word = await userRepository.postWords(userId, formData, nickname, type);
    return word;
};
exports.getUserRequests = async (userId) => {
    const requests = await userRepository.getUserRequests(userId);
    return requests;
};

exports.getUserRequestsAll = async () => {
    const requests = await userRepository.getUserRequestsAll();
    return requests;
};

exports.deleteRequest = async (userId, requestWord) => {
    const result = await userRepository.deleteRequest(userId, requestWord);
    return result;
};

exports.getRole = async (userId) => {
    const role = await userRepository.getRole(userId);
    return role;
};

exports.findUserByRequestId = async (requestId) => {
    return await userRepository.findUserByRequestId(requestId);
};

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
        } else {
            console.log('requestType 오류');
            return;
        }
    }
};

exports.deleteUser = async (_id) => {
    return await userRepository.deleteUserById(_id);
};
