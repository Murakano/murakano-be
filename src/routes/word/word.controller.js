const wordService = require('./word.service');
const { catchAsync } = require('../../common/utils/catch-async');
const sendResponse = require('../../common/utils/response-handler');
const ErrorMessage = require('../../common/constants/error-message');
const SuccessMessage = require('../../common/constants/success-message');
const { validateRequest } = require('../../common/utils/request.validator');
const { searchTermSchema, relatedTermSchema, wordListSchema } = require('./word.schema');

exports.getSearchWords = catchAsync(async (req, res) => {
    const { searchTerm } = validateRequest(searchTermSchema, req.params);
    const data = await wordService.getSearchWords(searchTerm);
    await wordService.updateRecentWordIfLogined(req, searchTerm);

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
    const { limit, page, sort } = validateRequest(wordListSchema, req.query);
    const data = await wordService.getAllWords(sort, page, limit);

    sendResponse.ok(res, {
        message: SuccessMessage.GET_WORDS_SUCCESS,
        data,
    });
}, ErrorMessage.GET_WORDS_ERROR);

exports.checkDuplicateWord = catchAsync(async (req, res) => {
    const { word } = req.body;
    const isDataExist = await wordService.checkDuplicateWord(word);

    const message = isDataExist ? ErrorMessage.EXIST_WORD : SuccessMessage.CHECK_DUPLICATE_REQUEST_SUCCESS;
    sendResponse.ok(res, { message, data: { isDataExist } });
});
