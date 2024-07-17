const express = require('express');
const wordRouter = express.Router();
const { isUser } = require('../../common/utils/auth');
const { getRankWords, getSearchWords, getRelatedWords, getAllWords, checkDuplicateWord } = require('./word.controller');

// 전체 단어 목록 (쿼리 스트링에 정렬 & 페이지 정보)
wordRouter.get('/', getAllWords);

// 인기 검색어 조회
wordRouter.get('/rank', getRankWords);
// 연관검색어 : 쿼리스트링으로 전달받은 검색어 searchTerm을 포함하는 단어 조회
wordRouter.get('/search/related', getRelatedWords);
// 검색어 조회
wordRouter.post('/search/:searchTerm', isUser, getSearchWords);

//등록요청 단어 중복검사
wordRouter.post('/duplicate', checkDuplicateWord);

module.exports = wordRouter;
