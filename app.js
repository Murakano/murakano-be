const express = require('express');
const conf = require('./src/common/config/index');
const expressLoader = require('./src/common/modules/express');
const initDB = require('./src/common/modules/mongodb');
const { START_MESSAGE } = require('./src/common/constants/express');
require('./src/common/modules/cron/sync-redis-to-db');

const app = express();

const initServer = async () => {
    expressLoader(app);

    await initDB();
    app.listen(conf.port, () => {
        console.log(START_MESSAGE);
    });
};

initServer();
