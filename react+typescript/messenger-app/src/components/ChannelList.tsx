import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CSSProperties } from 'react';
import { fetchUsers, User, Message, fetchAllMessages } from '../api/chatApi';
import ClearDataButton from './ClearDataButton'; // 引入组件

const ChannelList = () => {
    const currentUser = sessionStorage.getItem('currentUser');
    const [users, setUsers] = useState<User[]>([]);
    const [latestMessages, setLatestMessages] = useState<Record<string, string>>({});
    const navigate = useNavigate();

    // 从API拉取并更新所有用户的最新消息
    // 更新最新消息（提取为独立函数，方便清理后调用）
    const updateLatestMessages = async () => {
        if (!currentUser) return;

        try {
            const allMessages = await fetchAllMessages(currentUser);
            const userLatestMap: Record<string, string> = {};

            users.forEach(user => {
                if (user.name === currentUser) return;
                const userMessages = allMessages.filter(msg =>
                    (msg.sender === currentUser && msg.receiver === user.name) ||
                    (msg.sender === user.name && msg.receiver === currentUser)
                );
                if (userMessages.length > 0) {
                    const sorted = userMessages.sort((a, b) => a.timestamp - b.timestamp);
                    userLatestMap[user.name] = sorted[sorted.length - 1].text;
                }
            });

            setLatestMessages(userLatestMap);
        } catch (error) {
            console.error('更新最新消息失败:', error);
        }
    };
    // 清理数据后的回调：重新加载消息（显示空状态）
    const handleClearComplete = () => {
        updateLatestMessages();
    };
    // 初始化+实时同步逻辑
    useEffect(() => {
        // 加载用户列表
        const loadUsers = async () => {
            const data = await fetchUsers();
            setUsers(data);
        };
        loadUsers();

        // 初始加载最新消息
        updateLatestMessages();

        // 1. 定时拉取API（每2秒，确保实时性）
        const apiInterval = setInterval(updateLatestMessages, 5000);

        // 2. 监听localStorage变化（本地发送消息时立即同步）
        const handleStorageChange = () => {
            updateLatestMessages();
        };
        window.addEventListener('storage', handleStorageChange);

        // 清理资源
        return () => {
            clearInterval(apiInterval);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [currentUser, users]);

    // 退出登录
    const handleLogout = () => {
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('windowId');
        navigate('/');
    };

    // 过滤可聊天用户
    const chatUsers = users.filter(user => user.name !== currentUser);

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <h2>Message List</h2>
                <button onClick={handleLogout} style={logoutButton}>Exit</button>
            </div>
            {/* 添加清空数据按钮 */}
            <ClearDataButton onClearComplete={handleClearComplete} />
            <div style={channelListStyle}>
                {chatUsers.map(user => (
                    <div
                        key={user.id}
                        style={channelItemStyle}
                        onClick={() => navigate(`/channels/${user.name}`)}
                        onMouseEnter={(e) => (e.target as HTMLDivElement).style.backgroundColor = '#f0f0f0'}
                        onMouseLeave={(e) => (e.target as HTMLDivElement).style.backgroundColor = '#f9f9f9'}
                    >
                        <div style={avatarStyle}>{user.name.substring(0, 2).toUpperCase()}</div>
                        <div style={infoStyle}>
                            <div style={nameStyle}>{user.name}</div>
                            <div style={messageStyle}>
                                {latestMessages[user.name] || '点击开始聊天'}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// 样式调整
const containerStyle: CSSProperties = {
    padding: '0',
    maxWidth: '400px',
    margin: '0 auto',
    height: '100vh',
    boxSizing: 'border-box' as const,
    boxShadow: '0 0 20px rgba(58, 28, 177, 0.26)',
    backgroundColor: 'white'
};

const headerStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between' as const,
    alignItems: 'center',
    padding: '16px 24px',
    borderBottom: '1px solid #808971ff',
    backgroundColor: '#fafafa'
};

const logoutButton: CSSProperties = {
    padding: '8px 16px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
};

const channelListStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column' as const,
    flex: 1,
    overflowY: 'auto' as const
};

const channelItemStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '16px 24px',
    borderBottom: '1px solid #bd69abff',
    cursor: 'pointer',
    backgroundColor: 'white',
    transition: 'background-color 0.2s'
};

const avatarStyle: CSSProperties = {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: '#3640d2ff',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center' as const,
    fontWeight: 'bold',
    fontSize: '16px'
};

const infoStyle: CSSProperties = { flex: 1, overflow: 'hidden' };
const nameStyle: CSSProperties = {
    fontWeight: 'bold',
    marginBottom: '5px',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const
};

const messageStyle: CSSProperties = {
    color: '#666',
    fontSize: '14px',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const
};

export default ChannelList;