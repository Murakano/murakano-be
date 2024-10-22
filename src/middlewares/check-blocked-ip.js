const redisClient = require('../common/modules/redis');
const ErrorMessage = require('../common/constants/error-message');

module.exports = async (req, res, next) => {
    const clientIp = req.headers['x-forwarded-for']
        ? req.headers['x-forwarded-for'].split(',')[0].trim()
        : req.connection.remoteAddress;

    try {
        const blockTime = await redisClient.get(clientIp);
        if (blockTime && blockTime > Date.now()) {
            return res.status(403).json({ message: ErrorMessage.TOO_MANY_REQUEST_ERROR });
        } else if (blockTime) {
            await redisClient.del(clientIp);
        }
    } catch (err) {
        console.error('Redis error:', err);
    }
    next();
};
