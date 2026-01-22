import { Users as UsersIcon, UserPlus, Mail, Phone, Search as SearchIcon, Edit, Trash2, Building2, Shield } from 'lucide-react';
import { Input, Select, Button, Tabs, Skeleton } from 'antd';
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Modal from '../components/common/Modal';
import CreateUserForm from '../components/features/users/CreateUserForm';
import EditUserForm from '../components/features/users/EditUserForm';
import StatCard from '../components/common/StatCard';
import api from '../utils/api';

function UsersSkeleton() {
    return (
        <div>
            {/* Header skeleton */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
                <div className="w-full md:w-auto">
                    <Skeleton active title={{ width: 220 }} paragraph={{ rows: 1, width: 340 }} />
                </div>
                <div className="w-full md:w-auto">
                    <Skeleton.Button active style={{ width: 180, height: 44, borderRadius: 12 }} />
                </div>
            </div>

            {/* Stats cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <Skeleton active title={{ width: 140 }} paragraph={{ rows: 2, width: ['60%', '40%'] }} />
                            </div>
                            <Skeleton.Avatar active size={44} shape="square" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters skeleton */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-2">
                        {Array.from({ length: 4 }).map((_, idx) => (
                            <Skeleton.Button key={idx} active size="small" style={{ width: 140, height: 40, borderRadius: 12 }} />
                        ))}
                    </div>
                    <div className="h-px bg-gray-100" />
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <div className="flex-1 w-full">
                            <Skeleton.Input active style={{ width: '100%', height: 48, borderRadius: 12 }} />
                        </div>
                        <div className="w-full md:w-[280px]">
                            <Skeleton.Input active style={{ width: '100%', height: 48, borderRadius: 12 }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Users grid skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 9 }).map((_, idx) => (
                    <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-start justify-between mb-3 gap-4">
                            <Skeleton.Avatar active size={64} shape="square" />
                            <div className="flex flex-col items-end gap-2">
                                <Skeleton.Button active size="small" style={{ width: 110, height: 22, borderRadius: 999 }} />
                                <Skeleton.Button active size="small" style={{ width: 90, height: 22, borderRadius: 999 }} />
                            </div>
                        </div>

                        <div className="mb-3">
                            <Skeleton active title={{ width: '70%' }} paragraph={{ rows: 1, width: '50%' }} />
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <Skeleton active title={false} paragraph={{ rows: 2, width: ['90%', '70%'] }} />
                        </div>

                        <div className="mt-6 flex gap-3 pt-2">
                            <Skeleton.Button active style={{ flex: 1, height: 40, borderRadius: 12 }} />
                            <Skeleton.Button active style={{ width: 56, height: 40, borderRadius: 12 }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function Users() {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    // ... existing states ...
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await fetchUsers(1);
            await fetchDepartments();
            setLoading(false);
        };
        loadData();
    }, []);

    // Infinite scroll listener
    useEffect(() => {
        const handleScroll = () => {
            if (
                window.innerHeight + document.documentElement.scrollTop >=
                document.documentElement.offsetHeight - 100 &&
                hasMore &&
                !loading &&
                !loadingMore
            ) {
                setPage(prev => prev + 1);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [hasMore, loading, loadingMore]);

    // Fetch more when page changes
    useEffect(() => {
        if (page > 1) {
            fetchUsers(page);
        }
    }, [page]);

    useEffect(() => {
        // Fetch roles after users are loaded (only on initial load or if improved logic needed)
        // Keeping this simple to avoid refreshing roles constantly
        if (users.length > 0 && roles.length === 0) {
            fetchRoles();
        }
    }, [users.length]);

    const fetchUsers = async (pageNum) => {
        try {
            if (pageNum === 1) {
                // Initial load
            } else {
                setLoadingMore(true);
            }

            const response = await api.get(`/users?page=${pageNum}&limit=10`);
            const newUsers = response.data.users || [];

            if (pageNum === 1) {
                setUsers(newUsers);
            } else {
                setUsers(prev => {
                    // Filter out duplicates just in case
                    const existingIds = new Set(prev.map(u => u._id));
                    const uniqueNewUsers = newUsers.filter(u => !existingIds.has(u._id));
                    return [...prev, ...uniqueNewUsers];
                });
            }

            setHasMore(response.data.pagination?.hasMore || false);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            if (pageNum === 1) setLoading(false);
            setLoadingMore(false);
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

    const fetchRoles = async () => {
        try {
            const response = await api.get('/users/available-roles');
            // available-roles returns only roles that the user can manage
            const availableRoles = response.data.roles || [];

            // Also include current user's own role for display purposes
            const currentUserRole = user?.role;
            if (currentUserRole && typeof currentUserRole === 'object') {
                const hasCurrentRole = availableRoles.some(r => r._id === currentUserRole._id);
                if (!hasCurrentRole) {
                    availableRoles.push(currentUserRole);
                }
            }

            setRoles(availableRoles);
        } catch (error) {
            console.error('Error fetching roles:', error);
            // Fallback: extract unique roles from users list
            const userRoles = users.map(u => u.role).filter(Boolean);
            const uniqueRoles = [];
            const seenRoleIds = new Set();

            userRoles.forEach(role => {
                if (typeof role === 'object') {
                    const roleId = role._id;
                    if (!seenRoleIds.has(roleId)) {
                        seenRoleIds.add(roleId);
                        uniqueRoles.push(role);
                    }
                }
            });

            setRoles(uniqueRoles);
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
        const roleLevel = role?.level || 0;

        // Color based on role level for dynamic roles
        if (roleLevel >= 5) return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'; // Super Admin
        if (roleLevel >= 4) return 'bg-purple-100 text-purple-700'; // Director level
        if (roleLevel >= 3) return 'bg-primary-100 text-primary-700'; // GM level
        if (roleLevel >= 2) return 'bg-success-100 text-success-700'; // Manager level
        return 'bg-gray-100 text-gray-700'; // Staff level
    };

    const getDesignationColor = (designation) => {
        const level = designation?.level || 0;

        if (level >= 5) return 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white';
        if (level >= 4) return 'bg-blue-100 text-blue-700';
        if (level >= 3) return 'bg-indigo-100 text-indigo-700';
        if (level >= 2) return 'bg-cyan-100 text-cyan-700';
        return 'bg-slate-100 text-slate-600';
    };

    // Get user role name
    const userRoleName = user?.role?.name || user?.role;

    // Create tabs based on available roles (roles user can manage)
    // Show "All Members" tab plus tabs for each role the user can manage
    const allTabs = [
        { key: 'all', label: `All Members (${users.length})` },
        ...roles
            .filter(role => role.name !== 'superadmin') // Never show Super Admin tab
            .map(role => ({
                key: role.name,
                label: `${role.displayName} (${users.filter(u => u.role?.name === role.name).length})`
            }))
    ];

    // Use all tabs - roles state already contains only manageable roles from available-roles endpoint
    const tabsItems = allTabs;

    const filteredUsers = users.filter(u => {
        const matchesTab = activeTab === 'all' || u.role?.name === activeTab;
        const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()));

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

    // Show skeleton for the full page (header, stats, filters, grid)
    if (loading) {
        return <UsersSkeleton />;
    }

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-[#253094]">Team Members</h1>
                    <p className="text-gray-500 mt-1 font-medium">Manage your team members, roles, and permissions</p>
                </div>
                <Button
                    type="primary"
                    onClick={() => setShowCreateModal(true)}
                    className="bg-primary hover:bg-primary-600 flex items-center justify-center gap-2 h-11 px-6 w-full md:w-auto rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
                    icon={<UserPlus className="w-5 h-5" />}
                >
                    Add Member
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <StatCard
                    title="Total Members"
                    value={users.length.toString()}
                    subtitle="Active users"
                    icon={UsersIcon}
                    iconBg="bg-blue-50"
                    iconColor="text-[#253094]"
                />
                <StatCard
                    title="Departments"
                    value={departments.length.toString()}
                    subtitle="Operational units"
                    icon={Building2}
                    iconBg="bg-green-50"
                    iconColor="text-[#2D9E36]"
                />
                <StatCard
                    title="Roles"
                    value={roles.length.toString()}
                    subtitle="Access levels"
                    icon={Shield}
                    iconBg="bg-purple-50"
                    iconColor="text-purple-600"
                />
            </div>

            {/* Tabs and Search */}
            {/* Filters & Search Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                <div className="flex flex-col gap-6">
                    {/* Role Tabs */}
                    <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {tabsItems.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`
                                    relative px-5 py-2.5 cursor-pointer rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap
                                    ${activeTab === tab.key
                                        ? 'bg-[#253094] text-white translate-y-[-1px]'
                                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-[#253094]'
                                    }
                                `}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="h-px bg-gray-100" />

                    {/* Search & Filter Bar */}
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <div className="flex-1 w-full relative group">
                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-[#253094] transition-colors" />
                            <input
                                type="text"
                                placeholder="Search members by name, email, or phone..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-12 pl-12 pr-4 bg-gray-50 border-none rounded-xl text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-[#253094]/10 transition-all outline-none"
                            />
                        </div>
                        <div className="w-full md:w-[280px]">
                            <Select
                                value={departmentFilter}
                                onChange={setDepartmentFilter}
                                style={{ width: '100%', height: '48px' }}
                                size="large"
                                className="custom-select-large"
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
            {filteredUsers.length === 0 ? (
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
                        <div key={member._id} className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-primary-100 transition-all duration-300 relative overflow-hidden">
                            {/* Decorative Background */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-50 to-transparent opacity-0 group-hover:opacity-100 rounded-bl-full transition-all duration-500 -mr-8 -mt-8 pointer-events-none"></div>

                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-16 h-16 bg-[#253094] rounded-2xl shadow-lg shadow-blue-900/20 flex items-center justify-center text-white font-bold text-2xl transform transition-transform duration-300">
                                        {member.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${getRoleBadgeColor(member.role)}`}>
                                            {member.role?.displayName || member.role}
                                        </span>
                                        {member.designation && (
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDesignationColor(member.designation)}`}>
                                                {member.designation}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-[#253094] transition-colors">{member.name}</h3>
                                    <p className="text-gray-500 font-medium text-sm flex items-center gap-1.5">
                                        <Building2 className="w-3.5 h-3.5" />
                                        {typeof member.department === 'object' ? member.department?.name : 'Department'}
                                    </p>
                                </div>

                                <div className="space-y-3 mb-6 bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    {member.email && (
                                        <div className="flex items-center gap-3 text-sm text-gray-600">
                                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#253094] shadow-sm">
                                                <Mail className="w-4 h-4" />
                                            </div>
                                            <span className="truncate font-medium">{member.email}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#2D9E36] shadow-sm">
                                            <Phone className="w-4 h-4" />
                                        </div>
                                        <span className="font-medium">+{member.whatsapp}</span>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Button
                                        onClick={() => handleEdit(member)}
                                        className="flex-1 h-10 flex items-center justify-center gap-2 border-primary text-primary hover:bg-primary-50 rounded-xl font-semibold"
                                        icon={<Edit className="w-4 h-4" />}
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        danger
                                        onClick={() => handleDelete(member._id)}
                                        className="h-10 px-4 rounded-xl hover:bg-red-50"
                                        icon={<Trash2 className="w-4 h-4" />}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {loadingMore && (
                <div className="py-8 flex justify-center">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-4 border-[#253094] border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm text-gray-500 font-medium">Loading more members...</p>
                    </div>
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
