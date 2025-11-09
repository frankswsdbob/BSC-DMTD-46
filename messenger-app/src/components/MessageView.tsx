import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { CSSProperties } from 'react';
import { fetchChannelMessages, sendMessage, Message, fetchAllMessages } from '../api/chatApi';

const MessageView = () => {
    const { channelName } = useParams<{ channelName: string }>();
    const currentUser = sessionStorage.getItem('currentUser') || '';
    const currentWindowId = sessionStorage.getItem('windowId') || '';
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 格式化时间
    const formatTime = () => {
        const date = new Date();
        return {
            time: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`,
            timestamp: date.getTime()
        };
    };

    // 加载当前频道的消息
    const loadCurrentChannelMessages = async () => {
        if (!channelName || !currentUser) return;
        try {
            const data = await fetchChannelMessages(currentUser, channelName);
            setMessages(data.sort((a, b) => a.timestamp - b.timestamp));
        } catch (error) {
            console.error('加载消息失败:', error);
        }
    };

    // 发送消息（核心修复：先本地显示，再同步API）
    const handleSend = async () => {
        if (!newMessage.trim() || !channelName || loading) return;

        const { time, timestamp } = formatTime();
        // 1. 先创建本地消息对象
        const localMessage: Message = {
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
            // 2. 立即更新本地消息列表（确保用户能看到自己发送的消息）
            setMessages(prev => [...prev, localMessage].sort((a, b) => a.timestamp - b.timestamp));
            setNewMessage('');

            // 3. 再调用API同步到服务器
            await sendMessage(localMessage);

            // 4. API同步成功后，重新拉取最新消息（确保与服务器一致）
            await loadCurrentChannelMessages();
        } catch (error) {
            console.error('发送消息失败:', error);
            // 失败时不删除本地消息，保证用户体验
            alert('消息已本地保存，但同步到服务器失败');
        } finally {
            setLoading(false);
        }
    };

    // 初始加载+实时监听
    useEffect(() => {
        loadCurrentChannelMessages();

        // 监听其他标签页的消息变化
        const handleStorageChange = () => {
            loadCurrentChannelMessages();
        };
        window.addEventListener('storage', handleStorageChange);

        // 定时拉取最新消息
        const refreshInterval = setInterval(loadCurrentChannelMessages, 2000);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(refreshInterval);
            document.removeEventListener('visibilitychange', handleStorageChange);
        };
    }, [channelName, currentUser]);

    // 自动滚动到底部
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // 渲染部分保持不变
    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <button onClick={() => navigate('/channels')} style={backButton}>← 返回</button>
                <h3>与 {channelName} 聊天中</h3>
            </div>

            <div style={messagesContainer}>
                {messages.length === 0 ? (
                    <div style={emptyMessageStyle}>开始与 {channelName} 的聊天吧～</div>
                ) : (
                    messages.map(msg => (
                        <div
                            key={msg.id}
                            style={msg.sender === currentUser ? myMessageStyle : othersMessageStyle}
                        >
                            <div style={messageBubbleStyle(msg.sender === currentUser)}>
                                {msg.sender !== currentUser && <div style={senderStyle}>{msg.sender}</div>}
                                <div style={textStyle}>{msg.text}</div>
                                <div style={timeStyle}>{msg.time}</div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <div style={inputContainer}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="输入消息..."
                    style={inputStyle}
                    disabled={loading}
                />
                <button onClick={handleSend} style={sendButton} disabled={loading}>
                    {loading ? '发送中...' : '发送'}
                </button>
            </div>
        </div>
    );
};

const myMessageStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end' as const,
    margin: '5px 0'
};
const othersMessageStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-start' as const,
    margin: '5px 0'
};
const senderStyle: CSSProperties = {
    fontSize: '12px',
    marginBottom: '3px',
    color: '#666',
    paddingLeft: '10px'
};
const textStyle: CSSProperties = {
    marginBottom: '3px',
    wordBreak: 'break-all'
};
const timeStyle: CSSProperties = {
    fontSize: '11px',
    textAlign: 'right' as const,
    color: '#999'
};

// QQ风格样式调整
const containerStyle: CSSProperties = {
    maxWidth: '800px',
    margin: '0 auto',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    boxSizing: 'border-box' as const,
    border: '1px solid #ccc',
    borderRadius: '5px',
    overflow: 'hidden',
    backgroundColor: '#fff'
};

const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '10px 15px',
    borderBottom: '1px solid #ccc',
    backgroundColor: '#f0f0f0',
    height: '50px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
};

const backButton: CSSProperties = {
    padding: '5px 10px',
    backgroundColor: '#e0e0e0',
    border: '1px solid #ccc',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '14px'
};

const messagesContainer: CSSProperties = {
    flex: 1,
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    padding: '15px',
    backgroundColor: '#e5e9ec', // 兜底色（图片加载失败时显示）
    backgroundImage: 'url(/images/celeste.jpg)',
    backgroundRepeat: 'no-repeat', // 禁止重复（避免拼接痕迹）
    backgroundSize: 'cover', // 核心：按比例缩放，完全覆盖容器（裁剪边缘但无拉伸）
    backgroundPosition: 'center center', // 图片居中（确保核心区域显示）
};

const emptyMessageStyle: CSSProperties = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center' as const,
    color: '#999',
    fontSize: '14px',
    fontStyle: 'italic'
};

const messageBubbleStyle = (isMyMessage: boolean): CSSProperties => ({
    maxWidth: '70%',
    padding: '8px 12px',
    borderRadius: isMyMessage ? '8px 2px 8px 8px' : '2px 8px 8px 8px',
    backgroundColor: isMyMessage ? '#95ec69' : '#fff',
    color: isMyMessage ? '#000' : '#000',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
    position: 'relative'
});

const inputContainer: CSSProperties = {
    display: 'flex',
    gap: '10px',
    padding: '10px',
    borderTop: '1px solid #ccc',
    backgroundColor: '#f0f0f0'
};

const inputStyle: CSSProperties = {
    flex: 1,
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '14px',
    resize: 'none',
    height: '40px',
    boxSizing: 'border-box' as const,
    overflowY: 'auto' as const
};

const sendButton: CSSProperties = {
    padding: '8px 18px',
    backgroundColor: '#0084ff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500
};

export default MessageView;