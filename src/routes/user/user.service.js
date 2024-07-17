const userRepository = require('./user.repository');
const wordRepository = require('../word/word.repository');

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

exports.getRecentSearches = async (userId) => {
    const recentSearches = await userRepository.getRecentSearches(userId);
    return recentSearches;
};

exports.delRecentSearch = async (userId, searchTerm) => {
    return await userRepository.delRecentSearch(userId, searchTerm);
};

// 최근 검색어 저장
exports.updateRecentSearch = async (userID, searchTerm) => {
    if (userID) {
        await userRepository.updateRecentSearch(userID, searchTerm);
    }
};

// 단어 추가 및 수정
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

exports.updateRequest = async (requestId, formData) => {
    if (requestId) {
        await userRepository.updateRequest(requestId, formData);
    }
};

exports.updateRequestState = async (userId, requestId, status, formData, requestType) => {
    if (userId) {
        await userRepository.updateRequestState(userId, requestId, status, formData);
        if (requestType === 'add') {
            //TODO: add 일 때, 단어 중복검사 로직 우선적 검증 추가
            await wordRepository.addWord(requestId, formData);
            await userRepository.updateRequest(requestId, formData); //수정값 사용자 요청 업데이트
        } else if (requestType === 'mod') {
            await wordRepository.updateWord(requestId, formData);
            await userRepository.updateRequest(requestId, formData); //수정값 사용자 요청 업데이트
        } else {
            console.log('requestType 오류');
            return;
        }
    }
};

exports.deleteUser = async (_id) => {
    return await userRepository.deleteUserById(_id);
};
