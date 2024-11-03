const fs = require('fs');

function generateRandomId() {
    return Array(24)
        .fill(0)
        .map(() => Math.floor(Math.random() * 16).toString(16))
        .join('');
}

function generateRandomNickname(index) {
    return `user${index}`;
}

function generateUser(index) {
    const now = new Date().toISOString();
    return {
        _id: { $oid: generateRandomId() },
        deletedAt: null,
        nickname: generateRandomNickname(index),
        email: `user${index}@example.com`,
        password: '$2b$10$NWhqlRrE5W0YMHlnaBi.CODbFjPZzvgT5G993eKoziVzrhH3M6KNC',
        role: 'user',
        snsId: null,
        provider: null,
        recentSearches: [],
        requests: [],
        createdAt: { $date: now },
        updatedAt: { $date: now },
        __v: 0,
    };
}

function generateUsers(count) {
    const users = [];
    for (let i = 0; i < count; i++) {
        users.push(generateUser(i));
    }
    return users;
}

async function generateAndSaveData(totalCount) {
    const userData = generateUsers(totalCount);
    const fileName = './data/test-users-data.json';
    fs.writeFileSync(fileName, JSON.stringify(userData, null, 2));

    console.log('✅ 10000개의 유저 데이터가 생성되었습니다.');
    console.log('📁 파일 위치: users.json');
}

generateAndSaveData(10000).catch(console.error);
