const express = require('express');
const morgan = require('morgan');
const passport = require('passport');
const session = require('express-session');
const helmet = require('helmet');
const cors = require('cors');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');

const ErrorMessage = require('../../constants/error-message');
const conf = require('../../config');
const passportConfig = require('../../passport');
const router = require('../../../routes/index');
const { commonLimiter } = require('../../utils/rateLimit');
const blacklistedIps = require('../../utils/blacklist');
const { swaggerUi, specs } = require('../../../swagger/swagger');

module.exports = expressLoader = (app) => {
    passportConfig();

    app.use(morgan('dev'));
    app.use(helmet());

    // 스크립트 보안 설정을 위한 난수 생성 ( xss 방어 )
    app.use((_, res, next) => {
        res.locals.nonce = crypto.randomBytes(16).toString('hex');
        next();
    });

    // Content Security Policy 설정, 위 난수 활용
    app.use((req, res, next) => {
        res.setHeader('Content-Security-Policy', `script-src 'self' 'nonce-${res.locals.nonce}';`);
        next();
    });

    // CORS 설정
    app.use((req, res, next) => {
        cors({
            credentials: true,
            origin: (origin, callback) => {
                if (
                    // whitelist에 있는 origin 허용
                    origin === undefined ||
                    conf.corsWhiteList.indexOf(origin) !== -1
                    // NOTE : EB Health Check도 origin undefind라 거부 당해서 임시 주석처리
                    // // whitelist에 있는 origin 허용
                    // (origin && conf.corsWhiteList.indexOf(origin) !== -1) ||
                    // // postman 허용
                    // (!origin &&
                    //     conf.corsUserAgent.split(',').some((agent) => req.headers['user-agent'].includes(agent)))
                ) {
                    return callback(null, true);
                }

                console.error(`Blocked CORS request from: ${origin}`);
                callback(new Error('CORS ERROR'));
            },
        })(req, res, next);
    });

    app.use(
        session({
            name: 'user',
            resave: false,
            saveUninitialized: false,
            secret: conf.cookieSecret,
            cookie: {
                // cleint 쿠키 접근 불가
                httpOnly: true,
                // TODO : prod = true , dev = false 로 변경
                secure: false,
                // 24h
                maxAge: 86400000,
            },
        })
    );

    // Passport 세팅
    app.use(passport.initialize());
    app.use(passport.session());

    // Body Parser 세팅
    app.use(
        express.json({
            limit: '50mb',
        })
    );

    // JSON Parser 세팅
    app.use(
        express.urlencoded({
            limit: '50mb',
            extended: true,
        })
    );

    // Cookie Parser 세팅
    app.use(cookieParser());

    // ip 블랙리스트
    app.use((req, res, next) => {
        const ip = req.ip;
        if (blacklistedIps.has(ip)) {
            const blockTime = blacklistedIps.get(ip);
            if (blockTime > Date.now()) {
                // 아직 차단 시간이 남아 있는 경우
                return res.status(403).json({
                    message: ErrorMessage.TOO_MANY_REQUEST_ERROR,
                });
            } else {
                // 차단 시간이 지난 경우, 블랙리스트에서 IP 제거
                blacklistedIps.delete(ip);
            }
        }
        next();
    });

    // Router 설정
    app.use(commonLimiter);
    app.use(router);
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }));

    app.all('*', (req, res) => {
        res.status(404).json(`Can't find ${req.originalUrl} on this server`);
    });
};
