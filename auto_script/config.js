// config.js

const fs = require('fs');
const path = require('path');

// 定义配置文件的路径
const envPath = path.join(__dirname, 'env.json');

try {
    const data = fs.readFileSync(envPath, 'utf8');
    const envArray = JSON.parse(data);
    envArray.forEach(item => {
        process.env[item.name] = item.value;
    });
} catch (err) {
    console.error('读取或解析 env.json 文件失败:', err);
    process.exit(1);
}
