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
const { generateAccessToken, generateRefreshToken } = require('../../common/utils/auth');
const { getKakaoToken, getUserInfo } = require('../../common/utils/kakao');
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
    data = { isUserExist };

    if (isUserExist) {
        return sendResponse.ok(res, {
            message: ErrorMessage.EXIST_NICKNAME,
            data,
        });
    }

    return sendResponse.ok(res, {
        message: SuccessMessage.AVAILABLE_NICKNAME,
        data,
    });
}, ErrorMessage.NICKNAME_CHECK_ERROR);

exports.isEmailExist = catchAsync(async (req, res) => {
    const { email } = validateRequest(emailCheckReqQuerySchema, req.query);

    const isUserExist = await userService.isEmailExist(email);
    const data = { isUserExist };

    if (isUserExist) {
        return sendResponse.ok(res, {
            message: ErrorMessage.EXIST_EMAIL,
            data,
        });
    }
    return sendResponse.ok(res, {
        message: SuccessMessage.AVAILABLE_EMAIL,
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

        res.cookie('refreshToken', tokens.refreshToken, config.cookieInRefreshTokenOptions);

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
    const { kakaoAccessToken } = await getKakaoToken(code);
    const { snsId, email, nickname } = await getUserInfo(kakaoAccessToken);

    const kakaoUser = { snsId: snsId, email, nickname, provider: 'kakao' };

    let user = await userService.isKaKaoUserExist(kakaoUser.snsId);
    if (!user) {
        user = await userService.kakaoRegister(kakaoUser);
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await redisClient.set(user.email, refreshToken);
    await redisClient.expire(user.email, config.cookieInRefreshTokenOptions.maxAge / 1000);
    res.cookie('refreshToken', refreshToken, config.cookieInRefreshTokenOptions);

    sendResponse.ok(res, {
        message: SuccessMessage.LOGIN_SUCCESSS,
        data: {
            accessToken: accessToken,
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

        const storedRefreshToken = await redisClient.get(user.email);

        if (storedRefreshToken !== refreshToken) {
            console.error('Refresh token mismatch');
            await redisClient.del(user.email);
            res.clearCookie('refreshToken', config.cookieInRefreshTokenDeleteOptions);
            return sendResponse.unAuthorized(res, {
                message: ErrorMessage.REFRESH_TOKEN_MISMATCH,
            });
        }

        const newAccessToken = generateAccessToken({
            _id: user.userId,
            nickname: user.nickname,
            email: user.email,
        });
        const newRefreshToken = generateRefreshToken({
            _id: user.userId,
            nickname: user.nickname,
            email: user.email,
        });

        await redisClient.set(user.email, newRefreshToken);
        await redisClient.expire(user.email, config.cookieInRefreshTokenOptions.maxAge / 1000);
        res.cookie('refreshToken', newRefreshToken, config.cookieInRefreshTokenOptions);

        sendResponse.ok(res, {
            message: SuccessMessage.REFRESH_TOKEN,
            data: {
                accessToken: newAccessToken,
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
        try {
            const email = req.user.email;
            await redisClient.del(email);
        } catch (err) {
            console.error('Redis error:', err);
        }
    }

    res.clearCookie('refreshToken', config.cookieInRefreshTokenDeleteOptions);
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

exports.postWords = async (req, res) => {
    try {
        const validData = validateRequest(requestBodySchema, req.body);
        const { _id } = req.user;
        const { formData, type, nickname } = validData;
        const result = await userService.postWords(_id, formData, nickname, type);
        sendResponse.ok(res, {
            message: SuccessMessage.REGISTER_WORDS_SUCCESS,
            data: result,
        });
    } catch (error) {
        console.log(error);
        if (error?.type === 'ajv') {
            return sendResponse.badRequest(res, ErrorMessage.ADD_REQUEST_WORDS_ERROR);
        }
        sendResponse.fail(req, res, ErrorMessage.REQUEST_DUPLICATE_ERROR);
    }
};

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
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
        try {
            const email = req.user.email;
            await redisClient.del(email);
        } catch (err) {
            console.error('Redis error:', err);
        }
    }
    res.clearCookie('refreshToken', config.cookieInRefreshTokenDeleteOptions);

    const { _id } = req.user;
    await wordService.deleteWordContributor(_id);
    await userService.deleteUser(_id);
    sendResponse.ok(res, {
        message: SuccessMessage.DELETE_USER_SUCCESS,
    });
}, ErrorMessage.DELETE_USER_ERROR);
