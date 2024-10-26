const User = require('./user.model');

exports.createUser = async (userData) => await User.create(userData);

exports.findUserById = async (_id) => await User.findOne({ _id });

exports.findUserByNickname = async (nickname) => {
    const userExists = await User.exists({ nickname });
    return userExists ? true : false;
};

exports.findUserByEmail = async (email) => await User.exists({ email });

exports.getUserBySnsId = async (snsId) => await User.findOne({ snsId, provider: 'kakao' });

exports.getRecentSearches = async (_id) => {
    const user = await User.findById(_id).select('recentSearches').exec();
    const recentSearches = (user.recentSearches || [])
        .filter((search) => !search.deletedAt)
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 10);

    return recentSearches.map((search) => search.searchTerm);
};

exports.delRecentSearch = async (_id, searchTerm) => {
    await User.findOneAndUpdate(
        { _id, 'recentSearches.searchTerm': searchTerm, 'recentSearches.deletedAt': null },
        { $set: { 'recentSearches.$.deletedAt': Date.now() } }
    );
};

exports.updateRecentSearch = async (_id, searchTerm) => {
    const user = await User.findById(_id).exec();
    const recentSearch = user.recentSearches.find((search) => search.searchTerm === searchTerm);
    if (recentSearch) {
        if (recentSearch.deletedAt) {
            recentSearch.deletedAt = null;
        }
        recentSearch.updatedAt = Date.now();
    } else {
        user.recentSearches.push({ searchTerm, updatedAt: Date.now() });
    }

    await user.save();
};

exports.postWords = async (userId, formData, nickname, type) => {
    const user = await User.findById(userId).exec();
    if (!user) {
        throw new Error('User not found');
    }

    const existingRequest = user.requests.find(
        (req) => req.word === formData.devTerm && req.status === 'pend' && req.deletedAt === null
    );
    if (existingRequest) {
        throw new Error('Word request already exists');
    }

    const newRequest = {
        word: formData.devTerm,
        info: formData.addInfo,
        awkPron: formData.awkPron,
        comPron: formData.commonPron,
        status: 'pend',
        type,
        suggestedBy: nickname,
    };
    user.requests.push(newRequest);
    await user.save();

    return user.requests.find((req) => req.word === formData.devTerm);
};

exports.getUserRequests = async (userId) => {
    const user = await User.findById(userId).select('requests').exec();
    if (!user) {
        throw new Error('User not found');
    }

    return user.requests.filter((request) => request.deletedAt === null);
};

exports.getUserRequestsAll = async () => {
    const users = await User.find({}, { requests: 1, _id: 0 });
    return users.flatMap((u) => u.requests.filter((request) => !request.deletedAt));
};

exports.deleteRequest = async (userId, requestWord) => {
    const user = await User.findById(userId).select('requests').exec();
    if (!user) {
        throw new Error('User not found');
    }

    const request = user.requests.find((req) => req.word === requestWord && req.deletedAt === null);
    if (request) {
        request.deletedAt = Date.now();
        await user.save();
    }
};

exports.getRole = async (userId) => {
    const user = await User.findById(userId).select('role').exec();
    return user.role;
};

exports.findUserByRequestId = async (requestId) => {
    return await User.findOne({ 'requests._id': requestId }).exec();
};

exports.updateRequest = async (requestId, formData) => {
    const user = await User.findOne({ 'requests._id': requestId }).select('requests').exec();
    if (!user) {
        throw new Error('User not found');
    }
    const request = user.requests.find((req) => req._id.toString() === requestId && !req.deletedAt);
    if (request) {
        Object.assign(request, formData);
        await user.save();
    }
};

exports.updateRequestState = async (requestId, status) => {
    await User.findOneAndUpdate(
        { 'requests._id': requestId },
        { $set: { 'requests.$.status': status } },
        { new: true }
    ).exec();
};

exports.deleteUserById = async (_id) => {
    return await User.findByIdAndDelete(_id);
};
