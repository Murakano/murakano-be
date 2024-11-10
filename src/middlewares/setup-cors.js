const cors = require('cors');
const conf = require('../common/config');

// CORS 설정 미들웨어
module.exports = (req, res, next) => {
    cors({
        credentials: true,
        origin: (origin, callback) => {
            if (!origin || conf.corsWhiteList.includes(origin)) {
                return callback(null, true);
            }
            console.error(`Blocked CORS request from: ${origin}`);
            callback(new Error('CORS ERROR'));
        },
    })(req, res, next);
};
