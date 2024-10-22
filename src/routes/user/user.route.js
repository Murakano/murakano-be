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

userRouter.post('/register', isNotLoggedIn, register);
userRouter.get('/check/nickname', isNicknameExist);
userRouter.get('/check/email', isEmailExist);

userRouter.post('/local/login', isNotLoggedIn, localLogin);
userRouter.post('/kakao/login', isNotLoggedIn, kakaoLogin);
userRouter.post('/refresh', refreshToken);
userRouter.post('/logout', isLoggedIn, logout);

userRouter.get('/profile', isLoggedIn, getProfile);

userRouter.get('/recent', isLoggedIn, recentSearches);
userRouter.delete('/recent/:searchTerm', isLoggedIn, delRecentSearch);

userRouter.post('/requests/new', isLoggedIn, postWords);

userRouter.get('/requests', isLoggedIn, UserRequests);
userRouter.get('/requests/all', isLoggedIn, UserRequestsAll);
userRouter.get('/role', isLoggedIn, getRole);
userRouter.delete('/requests/:word', isLoggedIn, deleteRequest);
userRouter.post('/requests/:requestId', isLoggedIn, updateRequest);

userRouter.post('/requests/:requestId/status', isLoggedIn, updateRequestState);

module.exports = userRouter;
