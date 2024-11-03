const fs = require('fs');

const prefixes = ['A', 'Ab', 'Ac', 'Ad', 'Af', 'Ag', 'Al', 'Am', 'An', 'Ap', 'Ar', 'As', 'At', 'Au'];
const middles = ['sync', 'pi', 'data', 'net', 'web', 'cloud', 'tech', 'dev', 'sys', 'log'];
const suffixes = ['Service', 'API', 'Hub', 'Lab', 'Flow', 'Base', 'Core', 'Plus', 'Pro', 'Box'];

function generateRandomWord(index) {
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const middle = middles[Math.floor(Math.random() * middles.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    return `${prefix}${middle}${suffix}${index}`;
}

function* generateWordBatch(totalCount, batchSize = 1000) {
    for (let i = 0; i < totalCount; i += batchSize) {
        const batch = [];
        const currentBatchSize = Math.min(batchSize, totalCount - i);

        for (let j = 0; j < currentBatchSize; j++) {
            const word = generateRandomWord(i + j);
            batch.push({
                word,
                awkPron: `어색한_${word}`,
                comPron: `일반적인_${word}`,
                info: `${word}에 대한 설명입니다. (테스트 데이터 ${i + j + 1})`,
                suggestedBy: 'admin',
                freq: Math.floor(Math.random() * 100),
            });
        }
        yield batch;
    }
}

async function generateAndSaveData(totalCount) {
    console.time('Data Generation');
    const fileName = './scripts/data/test-words-data.json';
    const batchSize = 1000;
    let currentBatch = 1;
    const totalBatches = Math.ceil(totalCount / batchSize);

    fs.writeFileSync(fileName, '[\n', 'utf8');

    for (const batch of generateWordBatch(totalCount, batchSize)) {
        console.log(`처리 중: ${currentBatch}/${totalBatches} 배치`);

        const batchData = batch.map((item) => JSON.stringify(item)).join(',\n');
        fs.appendFileSync(fileName, currentBatch === 1 ? batchData : ',\n' + batchData, 'utf8');

        currentBatch++;
    }

    fs.appendFileSync(fileName, '\n]', 'utf8');

    console.log(`✅ ${totalCount}개의 테스트 데이터 생성 완료!`);
    console.log(`📁 파일 위치: ${fileName}`);
}

generateAndSaveData(100000).catch(console.error);
