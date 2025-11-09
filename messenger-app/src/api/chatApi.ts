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

// 后端API基础地址（关键修改）
const API_BASE_URL = 'http://localhost:3001';

// 获取用户列表
export const fetchUsers = async (): Promise<User[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/users`); // 对接真实API
        if (!response.ok) throw new Error('用户API请求失败');
        const data = await response.json();
        return Array.isArray(data) ? data : DEFAULT_USERS;
    } catch (error) {
        console.warn('使用内置用户:', error);
        return DEFAULT_USERS;
    }
};

// 获取当前用户的所有消息
export const fetchAllMessages = async (currentUser: string): Promise<Message[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/messages?user=${currentUser}`);
        if (!response.ok) throw new Error('消息API请求失败');
        return response.json();
    } catch (error) {
        console.warn('从本地缓存获取消息:', error);
        return JSON.parse(localStorage.getItem('allMessages') || '[]');
    }
};

// 获取指定频道的消息
export const fetchChannelMessages = async (
    currentUser: string,
    channelName: string
): Promise<Message[]> => {
    try {
        const allMessages = await fetchAllMessages(currentUser);
        return allMessages.filter(
            msg => (msg.sender === currentUser && msg.receiver === channelName) ||
                (msg.sender === channelName && msg.receiver === currentUser)
        );
    } catch (error) {
        console.error('获取频道消息失败:', error);
        return [];
    }
};

// 发送消息
export const sendMessage = async (message: Message): Promise<Message> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message),
        });
        if (!response.ok) throw new Error('发送消息失败');

        const savedMessage = await response.json();
        // 同步到localStorage，触发其他标签页更新
        const allMessages = await fetchAllMessages(message.sender);
        localStorage.setItem('allMessages', JSON.stringify(allMessages));
        return savedMessage;
    } catch (error) {
        console.warn('使用本地存储发送消息:', error);
        const allMessages = JSON.parse(localStorage.getItem('allMessages') || '[]');
        allMessages.push(message);
        localStorage.setItem('allMessages', JSON.stringify(allMessages));
        return message;
    }
};