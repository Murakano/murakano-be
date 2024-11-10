const userService = require('../user/user.service');
const wordRepository = require('./word.repository');

exports.getSearchWords = async (searchTerm) => {
    const escapedSearchTerm = searchTerm.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    return await wordRepository.getSearchWords(escapedSearchTerm);
};

exports.getRankWords = async () => {
    return await wordRepository.getRankWords();
};

exports.getRelatedWords = async (searchTerm, limit) => {
    const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return await wordRepository.getRelatedWords(escapedTerm, limit);
};

exports.getAllWords = async (sort, page, limit) => {
    const skip = (page - 1) * limit;
    const sortOrder = {};
    const collation = { locale: 'en', strength: 2 };

    if (sort === 'asc' || sort === 'desc') {
        sortOrder.word = sort === 'asc' ? 1 : -1;
    } else if (sort === 'popularity') {
        sortOrder.freq = -1;
        sortOrder.word = 1;
    } else if (sort === 'recent') {
        sortOrder.createdAt = -1;
        sortOrder.word = 1;
    }
    return await wordRepository.getAllWords(collation, sortOrder, skip, limit);
};

exports.addWord = async (requestId, formData) => {
    const user = await userService.findUserByRequestId(requestId);
    if (!user) {
        throw new Error('User not found');
    }

    const request = user.requests.id(requestId);
    if (!request) {
        throw new Error('Request not found');
    }

    const newWord = {
        word: formData.devTerm,
        awkPron: formData.awkPron,
        comPron: formData.commonPron,
        info: formData.addInfo,
        suggestedBy: request.suggestedBy,
    };

    return await wordRepository.addWord(newWord);
};

exports.updateWord = async (requestId, formData) => {
    const user = await userService.findUserByRequestId(requestId);
    if (!user) {
        throw new Error('User not found');
    }

    const request = user.requests.id(requestId);
    if (!request) {
        throw new Error('Request not found');
    }

    const existingWord = await wordRepository.findWordByRequest(request.word);
    if (!existingWord) {
        throw new Error('Word not found');
    }

    const updatedFields = {
        word: formData.devTerm,
        awkPron: formData.awkPron,
        comPron: formData.commonPron,
        info: formData.addInfo,
        suggestedBy: request.suggestedBy,
    };

    return await wordRepository.updateWord(existingWord, updatedFields);
};

exports.deleteWordContributor = async (_id) => {
    const user = await userService.findUserById(_id);
    if (!user) {
        throw new Error('User not found');
    }
    return await wordRepository.deleteWordContributor(user.nickname);
};

exports.checkDuplicateWord = async (word) => {
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return await wordRepository.checkDuplicateWord(escapedWord);
};

exports.updateRecentWordIfLogined = async (req, searchTerm) => {
    const userId = req.user?._id;
    if (userId) {
        await userService.updateRecentSearch(userId, searchTerm);
    }
};
