export interface User {
    id: string;
    name: string;
}

export interface Message {
    id: string;
    sender: string;
    receiver: string;
    text: string;
    time: string;
    timestamp: number;
    windowId: string;
}

// 内置用户（API失败时兜底）
const DEFAULT_USERS: User[] = [
    { id: '1', name: 'Alice' },
    { id: '2', name: 'Bob' },
    { id: '3', name: 'Charlie' }
];

// 后端API基础地址
const API_BASE_URL = 'http://localhost:3001';

// 本地消息操作工具类（核心优化：统一管理本地存储）
const LocalMessageHelper = {
    // 读取本地所有消息
    getMessages: (): Message[] => {
        const cached = localStorage.getItem('allMessages');
        return cached ? JSON.parse(cached) : [];
    },

    // 写入消息到本地（自动去重+排序）
    saveMessages: (messages: Message[]) => {
        // 基于id去重
        const uniqueMessages = Array.from(
            new Map(messages.map(msg => [msg.id, msg])).values()
        );
        // 按时间戳排序（确保消息顺序正确）
        uniqueMessages.sort((a, b) => a.timestamp - b.timestamp);
        localStorage.setItem('allMessages', JSON.stringify(uniqueMessages));
    },

    // 添加单条消息到本地
    addMessage: (newMsg: Message) => {
        const current = LocalMessageHelper.getMessages();
        // 避免重复添加
        if (!current.some(msg => msg.id === newMsg.id)) {
            current.push(newMsg);
            LocalMessageHelper.saveMessages(current);
        }
    }
};

// 获取用户列表
export const fetchUsers = async (): Promise<User[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/users`);
        if (!response.ok) throw new Error('用户API请求失败');
        const data = await response.json();
        return Array.isArray(data) ? data : DEFAULT_USERS;
    } catch (error) {
        console.warn('使用内置用户:', error);
        return DEFAULT_USERS;
    }
};

// 获取当前用户的所有消息（本地优先，接口补充）
export const fetchAllMessages = async (currentUser: string): Promise<Message[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/messages?user=${currentUser}`);
        if (!response.ok) throw new Error('消息API请求失败');
        const apiMessages = await response.json();

        // 合并接口数据与本地数据（本地为主，避免覆盖）
        const localMessages = LocalMessageHelper.getMessages();
        const mergedMessages = [...localMessages, ...(apiMessages || [])];
        LocalMessageHelper.saveMessages(mergedMessages);

        return mergedMessages;
    } catch (error) {
        console.warn('从本地缓存获取消息:', error);
        return LocalMessageHelper.getMessages(); // 完全依赖本地
    }
};

// 获取指定频道的消息（基于本地数据过滤）
export const fetchChannelMessages = async (
    currentUser: string,
    channelName: string
): Promise<Message[]> => {
    try {
        // 优先使用本地最新消息
        const allMessages = LocalMessageHelper.getMessages();
        // 精确过滤当前频道的消息
        return allMessages.filter(msg =>
            (msg.sender === currentUser && msg.receiver === channelName) ||
            (msg.sender === channelName && msg.receiver === currentUser)
        );
    } catch (error) {
        console.error('获取频道消息失败:', error);
        return [];
    }
};

// 发送消息（本地优先更新，再同步接口）
export const sendMessage = async (message: Message): Promise<Message> => {
    // 第一步：立即更新本地存储（保证消息先显示）
    LocalMessageHelper.addMessage(message);

    try {
        // 第二步：同步到后端API
        const response = await fetch(`${API_BASE_URL}/api/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message),
        });
        if (!response.ok) throw new Error('发送消息失败');

        // 用后端返回的消息更新本地（可能包含服务器生成的字段）
        const savedMessage = await response.json();
        LocalMessageHelper.addMessage(savedMessage);
        return savedMessage;
    } catch (error) {
        console.warn('接口同步失败，依赖本地存储:', error);
        return message; // 本地已保存，直接返回
    }
};