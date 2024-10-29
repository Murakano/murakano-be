const cron = require('node-cron');
const redisClient = require('../redis');
const mongoose = require('mongoose');
const Word = require('../../../routes/word/word.model');

// NOTE : 매 정각마다 Redis 조회수를 DB에 반영
cron.schedule('0 * * * *', async () => {
    try {
        const popularWordsRaw = await redisClient.sendCommand(['ZRANGE', 'popular_words', '0', '-1', 'WITHSCORES']);
        console.log('popularWordsRaw:', popularWordsRaw);

        const updates = [];
        for (let i = 0; i < popularWordsRaw.length; i += 2) {
            const word = popularWordsRaw[i];
            const redisFreq = Number(popularWordsRaw[i + 1]);

            // NOTE : word 스키마의 조회수 증가 미들웨어를 우회하기 위해 Mongoose 대신 MongoDB 드라이버를 사용
            const dbWord = await mongoose.connection.collection('words').findOne({ word }, { projection: { freq: 1 } });
            const dbFreq = dbWord ? dbWord.freq : 0;

            if (redisFreq !== dbFreq) {
                updates.push({
                    updateOne: {
                        filter: { word },
                        update: { freq: redisFreq },
                    },
                });
            }
        }
        if (updates.length > 0) {
            await Word.bulkWrite(updates);
            console.log('✅ Redis 조회수를 DB에 성공적으로 동기화했습니다.');
        } else {
            console.log('ℹ️ 이미 동기화된 조회수입니다.');
        }
    } catch (error) {
        console.error('❌ Redis와 DB 동기화 중 오류 발생:', error);
    }
});
