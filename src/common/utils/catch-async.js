const sendResponse = require('../utils/response-handler');

exports.catchAsync = (fn, errorMessage) => {
    return async (req, res) => {
        try {
            await fn(req, res);
        } catch (error) {
            console.error(error);
            if (error?.type) {
                return sendResponse.badRequest(res, error.message);
            }
            return sendResponse.fail(req, res, errorMessage);
        }
    };
};
