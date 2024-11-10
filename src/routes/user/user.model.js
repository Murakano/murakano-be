const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const requestSchema = new mongoose.Schema(
    {
        word: {
            type: String,
            required: true,
        },
        awkPron: { type: String },
        comPron: {
            type: String,
            required: function () {
                return this.type === 'mod';
            },
        },

        info: { type: String },
        suggestedBy: { type: String, required: true },
        type: { type: String, enum: ['add', 'mod'], required: true },
        status: { type: String, enum: ['pend', 'rej', 'app'], default: 'pend' },
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

const userSchema = new mongoose.Schema(
    {
        deletedAt: { type: Date, default: null },
        nickname: { type: String, required: true, unique: true, maxlength: 10, match: /^[a-zA-Z0-9가-힣]+$/ },
        email: {
            type: String,
            required: true,
            unique: true,
            maxlength: 50,
            match: /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/,
        },
        password: { type: String },
        role: { type: String, enum: ['user', 'admin'], default: 'user' },
        snsId: { type: String, default: null },
        provider: { type: String, enum: ['kakao'], default: null },
        recentSearches: [
            {
                searchTerm: { type: String, required: true },
                updatedAt: { type: Date, default: Date.now },
                deletedAt: { type: Date, default: null },
            },
        ],
        requests: [requestSchema],
    },
    { timestamps: true }
);

userSchema.pre(/^find|update|save|remove|delete|count/, function (next) {
    this._startTime = Date.now();
    next();
});

userSchema.post(/^find|update|save|remove|delete|count/, function (result, next) {
    const latency = Date.now() - this._startTime;
    console.log(`[${this.mongooseCollection?.modelName}] ${this.op} query - ${latency}ms`);
    next();
});

userSchema.pre('save', async function (next) {
    try {
        if ((this.isNew && !this.provider) || this.isModified('password')) {
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
        }
    } catch (err) {
        console.log(err);
    }
    next();
});

userSchema.methods.comparePassword = async function (password) {
    return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
