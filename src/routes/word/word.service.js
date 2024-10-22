const wordRepository = require('./word.repository');

exports.getSearchWords = async (searchTerm) => {
    return await wordRepository.getSearchWords(searchTerm);
};

exports.getRankWords = async () => {
    return await wordRepository.getRankWords();
};

exports.getRelatedWords = async (searchTerm, limit) => {
    return await wordRepository.getRelatedWords(searchTerm, limit);
};

exports.getAllWords = async (sort, page, limit) => {
    return await wordRepository.getAllWords(sort, page, limit);
};

exports.deleteWordContributor = async (_id) => {
    return await wordRepository.deleteWordContributor(_id);
};

exports.checkDuplicateWord = async (word) => {
    return await wordRepository.checkDuplicateWord(word);
};
