const wordService = require('./word.service');
const userService = require('../user/user.service');
const { catchAsync } = require('../../common/utils/catch-async');
const sendResponse = require('../../common/utils/response-handler');
const ErrorMessage = require('../../common/constants/error-message');
const SuccessMessage = require('../../common/constants/success-message');
const { validateRequest } = require('../../common/utils/request.validator');
const { searchTermSchema, relatedTermSchema, wordListSchema } = require('./word.schema');

exports.getSearchWords = catchAsync(async (req, res) => {
    const validData = validateRequest(searchTermSchema, req.params);
    const { searchTerm } = validData;
    const data = await wordService.getSearchWords(searchTerm);
    await updateRecentWordIfLogined(req, searchTerm);

    const message = data ? SuccessMessage.SEARCH_WORDS_SUCCESS : SuccessMessage.SEARCH_WORDS_NONE;
    sendResponse.ok(res, { message, data });
}, ErrorMessage.SEARCH_WORDS_ERROR);

exports.getRankWords = catchAsync(async (req, res) => {
    const data = await wordService.getRankWords();
    sendResponse.ok(res, {
        message: SuccessMessage.RANK_WORDS_SUCCESS,
        data,
    });
}, ErrorMessage.RANK_WORDS_ERROR);

exports.getRelatedWords = catchAsync(async (req, res) => {
    const { searchTerm, limit } = validateRequest(relatedTermSchema, req.query);
    const data = await wordService.getRelatedWords(searchTerm, limit);
    sendResponse.ok(res, {
        message: SuccessMessage.RELATED_WORDS_SUCCESS,
        data,
    });
}, ErrorMessage.RELATED_WORDS_ERROR);

exports.getAllWords = catchAsync(async (req, res) => {
    const { limit, page, sort } = validateRequest(wordListSchema, {
        limit: req.query.limit * 1,
        page: req.query.page * 1,
        sort: req.query.sort,
    });

    const data = await wordService.getAllWords(sort, page, limit);

    sendResponse.ok(res, {
        message: SuccessMessage.GET_WORDS_SUCCESS,
        data,
    });
}, ErrorMessage.GET_WORDS_ERROR);

exports.checkDuplicateWord = catchAsync(async (req, res) => {
    const { word } = req.body;
    const isDataExist = await wordService.checkDuplicateWord(word);
    if (isDataExist) {
        return sendResponse.ok(res, {
            message: ErrorMessage.EXIST_WORD,
            data: { isDataExist },
        });
    }

    return sendResponse.ok(res, {
        message: SuccessMessage.CHECK_DUPLICATE_REQUEST_SUCCESS,
        data,
    });
});

async function updateRecentWordIfLogined(req, searchTerm) {
    const userId = req.user?._id;
    if (userId) {
        await userService.updateRecentSearch(userId, searchTerm);
    }
}
