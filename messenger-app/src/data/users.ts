// 定义用户类型接口
export interface User {
    id: string;
    name: string;
}

// 预设用户列表
export const users: User[] = [
    { id: '1', name: 'Alice' },
    { id: '2', name: 'Bob' },
    { id: '3', name: 'Charlie' }
];

// 声明为模块（解决TypeScript隔离模块问题）
export { };