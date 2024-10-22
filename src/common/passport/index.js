const passport = require('passport');

const jwtStrategy = require('./jwtStrategy');
const localStrategy = require('./localStrategy');
const User = require('../../routes/user/user.model');

module.exports = () => {
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err);
        }
    });

    localStrategy();
    jwtStrategy();
};
