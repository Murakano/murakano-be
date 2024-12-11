const cron = require('node-cron');

cron.schedule('*/10 * * * *', async () => {
    try {
        await fetch('https://app.murakano.site');
        console.log('FE Warmup successful');
    } catch (error) {
        console.error('FE Warmup failed:', error);
    }
});
