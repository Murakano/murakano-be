const Word = require('./word.model');

exports.getSearchWords = async (searchTerm) => {
    return await Word.findOne({ word: { $regex: `^${searchTerm}$`, $options: 'i' } });
};

exports.getRankWords = async () => {
    const words = await Word.find().sort({ freq: -1 }).limit(10);
    return words.map((word) => word.word);
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
