const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Murakano Api',
            description: 'Murakano Web App RESTful API Documentation',
            version: '1.0.0',
        },
        servers: [
            {
                url: 'http://localhost:5000',
                description: 'Local Development',
            },
            {
                url: 'https://api.murakano.site/',
                description: 'Real Server',
            },
        ],
    },
    // apis: ['./src/swagger/*'],
    apis: [
        './src/swagger/user.js',
        './src/swagger/admin.js',
        './src/swagger/request.js',
        './src/swagger/search.js',
        './src/swagger/word.js',
    ],
};

const specs = swaggerJsdoc(options);

module.exports = {
    swaggerUi,
    specs,
};
