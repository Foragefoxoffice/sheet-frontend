import { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Input, Card, Typography, Tooltip, message, Skeleton } from 'antd';
import { Key, Copy, Eye, EyeOff, Search, Users, Shield, Building2, Phone, Mail } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';

const { Title, Text } = Typography;

export default function AllPasswords() {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [visiblePasswords, setVisiblePasswords] = useState({});

    useEffect(() => {
        fetchUsersWithPasswords();
    }, []);

    const fetchUsersWithPasswords = async () => {
        try {
            setLoading(true);
            const response = await api.get('/users/all-passwords');
            setUsers(response.data.users || []);
        } catch (error) {
            console.error('Error fetching passwords:', error);
            message.error(error.response?.data?.error || 'Failed to fetch passwords');
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = (userId) => {
        setVisiblePasswords(prev => ({
            ...prev,
            [userId]: !prev[userId]
        }));
    };

    const copyToClipboard = (text, label) => {
        navigator.clipboard.writeText(text);
        message.success(`${label} copied to clipboard`);
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.whatsapp && u.whatsapp.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.role?.displayName || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const columns = [
        {
            title: 'User Name',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#253094]/10 flex items-center justify-center text-[#253094] font-bold">
                        {text.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <Text strong className="block">{text}</Text>
                        <Text type="secondary" size="small">+{record.whatsapp}</Text>
                    </div>
                </div>
            )
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: (role) => (
                <Tag color="blue" className="px-3 py-1 rounded-full font-medium">
                    {role?.displayName || role}
                </Tag>
            )
        },
        {
            title: 'Department',
            dataIndex: 'department',
            key: 'department',
            render: (dept) => (
                <span className="text-gray-600 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    {dept?.name || 'N/A'}
                </span>
            )
        },
        {
            title: 'Original Password',
            dataIndex: 'original_password',
            key: 'original_password',
            render: (password, record) => (
                <div className="flex items-center gap-2 max-w-[300px]">
                    {password ? (
                        <>
                            <Input.Password
                                value={password}
                                readOnly
                                visibilityToggle={{
                                    visible: visiblePasswords[record._id],
                                    onVisibleChange: () => togglePasswordVisibility(record._id)
                                }}
                                className="bg-gray-50 border-gray-100 font-mono text-sm flex-1"
                            />
                            <Tooltip title="Copy Password">
                                <Button
                                    icon={<Copy className="w-4 h-4" />}
                                    onClick={() => copyToClipboard(password, 'Password')}
                                    className="flex items-center justify-center shrink-0"
                                />
                            </Tooltip>
                        </>
                    ) : (
                        <div className="flex flex-col text-left">
                            <Text type="secondary" size="small" className="italic text-xs">
                                Password not yet recorded
                            </Text>
                            <Text type="secondary" style={{ fontSize: '10px' }}>
                                (Reset or update password to see it here)
                            </Text>
                        </div>
                    )}
                </div>
            )
        }
    ];

    const userRole = (user?.role?.name || user?.role || '').toLowerCase().replace(/\s+/g, '');
    if (userRole !== 'superadmin') {
        return (
            <div className="flex items-center justify-center min-h-[60vh] p-4">
                <Card className="text-center p-6 md:p-12 max-w-md shadow-lg border-red-100 rounded-2xl">
                    <div className="text-5xl md:text-6xl mb-6">🔒</div>
                    <Title level={2} className="text-red-600">Access Denied</Title>
                    <Text className="text-gray-600 block mb-6 px-4">
                        This section is only available for Superadmin users.
                    </Text>
                    <Button type="primary" size="large" onClick={() => window.history.back()} className="rounded-xl w-full">
                        Go Back
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-[1400px] mx-auto pb-24 md:pb-8">
            {/* Header section */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
                <div className="w-full">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-[#253094] flex items-center justify-center text-white shadow-lg shadow-blue-900/20 shrink-0">
                            <Key className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <Title level={2} md={1} style={{ margin: 0 }} className="text-[#253094] text-lg md:text-3xl font-extrabold">User Passwords</Title>
                    </div>
                    <Text className="text-gray-500 font-medium ml-0 md:ml-15 block text-sm md:text-base">
                        Detailed view of all user credentials for system auditing.
                    </Text>
                </div>

                <div className="w-full md:w-80 group">
                    <Input
                        prefix={<Search className="w-4 h-4 text-gray-400 group-hover:text-[#253094] transition-colors" />}
                        placeholder="Search members..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-11 md:h-12 rounded-xl bg-white border-gray-200 shadow-sm focus:shadow-md transition-all"
                    />
                </div>
            </div>

            {/* Stats section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
                <Card className="border-none shadow-sm bg-linear-to-br from-blue-500 to-indigo-600 text-white rounded-2xl overflow-hidden relative">
                    <div className="relative z-10">
                        <Text className="text-blue-100 font-medium mb-1 block">Total Users</Text>
                        <Title style={{ margin: "0" }} level={2} className="text-white m-0 text-3xl font-bold">{users.length}</Title>
                    </div>
                    <Users className="absolute right-[-10px] bottom-[-10px] w-24 h-24 text-white opacity-10" />
                </Card>

                <Card className="border-none shadow-sm bg-white rounded-2xl p-0">
                    <div className="flex items-center gap-4 md:p-4 p-0">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                            <Shield className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <div>
                            <Text className="text-gray-500 font-medium block text-xs md:text-sm">Superadmin View</Text>
                            <Text strong className="text-sm md:text-base">Restricted Access Enabled</Text>
                        </div>
                    </div>
                </Card>

                <Card className="border-none shadow-sm bg-white rounded-2xl p-0">
                    <div className="flex items-center gap-4 md:p-4 p-0">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-500 shrink-0">
                            <Key className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <div>
                            <Text className="text-gray-500 font-medium block text-xs md:text-sm">Security Protocol</Text>
                            <Text strong className="text-sm md:text-base">Bcrypt Hashing Active</Text>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block">
                <Card className="border-gray-100 shadow-xl shadow-gray-200/50 rounded-2xl overflow-hidden">
                    {loading ? (
                        <div className="p-6">
                            <Skeleton active paragraph={{ rows: 10 }} />
                        </div>
                    ) : (
                        <Table
                            dataSource={filteredUsers}
                            columns={columns}
                            rowKey="_id"
                            pagination={{
                                pageSize: 10,
                                className: "px-6",
                                showTotal: (total) => `Total ${total} users`
                            }}
                            className="custom-ant-table"
                        />
                    )}
                </Card>
            </div>

            {/* Mobile Card View */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <Card key={i} className="rounded-2xl border-gray-100 shadow-sm animate-pulse">
                            <Skeleton active avatar paragraph={{ rows: 2 }} />
                        </Card>
                    ))
                ) : (
                    filteredUsers.map((record) => (
                        <Card key={record._id} className="rounded-2xl border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden p-0">
                            <div className="p-2 border-b border-gray-50 bg-gray-50/30">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-[#253094] flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-md">
                                        {record.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <Text strong className="text-base block truncate leading-tight mb-1">{record.name}</Text>
                                        <Tag color="blue" className="text-[10px] px-2.5 py-0.5 border-none rounded-lg font-semibold uppercase tracking-wider">
                                            {record.role?.displayName || record.role}
                                        </Tag>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex items-center gap-2 text-xs text-gray-600 bg-white/60 p-2 rounded-xl border border-gray-100/50">
                                        <Phone className="w-3.5 h-3.5 text-green-500 shrink-0" />
                                        <span className="truncate">+{record.whatsapp}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-600 bg-white/60 p-2 rounded-xl border border-gray-100/50">
                                        <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                        <span className="truncate">{record.department?.name || 'No Dept'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-2">
                                <Text className="text-[11px] uppercase tracking-wider font-bold text-gray-400 block mb-3 ml-0.5">Login Password</Text>
                                {record.original_password ? (
                                    <div className="flex items-center gap-2">
                                        <Input.Password
                                            value={record.original_password}
                                            readOnly
                                            visibilityToggle={{
                                                visible: visiblePasswords[record._id],
                                                onVisibleChange: () => togglePasswordVisibility(record._id)
                                            }}
                                            className="bg-gray-50 border-gray-100 font-mono text-sm flex-1 h-12 rounded-xl"
                                        />
                                        <Button
                                            icon={<Copy className="w-5 h-5 text-gray-600" />}
                                            onClick={() => copyToClipboard(record.original_password, 'Password')}
                                            className="h-12 w-12 flex items-center justify-center shrink-0 rounded-xl bg-gray-50 border-gray-100 hover:bg-gray-100"
                                        />
                                    </div>
                                ) : (
                                    <div className="bg-orange-50/40 md:p-4 p-2 rounded-2xl border border-orange-100/50 flex flex-col items-center text-center">
                                        <Text type="secondary" className="italic text-xs block text-orange-600 font-semibold mb-1">
                                            Password not yet recorded
                                        </Text>
                                        <Text type="secondary" className="text-[10px] block text-orange-400">
                                            Update user profile to see it here.
                                        </Text>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))
                )}
                {filteredUsers.length === 0 && !loading && (
                    <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                        <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                        <Text className="text-gray-400">No matching members found.</Text>
                    </div>
                )}
            </div>

            <style jsx>{`
                .custom-ant-table :global(.ant-table-thead > tr > th) {
                    background: #f8fafc;
                    font-weight: 700;
                    color: #475569;
                    border-bottom: 2px solid #f1f5f9;
                }

                .ant-card-body{
                padding: 16px !important;
                }
                .custom-ant-table :global(.ant-table-row:hover) {
                    background-color: #f8fafc !important;
                }
                .ml-15 {
                    margin-left: 0;
                }
                @media (min-width: 768px) {
                    .ml-15 {
                        margin-left: 60px;
                    }
                }
            `}</style>
        </div>
    );
}