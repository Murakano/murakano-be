const express = require('express');
const { isUser } = require('../../common/utils/auth');
const { getRankWords, getSearchWords, getRelatedWords, getAllWords, checkDuplicateWord } = require('./word.controller');

const wordRouter = express.Router();

wordRouter.get('/', getAllWords);
wordRouter.get('/rank', getRankWords);
wordRouter.get('/search/related', getRelatedWords);
wordRouter.post('/search/:searchTerm', isUser, getSearchWords);
wordRouter.post('/duplicate', checkDuplicateWord);

module.exports = wordRouter;
