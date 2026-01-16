import { useState, useEffect } from 'react';
import { Users as UsersIcon, UserPlus, Mail, Phone, Search as SearchIcon, Filter, Edit, Trash2, Building2 } from 'lucide-react';
import { Input, Select, Button, Tabs } from 'antd';
import { useAuth } from '../hooks/useAuth';
import Modal from '../components/common/Modal';
import CreateUserForm from '../components/features/users/CreateUserForm';
import EditUserForm from '../components/features/users/EditUserForm';
import api from '../utils/api';

export default function Users() {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        fetchUsers();
        fetchDepartments();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users');
            setUsers(response.data.users || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await api.get('/departments');
            setDepartments(response.data.departments || []);
        } catch (error) {
            console.error('Error fetching departments:', error);
        }
    };

    const handleCreateSuccess = (newUser) => {
        setUsers(prev => [...prev, newUser]);
        setShowCreateModal(false);
    };

    const handleEdit = (userToEdit) => {
        setSelectedUser(userToEdit);
        setShowEditModal(true);
    };

    const handleEditSuccess = (updatedUser) => {
        setUsers(prev => prev.map(u => u._id === updatedUser._id ? updatedUser : u));
        setShowEditModal(false);
        setSelectedUser(null);
        fetchUsers(); // Refresh the list
    };

    const handleDelete = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) {
            return;
        }

        try {
            await api.delete(`/users/${userId}`);
            setUsers(prev => prev.filter(u => u._id !== userId));
        } catch (error) {
            console.error('Failed to delete user:', error);
        }
    };

    const getRoleBadgeColor = (role) => {
        const roleName = role?.name || role;
        switch (roleName) {
            case 'director':
                return 'bg-purple-100 text-purple-700';
            case 'generalmanager':
                return 'bg-primary-100 text-primary-700';
            case 'manager':
                return 'bg-success-100 text-success-700';
            case 'staff':
                return 'bg-gray-100 text-gray-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    // Get user role name
    const userRoleName = user?.role?.name || user?.role;

    // Define all tabs
    const allTabs = [
        { key: 'all', label: `All Members (${users.length})` },
        { key: 'director', label: `Directors (${users.filter(u => u.role?.name === 'director').length})` },
        { key: 'generalmanager', label: `General Managers (${users.filter(u => u.role?.name === 'generalmanager').length})` },
        { key: 'manager', label: `Managers (${users.filter(u => u.role?.name === 'manager').length})` },
        { key: 'staff', label: `Staff (${users.filter(u => u.role?.name === 'staff').length})` },
    ];

    // Filter tabs based on user role
    const tabsItems = userRoleName === 'manager'
        ? allTabs.filter(tab => ['all', 'manager', 'staff'].includes(tab.key))
        : allTabs;

    const filteredUsers = users.filter(u => {
        const matchesTab = activeTab === 'all' || u.role?.name === activeTab;
        const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase());

        // Handle department filter - department can be an object or string ID
        const userDeptId = typeof u.department === 'object' ? u.department?._id : u.department;
        const matchesDepartment = departmentFilter === 'all' || userDeptId === departmentFilter;

        return matchesTab && matchesSearch && matchesDepartment;
    });

    // Check if user has permission to view users
    if (!user?.permissions?.viewUsers) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="text-6xl mb-4">🔒</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600">You don't have permission to view users.</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
                    <p className="text-gray-500 mt-1">Manage your team members and their roles</p>
                </div>
                <Button
                    type="primary"
                    onClick={() => setShowCreateModal(true)}
                    className="bg-primary hover:bg-primary-600 flex items-center gap-2 h-auto py-2.5 px-6"
                    icon={<UserPlus className="w-5 h-5" />}
                >
                    Add Member
                </Button>
            </div>

            {/* Tabs and Search */}
            <div className="bg-white rounded-card shadow-card mb-6">
                <div className="px-6 pt-2">
                    <Tabs
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        items={tabsItems}
                    />
                </div>

                {/* Search and Filter */}
                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="flex-1">
                            <Input
                                prefix={<SearchIcon className="w-4 h-4 text-gray-400" />}
                                placeholder="Search members..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                size="large"
                            />
                        </div>
                        <div className="w-[200px]">
                            <Select
                                value={departmentFilter}
                                onChange={setDepartmentFilter}
                                style={{ width: '100%' }}
                                size="large"
                                options={[
                                    { value: 'all', label: 'All Departments' },
                                    ...departments.map(d => ({ value: d._id, label: d.name }))
                                ]}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading users...</p>
                    </div>
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="bg-white rounded-card shadow-card p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UsersIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {searchQuery ? 'No users found' : 'No users in this category'}
                    </h3>
                    <p className="text-gray-600 mb-6">
                        {searchQuery ? 'Try adjusting your search' : 'Get started by creating your first team member'}
                    </p>
                    {!searchQuery && (
                        <Button
                            type="primary"
                            onClick={() => setShowCreateModal(true)}
                            className="bg-primary hover:bg-primary-600 h-auto py-2.5 px-6"
                            icon={<UserPlus className="w-5 h-5" />}
                        >
                            Create First User
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredUsers.map((member) => (
                        <div key={member._id} className="bg-white rounded-card shadow-card p-6 hover:shadow-card-hover transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 bg-linear-to-br from-primary to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                                    {member.name.charAt(0).toUpperCase()}
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                                    {member.role?.displayName || member.role}
                                </span>
                            </div>

                            <h3 className="text-lg font-semibold text-gray-900 mb-1">{member.name}</h3>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Mail className="w-4 h-4" />
                                    <span className="truncate">{member.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Phone className="w-4 h-4" />
                                    <span>+{member.whatsapp}</span>
                                </div>
                                {member.department && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Building2 className="w-4 h-4" />
                                        <span className="truncate">
                                            {typeof member.department === 'object' ? member.department.name : 'Department'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    onClick={() => handleEdit(member)}
                                    className="flex-1 flex items-center justify-center gap-1"
                                    icon={<Edit className="w-4 h-4" />}
                                >
                                    Edit
                                </Button>
                                <Button
                                    danger
                                    onClick={() => handleDelete(member._id)}
                                    icon={<Trash2 className="w-4 h-4" />}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create User Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Create New User"
            >
                <CreateUserForm
                    onSuccess={handleCreateSuccess}
                    onCancel={() => setShowCreateModal(false)}
                    departments={departments}
                />
            </Modal>

            {/* Edit User Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                }}
                title="Edit User"
            >
                <EditUserForm
                    user={selectedUser}
                    onSuccess={handleEditSuccess}
                    onCancel={() => {
                        setShowEditModal(false);
                        setSelectedUser(null);
                    }}
                    departments={departments}
                />
            </Modal>
        </div>
    );
}
