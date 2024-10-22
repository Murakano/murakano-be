const jwt = require('jsonwebtoken');
const passport = require('passport');
const config = require('../config');

exports.generateAccessToken = (user) => {
    return jwt.sign({ userId: user._id, nickname: user.nickname, email: user.email }, config.jwtAccessSecret, {
        expiresIn: '10m',
    });
};

exports.generateRefreshToken = (user) => {
    return jwt.sign({ userId: user._id, nickname: user.nickname, email: user.email }, config.jwtRefreshSecret, {
        expiresIn: '12h',
    });
};

const authenticateJWT = (req, res) => {
    return new Promise((resolve, reject) => {
        passport.authenticate('jwt', { session: false }, (err, user, info) => {
            if (err) {
                return reject({ status: 500, message: '서버 오류', error: err.message });
            }
            if (info) {
                console.log(info.name);
                switch (info.name) {
                    case 'TokenExpiredError':
                        return reject({ status: 401, message: '토큰이 만료되었습니다.', expiredAt: info.expiredAt });
                    case 'JsonWebTokenError':
                        return reject({ status: 401, message: '유효하지 않은 토큰입니다.' });
                    default:
                        return reject({ status: 401, message: '인증되지 않은 사용자' });
                }
            }
            if (!user) {
                return reject({ status: 401, message: '로그인이 필요합니다.' });
            }
            resolve(user);
        })(req, res);
    });
};

exports.isLoggedIn = async (req, res, next) => {
    try {
        const user = await authenticateJWT(req, res);
        req.user = user;
        next();
    } catch (error) {
        res.status(error.status).json({
            message: error.message,
        });
    }
};

exports.isNotLoggedIn = async (req, res, next) => {
    try {
        await authenticateJWT(req, res);
        res.status(403).json({ message: '이미 로그인된 상태입니다.' });
    } catch (error) {
        if (error.status === 401) {
            next();
        } else {
            res.status(error.status).json({ message: error.message });
        }
    }
};

exports.isUser = async (req, res, next) => {
    try {
        const user = await authenticateJWT(req, res);
        req.user = user;
        next();
    } catch (err) {
        next();
    }
};
