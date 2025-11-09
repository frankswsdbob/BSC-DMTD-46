import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

// 解决 ESM 模块中 __dirname 问题
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 初始化 Express 应用
const app = express();
app.use(cors()); // 允许跨域请求
app.use(bodyParser.json()); // 解析 JSON 请求体

let db; // 数据库实例

// 初始化数据库
const initDB = async () => {
    // 定义默认数据（lowdb v6+ 必须提供）
    const defaultData = {
        users: [
            { id: '1', name: 'Alice' },
            { id: '2', name: 'Bob' },
            { id: '3', name: 'Charlie' }
        ],
        messages: []
    };

    // 创建数据库适配器（指定 db.json 路径）
    const adapter = new JSONFile(path.join(__dirname, 'db.json'));

    // 初始化数据库实例（传入适配器和默认数据）
    db = new Low(adapter, defaultData);

    // 读取数据库（首次运行会自动创建 db.json 并写入默认数据）
    await db.read();
    // 写入数据（确保默认数据生效）
    await db.write();
};

// 初始化数据库后启动服务并定义接口
initDB()
    .then(() => {
        // 1. 获取所有用户
        app.get('/api/users', (req, res) => {
            res.json(db.data.users);
        });

        // 2. 获取指定频道的消息
        app.get('/api/messages/:channelName', (req, res) => {
            const { channelName } = req.params;
            // 过滤出接收者为该频道的消息
            const channelMessages = db.data.messages.filter(
                msg => msg.receiver === channelName
            );
            res.json(channelMessages);
        });

        // 3. 发送消息（添加到数据库）
        app.post('/api/messages', async (req, res) => {
            // 从请求体中获取消息内容（包含 sender, receiver, content 等）
            const newMessage = {
                id: uuidv4(), // 生成唯一 ID
                timestamp: new Date().toISOString(), // 记录时间
                ...req.body // 合并请求体中的数据（sender, receiver, content）
            };

            // 添加到数据库并保存
            db.data.messages.push(newMessage);
            await db.write();

            // 返回新创建的消息
            res.status(201).json(newMessage);
        });

        // 4. 清空指定频道的消息（可选接口）
        app.delete('/api/messages/:channelName', async (req, res) => {
            const { channelName } = req.params;
            // 保留非该频道的消息
            db.data.messages = db.data.messages.filter(
                msg => msg.receiver !== channelName
            );
            await db.write();
            res.json({ success: true, message: `已清空 ${channelName} 的消息` });
        });

        // 启动服务器
        const PORT = 3001;
        app.listen(PORT, () => {
            console.log(`API 服务器已启动，地址：http://localhost:${PORT}`);
            console.log('可用接口：');
            console.log('GET  /api/users                - 获取所有用户');
            console.log('GET  /api/messages/:channelName - 获取指定频道消息');
            console.log('POST /api/messages              - 发送消息（需传 sender, receiver, content）');
            console.log('DELETE /api/messages/:channelName - 清空指定频道消息');
        });
    })
    .catch(err => {
        console.error('数据库初始化失败：', err);
    });