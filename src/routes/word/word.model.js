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

module.exports = mongoose.model('Word', wordSchema);
