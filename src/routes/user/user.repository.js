const User = require('./user.model');

exports.createUser = async (userData) => {
    try {
        const user = await User.create(userData);
        return user;
    } catch (err) {
        console.log(err);
    }
};

exports.findUserByNickname = async (nickname) => {
    const userExists = await User.exists({ nickname });
    return userExists ? true : false;
};

exports.findUserByEmail = async (email) => {
    const userExists = await User.exists({ email });
    return userExists ? true : false;
};

exports.getUserBySnsId = async (snsId) => {
    const user = await User.findOne({ snsId, provider: 'kakao' });
    return user;
};

exports.getRecentSearches = async (_id) => {
    try {
        // 사용자 문서를 찾고 recentSearches 배열만 선택합니다.
        const user = await User.findById(_id).select('recentSearches').exec();

        // 최근 검색어 배열을 필터링, 정렬하고 상위 10개를 선택합니다.
        // recentSearches가 정의되지 않았을 경우 빈 배열로 처리합니다.
        const recentSearches = (user.recentSearches || [])
            .filter((search) => !search.deletedAt) // 삭제되지 않은 검색어만 선택
            .sort((a, b) => b.updatedAt - a.updatedAt) // 최근 검색순으로 정렬
            .slice(0, 10); // 상위 10개 선택

        // 검색어만 반환
        return recentSearches.map((search) => search.searchTerm);
    } catch (err) {
        console.error(err);
        return []; // 오류 발생 시 빈 배열 반환
    }
};

exports.delRecentSearch = async (_id, searchTerm) => {
    try {
        await User.findOneAndUpdate(
            { _id, 'recentSearches.searchTerm': searchTerm, 'recentSearches.deletedAt': null },
            { $set: { 'recentSearches.$.deletedAt': Date.now() } }
        );
    } catch (err) {
        console.error(err);
    }
};

exports.updateRecentSearch = async (_id, searchTerm) => {
    try {
        console.log('id', _id);
        console.log('searchTerm', searchTerm);
        const user = await User.findById(_id).exec();
        if (!user) {
            console.log('User not found');
        }
        const recentSearch = user.recentSearches.find((search) => search.searchTerm === searchTerm);
        console.log('recentSearch', recentSearch);
        if (recentSearch) {
            // 검색어가 이미 존재하는 경우
            if (recentSearch.deletedAt) {
                // deletedAt이 null이 아닌 경우, deletedAt을 null로 바꾸고 updatedAt 수정
                recentSearch.deletedAt = null;
            }
            // updatedAt만 수정
            recentSearch.updatedAt = Date.now();
        } else {
            // 검색어가 존재하지 않는 경우, updatedAt과 용어 추가
            user.recentSearches.push({ searchTerm, updatedAt: Date.now() });
        }

        await user.save();
    } catch (err) {
        console.error(err);
    }
};

// 단어 추가 및 수정
exports.postWords = async (userId, formData, nickname, type) => {
    try {
        const user = await User.findById(userId).exec();
        if (!user) {
            throw new Error('User not found');
        }

        console.log('User before modification:', JSON.stringify(user.requests, null, 2));

        // 이미 존재하는 단어 요청 확인 (status가 'pend'인 경우에만 중복 확인)
        const existingRequest = user.requests.find(
            (req) => req.word === formData.devTerm && req.status === 'pend' && req.deletedAt === 'null'
        );
        if (existingRequest) {
            console.log('이미 같은 단어 요청이 존재합니다.');
            throw new Error('Word request already exists');
        }

        if (type === 'add') {
            user.requests.push({
                word: formData.devTerm,
                info: formData.addInfo,
                awkPron: formData.awkPron,
                comPron: formData.commonPron,
                deletedAt: null,
                status: 'pend',
                type: 'add',
                suggestedBy: nickname, // nickname 추가
            });
        } else if (type === 'mod') {
            user.requests.push({
                word: formData.devTerm,
                info: formData.addInfo,
                awkPron: formData.awkPron,
                comPron: formData.commonPron,
                deletedAt: null,
                status: 'pend',
                type: 'mod',
                suggestedBy: nickname, // nickname 추가
            });
        } else {
            throw new Error('Invalid type');
        }

        await user.save();
        console.log('User after modification:', JSON.stringify(user.requests, null, 2));
        return user.requests.find((req) => req.word === formData.devTerm);
    } catch (err) {
        console.error(err);
        throw err;
    }
};

exports.getUserRequests = async (userId) => {
    try {
        const user = await User.findById(userId).select('requests').exec();
        if (!user) {
            throw new Error('User not found');
        }
        // requests 배열에서 deletedAt이 null인 항목만 필터링
        const activeRequests = user.requests.filter((request) => request.deletedAt === null);
        return activeRequests;
    } catch (err) {
        console.error(err);
    }
};

exports.getUserRequestsAll = async () => {
    try {
        const users = await User.find({}, { requests: 1, _id: 0 }); // 모든 유저의 requests 필드만 가져옴
        const allRequests = [];

        users.forEach((user) => {
            user.requests.forEach((request) => {
                if (request.deletedAt === null) {
                    allRequests.push(request);
                }
            });
        });

        return allRequests;
    } catch (err) {
        console.error(err);
    }
};

exports.deleteRequest = async (userId, requestWord) => {
    try {
        const user = await User.findById(userId).select('requests').exec();
        if (!user) {
            console.log('사용자를 찾을 수 없음');
            throw new Error('User not found');
        }

        const request = user.requests.find((req) => req.word === requestWord && req.deletedAt === null);
        if (request) {
            console.log('삭제할 요청 찾음:', request);
            request.deletedAt = Date.now(); // 요청을 삭제로 표시
            await user.save();

            console.log('요청 삭제 성공');
        } else {
        }
    } catch (err) {
        console.error(err);
    }
};

exports.getRole = async (userId) => {
    try {
        const user = await User.findById(userId).select('role').exec();
        return user.role;
    } catch (err) {
        console.error(err);
    }
};

exports.updateRequest = async (requestId, formData) => {
    try {
        const user = await User.findOne({ 'requests._id': requestId }).select('requests').exec();
        if (!user) {
            throw new Error('User not found');
        }

        const request = user.requests.find((req) => req._id.toString() === requestId && req.deletedAt === null);
        if (request) {
            // formData의 각 속성 값으로 request의 해당 속성 값 업데이트
            if (formData.addInfo !== undefined) {
                request.info = formData.addInfo;
            }
            if (formData.awkPron !== undefined) {
                request.awkPron = formData.awkPron;
            }
            if (formData.commonPron !== undefined) {
                request.comPron = formData.commonPron;
            }
            if (formData.devTerm !== undefined) {
                request.word = formData.devTerm;
            }

            await user.save();
        } else {
            console.log('Request not found or already deleted');
        }
    } catch (err) {
        console.error(err);
    }
};

exports.updateRequestState = async (userId, requestId, status) => {
    try {
        console.log('updateRequestState 레포진입!!!!!!!!!!!!', userId, requestId, status);
        const user = await User.findOneAndUpdate(
            { 'requests._id': requestId },
            { $set: { 'requests.$.status': status } },
            { new: true }
        ).exec();

        if (!user) {
            console.log('Request not found');
        } else {
            console.log('Request status updated successfully');
        }
    } catch (err) {
        console.error(err);
    }
};

exports.deleteUserById = async (_id) => {
    try {
        return await User.findByIdAndDelete(_id);
    } catch (err) {
        console.error(err);
    }
};
