const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../../routes/user/user.model');

module.exports = () => {
    passport.use(
        new LocalStrategy(
            {
                usernameField: 'email',
                passwordField: 'password',
            },
            authenticateUser
        )
    );
};

const authenticateUser = async (email, password, done) => {
    try {
        const user = await findUserByEmail(email);
        if (!user) {
            return done(null, false, { message: '가입되지 않은 회원입니다.' });
        }

        const isPasswordMatch = await user.comparePassword(password);
        if (!isPasswordMatch) {
            return done(null, false, { message: '비밀번호가 일치하지 않습니다.' });
        }

        return done(null, user);
    } catch (error) {
        console.error(error);
        return done(error);
    }
};

const findUserByEmail = async (email) => {
    return await User.findOne({ email });
};
