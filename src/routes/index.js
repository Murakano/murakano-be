const { Router } = require('express');

const userRouter = require('./user/user.route');
const wordRouter = require('./word/word.route');

const router = Router();

// TODO : swagger

router.use('/users', userRouter);

router.use('/words', wordRouter);

// EB health check
router.get('/', (_, res) => {
    res.status(200).json({ message: 'Success' });
});

module.exports = router;
