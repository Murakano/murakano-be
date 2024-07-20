const rateLimit = require('express-rate-limit');
const redisClient = require('../modules/redis');
const BLOCK_DURATION = 60 * 60 * 1000;

//* 사용량 제한 미들웨어. 도스 공격 방지
exports.commonLimiter = rateLimit({
    windowMs: 60 * 1000, // 1분 간격
    max: 200, // windowMs동안 최대 호출 횟수
    handler: async (req, res) => {
        const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        try {
            await redisClient.set(clientIp, Date.now() + BLOCK_DURATION);
            // 1시간 후 제거
            await redisClient.expire(clientIp, BLOCK_DURATION / 1000);
        } catch (err) {
            console.error('Redis error:', err);
        }
        res.status(429).json({
            message: '1분에 15번만 요청 할 수 있습니다.',
        });
    },
});
