const Word = require('./word.model');
const User = require('../user/user.model');

exports.getSearchWords = async (searchTerm) => {
    const escapedSearchTerm = searchTerm.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    return await Word.findOne({ word: { $regex: `^${escapedSearchTerm}$`, $options: 'i' } });
};

exports.getRankWords = async () => {
    return await Word.find()
        .sort({ freq: -1 })
        .limit(10)
        .map((word) => word.word);
};

exports.getRelatedWords = async (searchTerm, limit) => {
    const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const relatedWords = await Word.find({ word: new RegExp(escapedTerm, 'i') })
        .sort({ freq: -1 })
        .limit(parseInt(limit));
    return relatedWords.map((word) => word.word);
};

exports.getAllWords = async (isSorted, page, limit) => {
    const skip = (page - 1) * limit;
    const sortOrder = {};
    const collation = { locale: 'en', strength: 2 };

    if (isSorted === 'asc' || isSorted === 'desc') {
        sortOrder.word = isSorted === 'asc' ? 1 : -1;
    } else if (isSorted === 'popularity') {
        sortOrder.freq = -1;
        sortOrder.word = 1;
    } else if (isSorted === 'recent') {
        sortOrder.createdAt = -1;
        sortOrder.word = 1;
    }

    return await Word.find().collation(collation).sort(sortOrder).skip(skip).limit(parseInt(limit, 10));
};

exports.addWord = async (requestId, formData) => {
    const user = await User.findOne({ 'requests._id': requestId });
    if (!user) {
        console.log('User with the given request not found');
        return null;
    }

    const request = user.requests.id(requestId);
    if (!request) {
        console.log('Request not found');
        return null;
    }

    const newWord = new Word({
        word: formData.devTerm,
        awkPron: formData.awkPron,
        comPron: formData.commonPron,
        info: formData.addInfo,
        suggestedBy: request.suggestedBy,
    });

    await newWord.save();
};

exports.updateWord = async (requestId, formData) => {
    const user = await User.findOne({ 'requests._id': requestId });
    if (!user) {
        console.log('User with the given request not found');
        return null;
    }

    const request = user.requests.id(requestId);
    if (!request) {
        console.log('Request not found');
        return null;
    }

    const findWord = await Word.findOne({ word: request.word });
    if (!findWord) {
        console.log('Word not found in Word collection');
        return null;
    }

    updateWordFields(findWord, formData, request);

    await findWord.save();

    return findWord;
};

exports.deleteWordContributor = async (_id) => {
    const user = await User.findById(_id);
    if (!user) {
        return null;
    }
    return await Word.updateMany({ suggestedBy: user.nickname }, { suggestedBy: null });
};
exports.checkDuplicateWord = async (word) => {
    const escapedTerm = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return await Word.findOne({ word: { $regex: new RegExp(`^${escapedTerm}$`, 'i') } });
};

const updateWordFields = (wordToUpdate, formData, request) => {
    wordToUpdate.word = formData.devTerm;
    wordToUpdate.awkPron = formData.awkPron;
    wordToUpdate.comPron = formData.commonPron;
    wordToUpdate.info = formData.addInfo;
    wordToUpdate.suggestedBy = request.suggestedBy;
};
