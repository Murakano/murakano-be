const express = require('express');
const {
    register,
    isNicknameExist,
    isEmailExist,
    localLogin,
    kakaoLogin,
    getProfile,
    refreshToken,
    logout,
    recentSearches,
    delRecentSearch,
    postWords,
    UserRequests,
    UserRequestsAll,
    deleteRequest,
    updateRequest,
    getRole,
    updateRequestState,
    deleteUser,
} = require('./user.controller');
const { isLoggedIn, isNotLoggedIn } = require('../../common/utils/auth');
const userRouter = express.Router();

userRouter.delete('/', isLoggedIn, deleteUser);

// 회원가입
userRouter.post('/register', isNotLoggedIn, register);
userRouter.get('/check/nickname', isNicknameExist);
userRouter.get('/check/email', isEmailExist);

// 로그인
userRouter.post('/local/login', isNotLoggedIn, localLogin);
userRouter.post('/kakao/login', isNotLoggedIn, kakaoLogin);
userRouter.post('/refresh', refreshToken);
userRouter.post('/logout', isLoggedIn, logout);

userRouter.get('/profile', isLoggedIn, getProfile);

// 최근 검색어
userRouter.get('/recent', isLoggedIn, recentSearches); // 최근 검색어 조회
userRouter.delete('/recent/:searchTerm', isLoggedIn, delRecentSearch); // 최근 검색어 삭제

//등록 요청
userRouter.post('/requests/new', isLoggedIn, postWords);

// 요청 조회
userRouter.get('/requests', isLoggedIn, UserRequests); // 요청 목록 조회
userRouter.get('/requests/all', isLoggedIn, UserRequestsAll); // 모든 요청 목록 조회
userRouter.get('/role', isLoggedIn, getRole); // 사용자 역할 가져오기
userRouter.delete('/requests/:word', isLoggedIn, deleteRequest); // 사용자 요청 삭제
userRouter.post('/requests/:requestId', isLoggedIn, updateRequest); // 사용자 요청 수정

//요청 상태 변경
userRouter.post('/requests/:requestId/status', isLoggedIn, updateRequestState); // 사용자 요청 status 변경

module.exports = userRouter;
