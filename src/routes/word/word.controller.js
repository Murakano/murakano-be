const wordService = require('./word.service');
const userService = require('../user/user.service');
const sendResponse = require('../../common/utils/response-handler');
const ErrorMessage = require('../../common/constants/error-message');
const SuccessMessage = require('../../common/constants/success-message');
const { validateRequest } = require('../../common/utils/request.validator');
const { searchTermSchema, relatedTermSchema, wordListSchema } = require('./word.schema');

exports.getSearchWords = async (req, res) => {
    try {
        const _id = req?.user ? req.user._id : null;
        const validData = validateRequest(searchTermSchema, req.params);
        let searchTerm = validData.searchTerm;
        const data = await wordService.getSearchWords(searchTerm);
        if (_id) {
            await userService.updateRecentSearch(_id, searchTerm);
        }
        const message = data ? SuccessMessage.SEARCH_WORDS_SUCCESS : SuccessMessage.SEARCH_WORDS_NONE;
        sendResponse.ok(res, {
            message,
            data,
        });
    } catch (error) {
        console.log(error);
        if (error?.type) {
            return sendResponse.badRequest(res, error.message);
        }
        sendResponse.fail(req, res, ErrorMessage.SEARCH_WORDS_ERROR);
    }
};

exports.getRankWords = async (req, res) => {
    try {
        const data = await wordService.getRankWords();
        sendResponse.ok(res, {
            message: SuccessMessage.RANK_WORDS_SUCCESS,
            data,
        });
    } catch (error) {
        sendResponse.fail(req, res, ErrorMessage.RANK_WORDS_ERROR);
    }
};

exports.getRelatedWords = async (req, res) => {
    try {
        const { searchTerm, limit } = validateRequest(relatedTermSchema, req.query);
        const data = await wordService.getRelatedWords(searchTerm, limit);
        sendResponse.ok(res, {
            message: SuccessMessage.RELATED_WORDS_SUCCESS,
            data,
        });
    } catch (error) {
        console.log(error);
        sendResponse.fail(req, res, ErrorMessage.RELATED_WORDS_ERROR);
    }
};

exports.getAllWords = async (req, res) => {
    try {
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
    } catch (error) {
        console.log(error);
        if (error?.type) {
            return sendResponse.badRequest(res, error.message);
        }
        sendResponse.fail(req, res, ErrorMessage.GET_WORDS_ERROR);
    }
};

exports.checkDuplicateWord = async (req, res) => {
    try {
        const { word } = req.body;
        const isDataExist = await wordService.checkDuplicateWord(word);
        data = { isDataExist };

        if (isDataExist) {
            return sendResponse.ok(res, {
                message: ErrorMessage.EXIST_WORD,
                data,
            });
        }

        return sendResponse.ok(res, {
            message: SuccessMessage.CHECK_DUPLICATE_REQUEST_SUCCESS,
            data,
        });
    } catch (error) {
        sendResponse.fail(req, res, ErrorMessage.CHECK_DUPLICATE_REQUEST_ERROR);
    }
};
