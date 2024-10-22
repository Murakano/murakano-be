const Word = require('./word.model');
const User = require('../user/user.model');

exports.getSearchWords = async (searchTerm) => {
    try {
        const escapedSearchTerm = searchTerm.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
        const searchWords = await Word.findOne({ word: { $regex: `^${escapedSearchTerm}$`, $options: 'i' } });

        if (!searchWords) {
            console.log('Search term not found in Word collection');
        }
        return searchWords;
    } catch (error) {
        console.log('Error while getting search words:', error);
        return null;
    }
};

exports.getRankWords = async () => {
    try {
        const words = await Word.find().sort({ freq: -1 }).limit(10);
        const wordNames = words.map((word) => word.word);
        return wordNames;
    } catch (error) {
        console.log('Error while getting rank words:', error);
        return null;
    }
};

exports.getRelatedWords = async (searchTerm, limit) => {
    try {
        const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const relatedWords = await Word.find({ word: new RegExp(escapedTerm, 'i') })
            .sort({ freq: -1 })
            .limit(parseInt(limit));
        const wordNames = relatedWords.map((word) => word.word);
        return wordNames;
    } catch (error) {
        console.log('Error while getting related words:', error);
        return null;
    }
};

exports.getAllWords = async (isSorted, page, limit) => {
    try {
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

        const words = await Word.find().collation(collation).sort(sortOrder).skip(skip).limit(parseInt(limit, 10));

        return words;
    } catch (error) {
        console.log('Error while getting all words:', error);
        return null;
    }
};

exports.addWord = async (requestId, formData) => {
    try {
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

        console.log('Word added successfully');
    } catch (error) {
        console.log('Error while adding word:', error);
        return null;
    }
};

exports.updateWord = async (requestId, formData) => {
    try {
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

        const wordToUpdate = await Word.findOne({ word: request.word });
        if (!wordToUpdate) {
            console.log('Word not found in Word collection');
            return null;
        }

        wordToUpdate.word = formData.devTerm;
        wordToUpdate.awkPron = formData.awkPron;
        wordToUpdate.comPron = formData.commonPron;
        wordToUpdate.info = formData.addInfo;
        wordToUpdate.suggestedBy = request.suggestedBy;

        await wordToUpdate.save();

        console.log('Word updated successfully');
        return wordToUpdate;
    } catch (error) {
        console.log('Error while updating word:', error);
        return null;
    }
};

exports.deleteWordContributor = async (_id) => {
    try {
        const user = await User.findById(_id);

        if (!user) {
            console.log('User not found');
            return null;
        }
        const nickname = user.nickname;

        const words = await Word.updateMany({ suggestedBy: nickname }, { suggestedBy: null });
        return words;
    } catch (error) {
        console.log('Error while deleting word contributor:', error);
        return null;
    }
};
exports.checkDuplicateWord = async (word) => {
    try {
        const escapedTerm = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const wordExists = await Word.findOne({ word: { $regex: new RegExp(`^${escapedTerm}$`, 'i') } });
        return wordExists;
    } catch (error) {
        console.log('Error while checking duplicate word:', error);
        return null;
    }
};
