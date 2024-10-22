const crypto = require('crypto');

module.exports = (_, res, next) => {
    res.locals.nonce = crypto.randomBytes(16).toString('hex');
    next();
};
