import { useState, useEffect } from 'react';
import { Users as UsersIcon, UserPlus, Mail, Phone, Search, Filter, Edit, Trash2, Building2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { ROLES } from '../utils/constants';
import Modal from '../components/common/Modal';
import CreateUserForm from '../components/features/users/CreateUserForm';
import EditUserForm from '../components/features/users/EditUserForm';
import api from '../utils/api';
import { showToast } from '../utils/helpers';

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
            // Assuming showToast is defined elsewhere, uncomment if available
            // showToast('Failed to load users', 'error');
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
            // showToast('User deleted successfully', 'success'); // Assuming showToast is defined elsewhere
        } catch (error) {
            // showToast(error.response?.data?.error || 'Failed to delete user', 'error'); // Assuming showToast is defined elsewhere
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

    const tabs = [
        { id: 'all', label: 'All Members', count: users.length },
        { id: 'director', label: 'Directors', count: users.filter(u => u.role?.name === 'director').length },
        { id: 'generalmanager', label: 'General Managers', count: users.filter(u => u.role?.name === 'generalmanager').length },
        { id: 'manager', label: 'Managers', count: users.filter(u => u.role?.name === 'manager').length },
        { id: 'staff', label: 'Staff', count: users.filter(u => u.role?.name === 'staff').length },
    ];

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
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-6 py-2.5 bg-primary text-black rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2 font-medium shadow-sm hover:shadow-md"
                >
                    <UserPlus className="w-5 h-5" />
                    Add Member
                </button>
            </div>

            {/* Tabs and Search */}
            <div className="bg-white rounded-card shadow-card mb-6">
                <div className="border-b border-gray-200 px-6">
                    <div className="flex items-center justify-between">
                        <div className="flex gap-1 -mb-px">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {tab.label} ({tab.count})
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search members..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                            />
                        </div>
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                            <select
                                value={departmentFilter}
                                onChange={(e) => setDepartmentFilter(e.target.value)}
                                className="pl-10 pr-8 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none appearance-none cursor-pointer min-w-[180px]"
                            >
                                <option value="all">All Departments</option>
                                {departments.map(dept => (
                                    <option key={dept._id} value={dept._id}>
                                        {dept.name}
                                    </option>
                                ))}
                            </select>
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
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors inline-flex items-center gap-2 font-medium"
                        >
                            <UserPlus className="w-5 h-5" />
                            Create First User
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredUsers.map((member) => (
                        <div key={member._id} className="bg-white rounded-card shadow-card p-6 hover:shadow-card-hover transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-primary to-purple rounded-full flex items-center justify-center text-white font-semibold text-lg">
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
                                <button
                                    onClick={() => handleEdit(member)}
                                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center justify-center gap-1"
                                >
                                    <Edit className="w-4 h-4" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(member._id)}
                                    className="px-4 py-2 border border-danger-200 text-danger rounded-lg hover:bg-danger-50 transition-colors text-sm font-medium"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
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
