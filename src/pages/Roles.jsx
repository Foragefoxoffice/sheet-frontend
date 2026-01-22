import { useState, useEffect } from 'react';
import { Plus, Trash2, Shield, Search as SearchIcon, ShieldAlert, LayoutGrid, CheckCircle2, Lock } from 'lucide-react';
import { Input, Button, Modal as AntModal, Form, Checkbox, Skeleton } from 'antd';
import { useAuth } from '../hooks/useAuth';
import Modal from '../components/common/Modal';
import api from '../utils/api';
import { showToast } from '../utils/helpers';
import StatCard from '../components/common/StatCard';

function RolesSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="w-full md:w-auto">
                    <Skeleton active title={{ width: 200 }} paragraph={{ rows: 1, width: 300 }} />
                </div>
                <div className="hidden md:block">
                    <Skeleton.Button active size="large" style={{ width: 150, borderRadius: '0.75rem' }} />
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <Skeleton active title={{ width: 100, size: 'small' }} paragraph={{ rows: 1, width: 60 }} />
                            </div>
                            <Skeleton.Avatar active size={48} shape="square" className="rounded-xl" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Search Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <Skeleton.Input active size="large" block style={{ borderRadius: '0.75rem', height: 48 }} />
            </div>

            {/* Roles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col h-full">
                        <div className="flex items-center gap-4 mb-6">
                            <Skeleton.Avatar active size={56} shape="square" className="rounded-2xl" />
                            <div className="flex-1">
                                <Skeleton active title={{ width: '60%' }} paragraph={{ rows: 1, width: '40%' }} />
                            </div>
                        </div>

                        <div className="flex-1 mb-6">
                            <Skeleton active title={false} paragraph={{ rows: 2 }} />
                        </div>

                        <div className="mt-auto">
                            <div className="flex items-center justify-between py-4 border-t border-gray-100 mb-4">
                                <Skeleton.Button active size="small" shape="round" style={{ width: 80 }} />
                                <Skeleton.Button active size="small" shape="round" style={{ width: 100 }} />
                            </div>
                            <Skeleton.Button active block style={{ borderRadius: '0.75rem' }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function Roles() {
    const { user } = useAuth();
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);
    const [form] = Form.useForm();

    // Check if user has permission to view roles
    const canViewRoles = user?.permissions?.viewRoles;

    useEffect(() => {
        if (canViewRoles) {
            fetchRoles();
        } else {
            setLoading(false);
        }
    }, [canViewRoles]);

    const fetchRoles = async () => {
        try {
            setLoading(true);
            const response = await api.get('/roles');
            setRoles(response.data.roles || []);
        } catch (error) {
            console.error('Error fetching roles:', error);
            showToast('Failed to load roles', 'error');
        } finally {
            setLoading(false);
        }
    };

    const permissionCategories = {
        'User Management': ['viewUsers', 'createUsers', 'editUsers', 'deleteUsers'],
        'Department Management': ['viewDepartments', 'createDepartments', 'editDepartments', 'deleteDepartments'],
        'Task Management': ['viewAllTasks', 'viewDepartmentTasks', 'viewAssignedToMeTasks', 'viewIAssignedTasks', 'viewSelfTasks', 'createTasks', 'editOwnTasks', 'editAllTasks', 'deleteOwnTasks', 'deleteAllTasks'],
        'All Tasks Tab Filters': ['filterAllTasksDepartment', 'filterAllTasksPriority', 'filterAllTasksRole', 'filterAllTasksUser'],
        'Department Tasks Tab Filters': ['filterDeptTasksDepartment', 'filterDeptTasksPriority', 'filterDeptTasksRole', 'filterDeptTasksUser'],
        'Assigned to Me Tab Filters': ['filterAssignedToMeDepartment', 'filterAssignedToMePriority', 'filterAssignedToMeRole', 'filterAssignedToMeUser'],
        'I Assigned Tab Filters': ['filterIAssignedDepartment', 'filterIAssignedPriority', 'filterIAssignedRole', 'filterIAssignedUser'],
        'Self Tasks Tab Filters': ['filterSelfTasksDepartment', 'filterSelfTasksPriority', 'filterSelfTasksRole', 'filterSelfTasksUser'],
        'Approvals': ['viewApprovals', 'approveRejectTasks'],
        'Reports': ['viewReports', 'downloadReports'],
        'Role Management': ['viewRoles', 'createRoles', 'deleteRoles'],
    };

    const permissionLabels = {
        viewUsers: 'View Users',
        createUsers: 'Create Users',
        editUsers: 'Edit Users',
        deleteUsers: 'Delete Users',
        viewDepartments: 'View Departments',
        createDepartments: 'Create Departments',
        editDepartments: 'Edit Departments',
        deleteDepartments: 'Delete Departments',
        viewAllTasks: 'View All Tasks',
        viewDepartmentTasks: 'View Department Tasks',
        viewAssignedToMeTasks: 'View "Assigned To Me"',
        viewIAssignedTasks: 'View "I Assigned"',
        viewSelfTasks: 'View "Self Tasks"',
        createTasks: 'Create Tasks',
        editOwnTasks: 'Edit Own Tasks',
        editAllTasks: 'Edit All Tasks',
        deleteOwnTasks: 'Delete Own Tasks',
        deleteAllTasks: 'Delete All Tasks',
        // All Tasks Tab Filters
        filterAllTasksDepartment: 'Department Filter',
        filterAllTasksPriority: 'Priority Filter',
        filterAllTasksRole: 'Role Filter',
        filterAllTasksUser: 'User Filter',
        // Department Tasks Tab Filters
        filterDeptTasksDepartment: 'Department Filter',
        filterDeptTasksPriority: 'Priority Filter',
        filterDeptTasksRole: 'Role Filter',
        filterDeptTasksUser: 'User Filter',
        // Assigned to Me Tab Filters
        filterAssignedToMeDepartment: 'Department Filter',
        filterAssignedToMePriority: 'Priority Filter',
        filterAssignedToMeRole: 'Role Filter',
        filterAssignedToMeUser: 'User Filter',
        // I Assigned Tab Filters
        filterIAssignedDepartment: 'Department Filter',
        filterIAssignedPriority: 'Priority Filter',
        filterIAssignedRole: 'Role Filter',
        filterIAssignedUser: 'User Filter',
        // Self Tasks Tab Filters
        filterSelfTasksDepartment: 'Department Filter',
        filterSelfTasksPriority: 'Priority Filter',
        filterSelfTasksRole: 'Role Filter',
        filterSelfTasksUser: 'User Filter',
        viewApprovals: 'View Approvals',
        approveRejectTasks: 'Approve/Reject Tasks',
        viewReports: 'View Reports',
        downloadReports: 'Download Reports',
        viewRoles: 'View Roles',
        createRoles: 'Create Roles',
        deleteRoles: 'Delete Roles',
    };

    const handleCreateRole = () => {
        setSelectedRole(null);
        form.resetFields();
        setShowCreateModal(true);
    };

    const handleDeleteRole = (roleId, roleName) => {
        AntModal.confirm({
            title: `Delete Role`,
            content: `Are you sure you want to delete the role "${roleName}"?`,
            okText: 'Yes, Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    await api.delete(`/roles/${roleId}`);
                    showToast('Role deleted successfully', 'success');
                    fetchRoles();
                } catch (error) {
                    showToast(error.response?.data?.error || 'Failed to delete role', 'error');
                }
            }
        });
    };

    const handleSubmit = async (values) => {
        try {
            // Extract permissions and managedRoles from values
            const permissions = {};
            const managedRoles = [];

            Object.keys(values).forEach(key => {
                if (key.startsWith('managedRole_')) {
                    // Extract role ID from key like 'managedRole_123abc'
                    if (values[key]) {
                        managedRoles.push(key.replace('managedRole_', ''));
                    }
                } else if (key !== 'name' && key !== 'displayName' && key !== 'description') {
                    permissions[key] = values[key];
                }
            });

            const roleData = {
                name: values.name,
                displayName: values.displayName,
                description: values.description,
                permissions,
                managedRoles
            };

            await api.post('/roles', roleData);
            showToast('Role created successfully', 'success');

            setShowCreateModal(false);
            fetchRoles();
        } catch (error) {
            showToast(error.response?.data?.error || 'Failed to save role', 'error');
        }
    };

    const handleSelectAllCategory = (category, checked) => {
        const categoryPermissions = permissionCategories[category];
        const newValues = {};
        categoryPermissions.forEach(perm => {
            newValues[perm] = checked;
        });
        form.setFieldsValue(newValues);
    };

    const filteredRoles = roles.filter(role =>
        role.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        role.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const countPermissions = (permissions) => {
        return Object.values(permissions || {}).filter(Boolean).length;
    };

    // Calculate stats
    const totalRoles = roles.length;
    const systemRoles = roles.filter(r => r.isSystem).length;
    const customRoles = sortedRoles => totalRoles - systemRoles;

    if (loading) {
        return <RolesSkeleton />;
    }

    // Access Denied UI
    if (!canViewRoles) {
        return (
            <div className="p-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                    <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
                    <p className="text-gray-600">
                        You don't have permission to view roles. Please contact your administrator.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#253094]">Role Management</h1>
                    <p className="text-gray-500 mt-1 font-medium">Create and manage user roles with custom permissions</p>
                </div>
                {user?.permissions?.createRoles && (
                    <Button
                        type="primary"
                        onClick={handleCreateRole}
                        className="bg-primary hover:bg-primary-600 flex items-center justify-center gap-2 h-11 px-6 w-full md:w-auto rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
                        icon={<Plus className="w-5 h-5" />}
                    >
                        Create Role
                    </Button>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total Roles"
                    value={totalRoles.toString()}
                    subtitle="Active system roles"
                    icon={Shield}
                    iconBg="bg-blue-50"
                    iconColor="text-[#253094]"
                />
                <StatCard
                    title="System Roles"
                    value={systemRoles.toString()}
                    subtitle="Pre-defined roles"
                    icon={Lock}
                    iconBg="bg-purple-50"
                    iconColor="text-purple-600"
                />
                <StatCard
                    title="Custom Roles"
                    value={(totalRoles - systemRoles).toString()}
                    subtitle="User created roles"
                    icon={CheckCircle2}
                    iconBg="bg-green-50"
                    iconColor="text-[#2D9E36]"
                />
            </div>

            {/* Search */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="relative group">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-[#253094] transition-colors" />
                    <input
                        type="text"
                        placeholder="Search roles..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 bg-gray-50 border-none rounded-xl text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-[#253094]/10 transition-all outline-none"
                    />
                </div>
            </div>

            {/* Roles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRoles.map((role) => (
                    <div key={role._id} className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-primary-100 transition-all duration-300 relative overflow-hidden flex flex-col h-full">

                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transform transition-transform duration-300 shadow-sm ${role.isStatic
                                    ? 'bg-linear-to-br from-purple-500 to-pink-500 text-white shadow-purple-200'
                                    : role.isSystem
                                        ? 'bg-blue-50 text-blue-600'
                                        : 'bg-purple-50 text-purple-600'
                                    }`}>
                                    <Shield className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-[#253094] transition-colors">{role.displayName}</h3>
                                    {role.isStatic && (
                                        <div className="flex items-center gap-1 mt-1">
                                            <Lock className="w-3 h-3 text-purple-500" />
                                            <span className="text-xs text-purple-600 font-medium">Protected Role</span>
                                        </div>
                                    )}
                                    {role.isSystem && !role.isStatic && (
                                        <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full">System Role</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 mb-0">
                            <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">
                                {role.description || 'No description provided for this role.'}
                            </p>
                        </div>

                        <div className="mt-auto">
                            <div className="flex items-center justify-between py-4 border-t border-gray-100 mb-4">
                                <span className="text-sm font-medium text-gray-500">Permissions</span>
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E8F8EE] text-[#2D9E36] border border-green-100">
                                    {countPermissions(role.permissions)} enabled
                                </span>
                            </div>

                            {!role.isStatic && user?.permissions?.deleteRoles && (
                                <div className="flex">
                                    <Button
                                        danger
                                        onClick={() => handleDeleteRole(role._id, role.displayName)}
                                        className="w-full h-10 rounded-xl hover:bg-red-50 flex items-center justify-center gap-2"
                                        icon={<Trash2 className="w-4 h-4" />}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            )}

                            {!role.isStatic && !user?.permissions?.deleteRoles && (
                                <div className="h-10 flex items-center justify-center text-xs text-gray-400 italic">
                                    Read Only
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {filteredRoles.length === 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                    <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No roles found</h3>
                    <p className="text-gray-600">
                        {searchTerm ? 'Try a different search term' : 'Create your first role to get started'}
                    </p>
                </div>
            )}

            {/* Create/Edit Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => {
                    setShowCreateModal(false);
                }}
                title="Create New Role"
                size="large"
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    className="mt-4"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Form.Item
                            label={<span className="font-medium text-gray-700">Role Name</span>}
                            name="name"
                            rules={[{ required: true, message: 'Please enter role name' }]}
                            help="Lowercase, no spaces (e.g., teamlead)"
                        >
                            <Input
                                placeholder="e.g., teamlead"
                                onChange={(e) => {
                                    form.setFieldsValue({
                                        name: e.target.value.toLowerCase().replace(/\s+/g, '')
                                    });
                                }}
                            />
                        </Form.Item>

                        <Form.Item
                            label={<span className="font-medium text-gray-700">Display Name</span>}
                            name="displayName"
                            rules={[{ required: true, message: 'Please enter display name' }]}
                        >
                            <Input placeholder="e.g., Team Lead" />
                        </Form.Item>
                    </div>

                    <Form.Item
                        label={<span className="font-medium text-gray-700">Description</span>}
                        name="description"
                    >
                        <Input.TextArea rows={2} placeholder="Brief description of this role" />
                    </Form.Item>

                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Permissions</h3>
                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                            {Object.entries(permissionCategories).map(([category, permissions]) => (
                                <div key={category} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-medium text-gray-900">{category}</h4>
                                        <div className="flex gap-2">
                                            <Button
                                                size="small"
                                                type="text"
                                                className="text-primary hover:bg-primary-50"
                                                onClick={() => handleSelectAllCategory(category, true)}
                                            >
                                                Select All
                                            </Button>
                                            <Button
                                                size="small"
                                                type="text"
                                                className="text-gray-600 hover:bg-gray-100"
                                                onClick={() => handleSelectAllCategory(category, false)}
                                            >
                                                Deselect All
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {permissions.map((permission) => (
                                            <Form.Item
                                                key={permission}
                                                name={permission}
                                                valuePropName="checked"
                                                className="mb-0"
                                            >
                                                <Checkbox>
                                                    {permissionLabels[permission]}
                                                </Checkbox>
                                            </Form.Item>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Can Manage Roles Section */}
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Can Manage Roles</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Select which roles this role can assign to users
                        </p>
                        <div className="border border-gray-200 rounded-lg p-4 max-h-60 overflow-y-auto custom-scrollbar">
                            {roles
                                .filter(r => r._id !== selectedRole?._id && r.name !== 'superadmin')
                                .map(role => (
                                    <Form.Item
                                        key={role._id}
                                        name={`managedRole_${role._id}`}
                                        valuePropName="checked"
                                        className="mb-2"
                                    >
                                        <Checkbox>
                                            <span className="font-medium">{role.displayName}</span>
                                            {role.description && (
                                                <span className="text-sm text-gray-500 ml-2">- {role.description}</span>
                                            )}
                                        </Checkbox>
                                    </Form.Item>
                                ))}
                            {roles.filter(r => r._id !== selectedRole?._id && r.name !== 'superadmin').length === 0 && (
                                <p className="text-gray-500 text-sm">No other roles available to manage</p>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-200 mt-4">
                        <Button
                            className="flex-1 h-11 rounded-xl cancel-btn"
                            onClick={() => {
                                setShowCreateModal(false);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            className="flex-1 bg-primary hover:bg-primary-600 h-11 rounded-xl font-semibold text-white"
                        >
                            Create Role
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}
