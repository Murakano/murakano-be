const Word = require('./word.model');
const User = require('../user/user.model');

exports.getSearchWords = async (searchTerm) => {
    try {
        // 대소문자 구분 없이 검색어를 찾기 위한 정규 표현식 사용
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

// 전체 단어목록 조회, 정렬 별 조건함수
exports.getAllWords = async (isSorted, page, limit) => {
    try {
        const skip = (page - 1) * limit;
        const sortOrder = {};
        const collation = { locale: 'en', strength: 2 }; // 대소문자 구분 없이 정렬하기 위한 collation 설정

        if (isSorted === 'asc' || isSorted === 'desc') {
            sortOrder.word = isSorted === 'asc' ? 1 : -1;
        } else if (isSorted === 'popularity') {
            sortOrder.freq = -1;
            sortOrder.word = 1; // freq가 동일한 경우 word 오름차��으로 정��
        } else if (isSorted === 'recent') {
            sortOrder.createdAt = -1;
            sortOrder.word = 1; // createdAt이 동일한 경우 단어 오름차순으로 정렬
        }

        const words = await Word.find()
            .collation(collation) // collation을 추가하여 대소문자 구분 없이 정렬
            .sort(sortOrder)
            .skip(skip)
            .limit(parseInt(limit, 10));

        return words;
    } catch (error) {
        console.log('Error while getting all words:', error);
        return null;
    }
};

exports.addWord = async (requestId, formData) => {
    try {
        // requestId에 해당하는 request를 찾습니다.
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
        // requestId에 해당하는 request를 찾습니다.
        console.log('updateWord 레포진입!!!!!!!!!!!!', requestId, formData);
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
        // request.word와 같은 word를 Word 스키마에서 찾습니다.
        const wordToUpdate = await Word.findOne({ word: request.word });
        if (!wordToUpdate) {
            console.log('Word not found in Word collection');
            return null;
        }

        // word 데이터를 request 데이터로 업데이트합니다.
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
    // _id가 일치하는 유저의 닉네임 값을 가져오고, 해당 유저가 suggestedBy로 있는 모든 단어의 suggestedBy를 null로 변경
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
        console.log('wordExists:', wordExists);
        return wordExists;
    } catch (error) {
        console.log('Error while checking duplicate word:', error);
        return null;
    }
};
