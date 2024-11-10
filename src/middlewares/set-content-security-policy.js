module.exports = (_, res, next) => {
    res.setHeader('Content-Security-Policy', `script-src 'self' 'nonce-${res.locals.nonce}';`);
    next();
};
