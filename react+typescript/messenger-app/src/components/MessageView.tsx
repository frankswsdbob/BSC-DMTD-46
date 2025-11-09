import { useEffect, useState } from 'react';
import { CSSProperties } from 'react';
import { fetchChannelMessages, sendMessage } from '../api/chatApi';
import { Message } from '../api/chatApi';
import { v4 as uuidv4 } from 'uuid';

// 格式化时间工具函数
const formatTime = () => {
    const now = new Date();
    return {
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: now.getTime() // 时间戳用于排序
    };
};

interface MessageViewProps {
    currentUser: string;
    channelName: string;
    onBack: () => void; // 新增：返回回调函数
}

// 样式定义 - 保持手机类似的尺寸
const containerStyle: CSSProperties = {
    maxWidth: '400px',
    margin: '0 auto',
    height: '100vh',
    boxSizing: 'border-box' as const,
    boxShadow: '0 0 20px rgba(0, 0, 0, 0.15)',
    backgroundColor: 'white',
    display: 'flex',
    flexDirection: 'column' as const,
    position: 'relative'
};

// 背景容器样式
const backgroundContainerStyle: CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
    backgroundImage: 'url("/background.jpg")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: 'blur(2px)',
    opacity: 0.8
};

// 新增：返回按钮样式
const backButtonStyle: CSSProperties = {
    position: 'absolute',
    left: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: '#0084ff',
    fontSize: '16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    padding: '5px 8px'
};

const messagesListStyle: CSSProperties = {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '15px',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
};

const emptyMessageStyle: CSSProperties = {
    color: '#666',
    textAlign: 'center' as const,
    padding: '20px',
    margin: 0,
    fontSize: '14px'
};

const messageItemStyle: CSSProperties = {
    margin: '8px 0',
    padding: '10px 12px',
    borderRadius: '10px',
    maxWidth: '70%',
    wordBreak: 'break-word' as const,
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
};

const sentMessageStyle: CSSProperties = {
    ...messageItemStyle,
    backgroundColor: '#0084ff',
    color: 'white',
    marginLeft: 'auto'
};

const receivedMessageStyle: CSSProperties = {
    ...messageItemStyle,
    backgroundColor: '#f0f0f0',
    color: '#333'
};

const senderStyle: CSSProperties = {
    fontSize: '12px',
    marginBottom: '4px',
    fontWeight: 'bold',
    display: 'block'
};

const textStyle: CSSProperties = {
    margin: '0 0 4px 0',
    fontSize: '14px'
};

const timeStyle: CSSProperties = {
    fontSize: '11px',
    opacity: 0.8,
    textAlign: 'right' as const,
    display: 'block'
};

const inputAreaStyle: CSSProperties = {
    display: 'flex',
    gap: '10px',
    padding: '10px 15px',
    borderTop: '1px solid #eee',
    backgroundColor: 'white'
};

const inputStyle: CSSProperties = {
    flex: 1,
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '20px',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
    outline: 'none',
    transition: 'border-color 0.2s'
};

const buttonStyle: CSSProperties = {
    padding: '10px 18px',
    backgroundColor: '#0084ff',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.2s'
};

const buttonDisabledStyle: CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#99bbff',
    cursor: 'not-allowed'
};

// 聊天标题栏样式（调整为相对定位以容纳返回按钮）
const headerStyle: CSSProperties = {
    padding: '12px 15px',
    borderBottom: '1px solid #eee',
    backgroundColor: '#fafafa',
    fontSize: '16px',
    fontWeight: 'bold',
    textAlign: 'center' as const,
    position: 'relative' // 新增：相对定位，让返回按钮可以绝对定位在标题栏内
};

export const MessageView = ({ currentUser, channelName, onBack }: MessageViewProps) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const currentWindowId = uuidv4();

    const loadCurrentMessages = async () => {
        if (!channelName || !currentUser) return;
        const channelMessages = await fetchChannelMessages(currentUser, channelName);
        setMessages(channelMessages);
    };

    const handleSend = async () => {
        if (!newMessage.trim() || !channelName || !currentUser || loading) return;

        const { time, timestamp } = formatTime();
        const message: Message = {
            id: uuidv4(),
            sender: currentUser,
            receiver: channelName,
            text: newMessage.trim(),
            time,
            timestamp,
            windowId: currentWindowId
        };

        setLoading(true);
        try {
            await sendMessage(message);
            loadCurrentMessages();
            setNewMessage('');
        } catch (error) {
            console.error('发送消息失败:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCurrentMessages();

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'allMessages') {
                loadCurrentMessages();
            }
        };
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [channelName, currentUser]);

    return (
        <>
            {/* 背景容器 */}
            <div style={backgroundContainerStyle}></div>

            {/* 聊天容器 - 手机尺寸 */}
            <div style={containerStyle}>
                {/* 聊天标题栏（包含返回按钮） */}
                <div style={headerStyle}>
                    {/* 新增：返回按钮 */}
                    <button
                        style={backButtonStyle}
                        onClick={onBack}
                        aria-label="返回消息列表"
                    >
                        ← 返回
                    </button>
                    与 {channelName} 聊天
                </div>

                {/* 消息列表 */}
                <div style={messagesListStyle}>
                    {messages.length === 0 ? (
                        <p style={emptyMessageStyle}>暂无消息，开始聊天吧~</p>
                    ) : (
                        messages.map(msg => (
                            <div
                                key={msg.id}
                                style={msg.sender === currentUser ? sentMessageStyle : receivedMessageStyle}
                            >
                                <span style={senderStyle}>{msg.sender}</span>
                                <p style={textStyle}>{msg.text}</p>
                                <span style={timeStyle}>{msg.time}</span>
                            </div>
                        ))
                    )}
                </div>

                {/* 输入区域 */}
                <div style={inputAreaStyle}>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="输入消息后按Enter发送..."
                        disabled={loading}
                        style={inputStyle}
                    />
                    <button
                        onClick={handleSend}
                        disabled={loading || !newMessage.trim()}
                        style={loading || !newMessage.trim() ? buttonDisabledStyle : buttonStyle}
                    >
                        {loading ? '发送中...' : '发送'}
                    </button>
                </div>
            </div>
        </>
    );
};