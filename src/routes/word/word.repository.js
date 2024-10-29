const Word = require('./word.model');
const redisClient = require('../../common/modules/redis');

exports.getSearchWords = async (searchTerm) => {
    return await Word.findOne({ word: { $regex: `^${searchTerm}$`, $options: 'i' } });
};

exports.getRankWords = async () => {
    const words = await redisClient.sendCommand(['ZREVRANGE', 'popular_words', '0', '9']);

    if (words && words.length > 0) {
        return words;
    }

    const dbWords = await Word.find().sort({ freq: -1 }).limit(10).select('word freq').lean();
    const wordList = dbWords.map((word) => word.word);

    await redisClient.sendCommand([
        'ZADD',
        'popular_words',
        ...dbWords.flatMap((word) => [String(word.freq), word.word]),
    ]);
    await redisClient.expire('popular_words', 7200);

    return wordList;
};

exports.getRelatedWords = async (searchTerm, limit) => {
    const relatedWords = await Word.find({ word: new RegExp(searchTerm, 'i') })
        .sort({ freq: -1 })
        .limit(parseInt(limit));
    return relatedWords.map((word) => word.word);
};

exports.getAllWords = async (collation, sortOrder, skip, limit) => {
    return await Word.find().collation(collation).sort(sortOrder).skip(skip).limit(parseInt(limit, 10));
};

exports.findWordByRequest = async (word) => {
    return await Word.findOne({ word });
};

exports.addWord = async (word) => {
    const newWord = new Word(word);
    await newWord.save();
    return word;
};

exports.updateWord = async (existingWord, updatedFields) => {
    Object.assign(existingWord, updatedFields);
    await existingWord.save();
    return existingWord;
};

exports.deleteWordContributor = async (nickname) => {
    return await Word.updateMany({ suggestedBy: nickname }, { suggestedBy: null });
};

exports.checkDuplicateWord = async (escapedWord) => {
    return await Word.findOne({ word: { $regex: new RegExp(`^${escapedWord}$`, 'i') } });
};
