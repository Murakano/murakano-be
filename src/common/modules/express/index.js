const helmet = require('helmet');
const morgan = require('morgan');
const express = require('express');
const passport = require('passport');
const cookieParser = require('cookie-parser');

const router = require('../../../routes/index');
const passportConfig = require('../../passport');
const { commonLimiter } = require('../../utils/rateLimit');
const { swaggerUi, specs } = require('../../../swagger/swagger');
const addNonce = require('../../../middlewares/add-nonce');
const checkBlockedIp = require('../../../middlewares/check-blocked-ip');
const setContentSecurityPolicy = require('../../../middlewares/set-content-security-policy');
const setupCors = require('../../../middlewares/setup-cors');

module.exports = expressLoader = (app) => {
    passportConfig();
    app.use(morgan('dev'));
    app.use(helmet());

    app.use(addNonce);
    app.use(setContentSecurityPolicy);

    app.use(setupCors);

    app.use(passport.initialize());
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ limit: '50mb', extended: true }));
    app.use(cookieParser());

    app.use(checkBlockedIp);

    app.use(commonLimiter);
    app.use(router);
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }));

    app.all('*', (req, res) => res.status(404).json(`Can't find ${req.originalUrl} on this server`));
};
