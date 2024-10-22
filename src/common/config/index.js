const dotenv = require('dotenv');
const path = require('path');
const ErrorMessage = require('../constants/error-message');

const envPath = path.join(__dirname, '../../../.env');

const env = dotenv.config({ path: envPath });
if (env.error) {
    console.warn('.env 파일을 찾을 수 없습니다.');
}

const conf = {
    // server
    port: process.env.PORT,
    corsWhiteList: process.env.CORS_WHITELIST,
    corsUserAgent: process.env.CORS_USERAGENT,

    // database
    mongoURL: process.env.MONGO_URL,

    // jwt
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    cookieSecret: process.env.COOKIE_SECRET,

    // social login
    kakaoRestApiKey: process.env.KAKAO_REST_API_KEY,

    redisHost: process.env.REDIS_HOST,
    redisPort: process.env.REDIS_PORT,
    redisUsername: process.env.REDIS_USERNAME,
    redisPassword: process.env.REDIS_PASSWORD,
};

switch (process.env.NODE_ENV) {
    case 'production':
        conf.cookieInAccessTokenOptions = {
            httpOnly: false,
            maxAge: 10 * 60 * 1000,
            sameSite: 'Lax',
            domain: '.murakano.site',
            secure: true,
        };
        conf.cookieInRefreshTokenOptions = {
            httpOnly: true,
            maxAge: 12 * 60 * 60 * 1000,
            sameSite: 'Lax',
            domain: '.murakano.site',
            secure: true,
        };
        conf.cookieInRefreshTokenDeleteOptions = {
            httpOnly: true,
            maxAge: 0,
            sameSite: 'Lax',
            domain: '.murakano.site',
            secure: true,
        };
        conf.envMode = 'prod';
        break;
    case 'development':
        conf.cookieInAccessTokenOptions = {
            httpOnly: false,
            maxAge: 10 * 60 * 1000,
            sameSite: 'Lax',
        };
        conf.cookieInRefreshTokenOptions = {
            httpOnly: true,
            maxAge: 12 * 60 * 60 * 1000,
            sameSite: 'Lax',
        };
        conf.cookieInRefreshTokenDeleteOptions = {
            httpOnly: true,
            maxAge: 0,
            sameSite: 'Lax',
        };
        conf.envMode = 'dev';
        break;
    default:
        console.error(ErrorMessage.INVALID_NODE_ENV);
}

module.exports = conf;
