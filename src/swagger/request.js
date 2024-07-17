/**
 * @swagger
 * tags:
 *   - name: 개발 용어 API
 */

/**
 * @swagger
 * /words:
 *   get:
 *     summary: 전체 용어 조회
 *     tags:
 *       - 개발 용어 API
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of words to return
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [asc, desc, popularity, recent]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: A list of words
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: GET_WORDS_SUCCESS
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       word:
 *                         type: string
 *                         example: exampleWord
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /users/requests/new:
 *   post:
 *     summary: 개발 용어 등록/수정 요청
 *     tags: [개발 용어 API]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: nickname
 *         schema:
 *           type: string
 *         required: true
 *         description: Nickname for the new word request
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               formData:
 *                 type: object
 *                 properties:
 *                   devTerm:
 *                     type: string
 *                   addInfo:
 *                     type: string
 *                   awkPron:
 *                     type: string
 *                   comPron:
 *                     type: string
 *               type:
 *                 type: string
 *               nickname:
 *                 type: string
 *     responses:
 *       200:
 *         description: New word request added successfully
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /words/duplicate:
 *   post:
 *     summary: 개발 용어 중복 검사
 *     tags: [개발 용어 API]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               word:
 *                 type: string
 *                 example: exampleWord
 *     responses:
 *       200:
 *         description: Duplicate check result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: CHECK_DUPLICATE_REQUEST_SUCCESS
 *                 data:
 *                   type: object
 *                   properties:
 *                     isDataExist:
 *                       type: boolean
 *                       example: true
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /users/requests:
 *   get:
 *     summary: 내 요청 목록 조회
 *     tags: [개발 용어 API]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User requests retrieved successfully
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /users/requests/{requestId}:
 *   post:
 *     summary: 개발 용어 요청 수정
 *     tags: [개발 용어 API]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         schema:
 *           type: string
 *         required: true
 *         description: Request ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               formData:
 *                 type: object
 *                 properties:
 *                   devTerm:
 *                     type: string
 *                   addInfo:
 *                     type: string
 *                   awkPron:
 *                     type: string
 *                   comPron:
 *                     type: string
 *     responses:
 *       200:
 *         description: User request updated successfully
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /users/requests/{word}:
 *   delete:
 *     summary: 개발 용어 요청 삭제
 *     tags: [개발 용어 API]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: word
 *         schema:
 *           type: string
 *         required: true
 *         description: Word to delete
 *     responses:
 *       200:
 *         description: User request deleted successfully
 *       500:
 *         description: Internal server error
 */
