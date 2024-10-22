const cors = require('cors');
const crypto = require('crypto');
const helmet = require('helmet');
const morgan = require('morgan');
const express = require('express');
const passport = require('passport');
const cookieParser = require('cookie-parser');

const conf = require('../../config');
const router = require('../../../routes/index');
const passportConfig = require('../../passport');
const redisClient = require('../../modules/redis');
const { commonLimiter } = require('../../utils/rateLimit');
const ErrorMessage = require('../../constants/error-message');
const { swaggerUi, specs } = require('../../../swagger/swagger');

module.exports = expressLoader = (app) => {
    passportConfig();

    app.use(morgan('dev'));
    app.use(helmet());

    app.use((_, res, next) => {
        res.locals.nonce = crypto.randomBytes(16).toString('hex');
        next();
    });

    app.use((_, res, next) => {
        res.setHeader('Content-Security-Policy', `script-src 'self' 'nonce-${res.locals.nonce}';`);
        next();
    });

    app.use((req, res, next) => {
        cors({
            credentials: true,
            origin: (origin, callback) => {
                if (!origin || conf.corsWhiteList.indexOf(origin) !== -1) {
                    return callback(null, true);
                }
                console.error(`Blocked CORS request from: ${origin}`);
                callback(new Error('CORS ERROR'));
            },
        })(req, res, next);
    });

    app.use(passport.initialize());

    app.use(
        express.json({
            limit: '50mb',
        })
    );

    app.use(
        express.urlencoded({
            limit: '50mb',
            extended: true,
        })
    );

    app.use(cookieParser());

    // TODO : 메서드 추출 및 리팩터링 필요
    app.use(async (req, res, next) => {
        // TODO : PROD 체크 후 삭제
        const clientIp = req.headers['x-forwarded-for']
            ? req.headers['x-forwarded-for'].split(',')[0].trim()
            : req.connection.remoteAddress;
        try {
            const blockTime = await redisClient.get(clientIp);
            if (blockTime && blockTime > Date.now()) {
                return res.status(403).json({
                    message: ErrorMessage.TOO_MANY_REQUEST_ERROR,
                });
            } else if (blockTime) {
                await redisClient.del(clientIp);
            }
        } catch (err) {
            console.error('Redis error:', err);
        }
        next();
    });

    app.use(commonLimiter);
    app.use(router);
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }));

    app.all('*', (req, res) => {
        res.status(404).json(`Can't find ${req.originalUrl} on this server`);
    });
};
