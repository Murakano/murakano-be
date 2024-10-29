const mongoose = require('mongoose');
const redisClient = require('../../common/modules/redis');

const wordSchema = new mongoose.Schema(
    {
        word: { type: String, required: true, unique: true },
        awkPron: { type: String },
        comPron: { type: String, required: true },
        info: { type: String },
        suggestedBy: { type: String, required: true },
        freq: { type: Number, default: 0 },
    },
    { timestamps: true }
);

wordSchema.index({ word: 1 });

wordSchema.post(/^findOne/, async function (doc) {
    const word = typeof this.getQuery().word === 'string' ? this.getQuery().word : doc?.word;
    if (!word) {
        console.error('❌ Error: No valid word found for Redis update');
        return;
    }

    await redisClient.sendCommand(['ZINCRBY', 'popular_words', '1', word]);
    await redisClient.expire('popular_words', 7200);
});

wordSchema.pre(/^find|update|save|remove|delete|count/, function (next) {
    this._startTime = Date.now();
    next();
});

wordSchema.post(/^find|update|save|remove|delete|count/, function (result, next) {
    const latency = Date.now() - this._startTime;
    console.log(`[${this.mongooseCollection.modelName}] ${this.op} query - ${latency}ms`);
    next();
});

module.exports = mongoose.model('Word', wordSchema);
