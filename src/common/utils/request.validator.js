const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const ErrorMessage = require('../../common/constants/error-message');

const ajv = new Ajv();
addFormats(ajv);

exports.validateRequest = (schema, req) => {
    const validate = ajv.compile(schema);
    return validateAndHandleErrors(validate, req);
};

const validateAndHandleErrors = (validate, req) => {
    if (validate(req)) {
        return req;
    }
    const { errors } = validate;
    const message = errors && errors[0] ? errors[0].message : ErrorMessage.BAD_REQUEST;
    throw { message, type: 'ajv' };
};
