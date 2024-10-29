const mongoose = require('mongoose');

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

wordSchema.pre(/^findOne/, async function (next) {
    await this.model.updateOne(this.getQuery(), { $inc: { freq: 1 } });
    next();
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
