const passport = require('passport');
const jwt = require('jsonwebtoken');
const config = require('../../common/config');
const redisClient = require('../../common/modules/redis');

const userService = require('./user.service');
const wordService = require('../word/word.service');
const sendResponse = require('../../common/utils/response-handler');
const ErrorMessage = require('../../common/constants/error-message');
const SuccessMessage = require('../../common/constants/success-message');
const { validateRequest } = require('../../common/utils/request.validator');
const {
    nicknameCheckReqQuerySchema,
    registerBodySchema,
    emailCheckReqQuerySchema,
    loginBodySchema,
    requestBodySchema,
} = require('./user.schema');
const { catchAsync } = require('../../common/utils/catch-async');

exports.register = catchAsync(async (req, res) => {
    const validData = validateRequest(registerBodySchema, req.body);
    const newUser = await userService.register(validData);

    const data = { user_id: newUser._id };
    sendResponse.created(res, {
        message: SuccessMessage.REGISTER_SUCCESSS,
        data,
    });
}, ErrorMessage.REGISTER_ERROR);

exports.isNicknameExist = catchAsync(async (req, res) => {
    const { nickname } = validateRequest(nicknameCheckReqQuerySchema, req.query);
    const isUserExist = await userService.isNicknameExist(nickname);

    const data = { isUserExist };
    const message = isUserExist ? ErrorMessage.EXIST_NICKNAME : SuccessMessage.AVAILABLE_NICKNAME;

    return sendResponse.ok(res, {
        message,
        data,
    });
}, ErrorMessage.NICKNAME_CHECK_ERROR);

exports.isEmailExist = catchAsync(async (req, res) => {
    const { email } = validateRequest(emailCheckReqQuerySchema, req.query);

    const isUserExist = await userService.isEmailExist(email);
    const data = { isUserExist };
    const message = isUserExist ? ErrorMessage.EXIST_EMAIL : SuccessMessage.AVAILABLE_EMAIL;

    return sendResponse.ok(res, {
        message,
        data,
    });
}, ErrorMessage.EMAIL_CHECK_ERROR);

exports.localLogin = catchAsync(async (req, res, next) => {
    req.body = validateRequest(loginBodySchema, req.body);
    passport.authenticate('local', async (authError, user, info) => {
        if (authError) {
            console.error(authError);
            return next(authError);
        }
        if (!user) {
            return sendResponse.unAuthorized(res, { message: info.message });
        }

        const tokens = await userService.handleLogin(user);
        setRefreshTokenCookie(res, tokens.refreshToken);

        return sendResponse.ok(res, {
            message: SuccessMessage.LOGIN_SUCCESSS,
            data: {
                accessToken: tokens.accessToken,
            },
        });
    })(req, res, next);
}, ErrorMessage.LOGIN_ERROR);

exports.kakaoLogin = catchAsync(async (req, res) => {
    const { code } = req.body;
    const tokens = await userService.handleKakaoLogin(code);
    setRefreshTokenCookie(res, tokens.refreshToken);

    sendResponse.ok(res, {
        message: SuccessMessage.LOGIN_SUCCESSS,
        data: {
            accessToken: tokens.accessToken,
        },
    });
}, ErrorMessage.KAKAO_LOGIN_ERROR);

exports.refreshToken = catchAsync(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        // NOTE : 로그인 하지 않은 유저도 refresh token이 없는 경우에 해당하기 때문에, ok로 응답
        return sendResponse.ok(res, {
            message: ErrorMessage.NO_REFRESH_TOKEN,
        });
    }

    jwt.verify(refreshToken, config.jwtRefreshSecret, async (err, user) => {
        if (err) {
            return sendResponse.forbidden(res, {
                message: ErrorMessage.REFRESH_TOKEN_ERROR,
            });
        }

        const tokens = await userService.refreshTokens(user, refreshToken);
        setRefreshTokenCookie(res, tokens.refreshToken);
        sendResponse.ok(res, {
            message: SuccessMessage.REFRESH_TOKEN,
            data: {
                accessToken: tokens.accessToken,
            },
        });
    });
}, ErrorMessage.REFRESH_TOKEN_ERROR);

exports.getProfile = (req, res) => {
    const { _id, nickname, email } = req.user;
    const data = { _id, nickname, email };
    sendResponse.ok(res, {
        message: SuccessMessage.GET_PROFILE_SUCCESS,
        data,
    });
};

exports.logout = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
        await userService.logout(req.user.email);
    }
    clearRefreshTokenCookie(res);
    return sendResponse.ok(res, {
        message: SuccessMessage.LOGOUT_SUCCESS,
    });
};

exports.recentSearches = catchAsync(async (req, res) => {
    const { _id } = req.user;
    const recentSearches = await userService.getRecentSearches(_id);
    sendResponse.ok(res, {
        message: SuccessMessage.RECENT_WORDS_SUCCESS,
        data: { recentSearches },
    });
}, ErrorMessage.RECENT_WORDS_ERROR);

exports.delRecentSearch = catchAsync(async (req, res) => {
    const { _id } = req.user;
    const { searchTerm } = req.params;
    await userService.delRecentSearch(_id, searchTerm);
    sendResponse.ok(res, {
        message: SuccessMessage.DELETE_RECENT_WORD_SUCCESS,
    });
}, ErrorMessage.DELETE_RECENT_WORD_ERROR);

exports.postWords = catchAsync(async (req, res) => {
    const validData = validateRequest(requestBodySchema, req.body);
    const { _id } = req.user;
    const { formData, type, nickname } = validData;
    const result = await userService.postWords(_id, formData, nickname, type);
    sendResponse.ok(res, {
        message: SuccessMessage.REGISTER_WORDS_SUCCESS,
        data: result,
    });
}, ErrorMessage.REQUEST_DUPLICATE_ERROR);

exports.UserRequests = catchAsync(async (req, res) => {
    const { _id } = req.user;
    const requests = await userService.getUserRequests(_id);
    sendResponse.ok(res, {
        message: SuccessMessage.GET_REQUESTS_SUCCESS,
        data: { requests },
    });
}, ErrorMessage.GET_REQUESTS_ERROR);

exports.UserRequestsAll = catchAsync(async (req, res) => {
    const requests = await userService.getUserRequestsAll();
    sendResponse.ok(res, {
        message: SuccessMessage.GET_REQUESTS_SUCCESS,
        data: { requests },
    });
}, ErrorMessage.GET_REQUESTS_ERROR);

exports.deleteRequest = catchAsync(async (req, res) => {
    const { _id } = req.user;
    const { word } = req.params;
    await userService.deleteRequest(_id, word);
    sendResponse.ok(res, {
        message: SuccessMessage.DELETE_REQUEST_SUCCESS,
    });
}, ErrorMessage.DELETE_REQUEST_ERROR);

exports.getRole = catchAsync(async (req, res) => {
    const { _id } = req.user;
    const role = await userService.getRole(_id);
    sendResponse.ok(res, {
        message: SuccessMessage.GET_ROLE_SUCCESS,
        data: { role },
    });
});

exports.updateRequest = catchAsync(async (req, res) => {
    const { requestId } = req.params;
    const { formData } = req.body;
    await userService.updateRequest(requestId, formData);
    sendResponse.ok(res, {
        message: SuccessMessage.UPDATE_REQUEST_SUCCESS,
    });
});

exports.updateRequestState = catchAsync(async (req, res) => {
    const { _id } = req.user;
    const { requestId } = req.params;
    const { status, formData, requestType } = req.body;

    await userService.updateRequestState(_id, requestId, status, formData, requestType);
    sendResponse.ok(res, {
        message: SuccessMessage.UPDATE_REQUEST_STATE_SUCCESS,
    });
}, ErrorMessage.UPDATE_REQUEST_STATE_ERROR);

exports.deleteUser = catchAsync(async (req, res) => {
    const { _id } = req.user;
    if (req.cookies.refreshToken) {
        await userService.logout(req.user.email);
    }

    clearRefreshTokenCookie(res);
    await userService.deleteUserAndRelatedData(_id);
    sendResponse.ok(res, {
        message: SuccessMessage.DELETE_USER_SUCCESS,
    });
}, ErrorMessage.DELETE_USER_ERROR);

const setRefreshTokenCookie = (res, refreshToken) => {
    res.cookie('refreshToken', refreshToken, config.cookieInRefreshTokenOptions);
};

const clearRefreshTokenCookie = (res) => {
    res.clearCookie('refreshToken', config.cookieInRefreshTokenDeleteOptions);
};
