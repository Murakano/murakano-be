const { createClient } = require('redis');

const conf = require('../../config');

const redisClient = createClient({
    url: `redis://${conf.redisUsername}:${conf.redisPassword}@${conf.redisHost}:${conf.redisPort}/0`,
    legacyMode: true,
});

redisClient.on('connect', () => {
    console.info('✅ Connected to Redis');
});

redisClient.on('error', (err) => {
    console.error('Redis Client Error', err);
});

redisClient.connect().then();
const redisCli = redisClient.v4;

module.exports = redisCli;
