module.exports = (req, res, next) => {
    const startTime = Date.now();

    res.on('finish', () => {
        const latency = Date.now() - startTime;
        console.log(`API Latency for ${req.method} ${req.originalUrl}: ${latency}ms\n`);
    });

    next();
};
