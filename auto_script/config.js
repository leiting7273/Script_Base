// config.js

const fs = require('fs');
const path = require('path');

// 定义配置文件的路径
const envPath = path.join(__dirname, 'env.json');

// 读取并解析 JSON 文件
let envData = {};

// 读取文件
try {
    const data = fs.readFileSync(envPath, 'utf8');
    envData = JSON.parse(data);
} catch (err) {
    console.error('读取 env.json 文件失败:', err);
    process.exit(1);
}

// 将数组转换为键值对对象
const envConfig = envData.reduce((acc, item) => {
    acc[item.name] = item.value;
    return acc;
}, {});

// 导出配置
module.exports = envConfig;