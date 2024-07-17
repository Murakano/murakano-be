const mongoose = require('mongoose');

const wordSchema = new mongoose.Schema(
    {
        word: { type: String, required: true, unique: true }, //콜렉션 이름과 겹치는데 상관없나..
        awkPron: { type: String }, // 어색한 발음
        comPron: { type: String, required: true }, // 일반적인 발음
        info: { type: String }, //추가정보
        suggestedBy: { type: String, required: true }, // 제안한 사용자의 닉네임
        freq: { type: Number, default: 0 }, // 인기검색어
    },
    { timestamps: true }
);

// 검색 시마다 검색어의 freq를 1씩 증가시키는 미들웨어
wordSchema.pre(/^findOne/, async function (next) {
    await this.model.updateOne(this.getQuery(), { $inc: { freq: 1 } });
    next();
});

module.exports = mongoose.model('Word', wordSchema);
