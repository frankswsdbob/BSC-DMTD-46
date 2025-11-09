const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Low, JSONFile } = require('lowdb');
const { v4: uuidv4 } = require('uuid');
// 新增：引入path模块，用于拼接绝对路径
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 核心修改：用绝对路径指定db.json位置（放在chat-api-server根目录）
const adapter = new JSONFile(path.join(__dirname, 'db.json'));
const db = new Low(adapter);

// 注意：原代码中await db.read()需要放在async函数里（之前可能漏了）
// 修正：将数据库初始化放在async函数中执行
const initDB = async () => {
    await db.read();
    db.data = db.data || {
        users: [
            { id: '1', name: 'Alice' },
            { id: '2', name: 'Bob' },
            { id: '3', name: 'Charlie' }
        ],
        messages: []
    };
    await db.write();
};

// 先初始化数据库，再启动服务器
initDB().then(() => {
    // 所有API接口代码保持不变...

    // 启动服务器
    const PORT = 3001;
    app.listen(PORT, () => {
        console.log(`API服务器运行在 http://localhost:${PORT}`);
    });
});