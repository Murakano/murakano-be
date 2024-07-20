const rateLimit = require('express-rate-limit');
const blacklistedIps = require('./blacklist');
const BLOCK_DURATION = 60 * 60 * 1000;

//* 사용량 제한 미들웨어. 도스 공격 방지
exports.postApiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1분 간격
    max: 15, // windowMs동안 최대 호출 횟수
    handler(req, res) {
        const ip = req.ip;
        blacklistedIps.set(ip, Date.now() + BLOCK_DURATION);
        // 제한 초과 시 콜백 함수
        res.status(this.statusCode).json({
            message: '1분에 15번만 요청 할 수 있습니다.',
        });
    },
});

exports.commonLimiter = rateLimit({
    windowMs: 60 * 1000, // 1분 간격
    // TODO : 100으로 줄이기
    max: 200, // windowMs동안 최대 호출 횟수
    handler(req, res) {
        const ip = req.ip;
        blacklistedIps.set(ip, Date.now() + BLOCK_DURATION);
        // 제한 초과 시 콜백 함수
        res.status(this.statusCode).json({
            message: '1분에 200번만 요청 할 수 있습니다.',
        });
    },
});
