const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');

const config = require('../config');
const User = require('../../routes/user/user.model');

const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: config.jwtAccessSecret,
};

module.exports = () => {
    passport.use(
        new JwtStrategy(opts, async (jwtPayload, done) => {
            try {
                const user = await User.findOne({ email: jwtPayload.email });
                return user ? done(null, user) : done(null, false);
            } catch (error) {
                console.error(error);
                return done(error, false);
            }
        })
    );
};
