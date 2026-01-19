import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Shield, Search as SearchIcon, ShieldAlert } from 'lucide-react';
import { Input, Button, Modal as AntModal, Form, Checkbox, Card, Select } from 'antd';
import { useAuth } from '../hooks/useAuth';
import Modal from '../components/common/Modal';
import api from '../utils/api';
import { showToast } from '../utils/helpers';

export default function Roles() {
    const { user } = useAuth();
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
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
        'Department Management': ['viewDepartments', 'createDepartments', 'editDepartments', 'deleteDepartments'],
        'Task Management': ['viewAllTasks', 'viewDepartmentTasks', 'viewAssignedToMeTasks', 'viewIAssignedTasks', 'viewSelfTasks', 'createTasks', 'editOwnTasks', 'editAllTasks', 'deleteOwnTasks', 'deleteAllTasks'],
        'All Tasks Tab Filters': ['filterAllTasksDepartment', 'filterAllTasksPriority', 'filterAllTasksRole', 'filterAllTasksUser'],
        'Department Tasks Tab Filters': ['filterDeptTasksDepartment', 'filterDeptTasksPriority', 'filterDeptTasksRole', 'filterDeptTasksUser'],
        'Assigned to Me Tab Filters': ['filterAssignedToMeDepartment', 'filterAssignedToMePriority', 'filterAssignedToMeRole', 'filterAssignedToMeUser'],
        'I Assigned Tab Filters': ['filterIAssignedDepartment', 'filterIAssignedPriority', 'filterIAssignedRole', 'filterIAssignedUser'],
        'Self Tasks Tab Filters': ['filterSelfTasksDepartment', 'filterSelfTasksPriority', 'filterSelfTasksRole', 'filterSelfTasksUser'],
        'Approvals': ['viewApprovals', 'approveRejectTasks'],
        'Reports': ['viewReports', 'downloadReports'],
        'Role Management': ['viewRoles', 'createRoles', 'editRoles', 'deleteRoles'],
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
        editRoles: 'Edit Roles',
        deleteRoles: 'Delete Roles',
    };

    const handleCreateRole = () => {
        setSelectedRole(null);
        form.resetFields();
        setShowCreateModal(true);
    };

    const handleEditRole = (role) => {
        setSelectedRole(role);
        const formValues = {
            name: role.name,
            displayName: role.displayName,
            description: role.description,
            ...role.permissions
        };

        // Add managedRoles as checkbox values
        if (role.managedRoles && Array.isArray(role.managedRoles)) {
            role.managedRoles.forEach(managedRoleId => {
                formValues[`managedRole_${managedRoleId}`] = true;
            });
        }

        form.setFieldsValue(formValues);
        setShowEditModal(true);
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

            if (showEditModal && selectedRole) {
                await api.put(`/roles/${selectedRole._id}`, roleData);
                showToast('Role updated successfully', 'success');
            } else {
                await api.post('/roles', roleData);
                showToast('Role created successfully', 'success');
            }

            setShowCreateModal(false);
            setShowEditModal(false);
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading roles...</p>
                </div>
            </div>
        );
    }

    // Access Denied UI
    if (!canViewRoles) {
        return (
            <div className="p-6">
                <div className="bg-white rounded-card shadow-card p-12 text-center">
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
        <div className="p-2 md:p-6">
            {/* Header */}
            <div className="block md:flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
                    <p className="text-gray-600 mt-1">Create and manage user roles with custom permissions</p>
                </div>
                {user?.permissions?.createRoles && (
                    <Button
                        type="primary"
                        onClick={handleCreateRole}
                        className="bg-primary hover:bg-primary-600 flex items-center gap-2 h-auto py-2.5 px-6"
                        icon={<Plus className="w-5 h-5" />}
                    >
                        Create Role
                    </Button>
                )}
            </div>

            {/* Search */}
            <div className="bg-white rounded-card shadow-card p-4 mb-6">
                <Input
                    prefix={<SearchIcon className="w-5 h-5 text-gray-400" />}
                    placeholder="Search roles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    size="large"
                />
            </div>

            {/* Roles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRoles.map((role) => (
                    <div key={role._id} className="bg-white rounded-card shadow-card p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${role.isStatic
                                    ? 'bg-linear-to-br from-purple-500 to-pink-500'
                                    : role.isSystem
                                        ? 'bg-blue-100'
                                        : 'bg-purple-100'
                                    }`}>
                                    <Shield className={`w-6 h-6 ${role.isStatic
                                        ? 'text-white'
                                        : role.isSystem
                                            ? 'text-blue-600'
                                            : 'text-purple-600'
                                        }`} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{role.displayName}</h3>
                                    {role.isStatic && (
                                        <span className="text-xs text-purple-600 font-medium">Static Role - Protected</span>
                                    )}
                                    {role.isSystem && !role.isStatic && (
                                        <span className="text-xs text-blue-600 font-medium">System Role</span>
                                    )}
                                </div>
                            </div>
                            {!role.isStatic && user?.permissions?.editRoles && (
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => handleEditRole(role)}
                                        className="flex items-center justify-center"
                                        icon={<Edit2 className="w-4 h-4" />}
                                    />
                                    {user?.permissions?.deleteRoles && (
                                        <Button
                                            danger
                                            onClick={() => handleDeleteRole(role._id, role.displayName)}
                                            icon={<Trash2 className="w-4 h-4" />}
                                        />
                                    )}
                                </div>
                            )}
                        </div>

                        <p className="text-sm text-gray-600 mb-4">
                            {role.description || 'No description'}
                        </p>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                            <span className="text-sm text-gray-600">Permissions</span>
                            <span className="text-sm font-medium text-primary">
                                {countPermissions(role.permissions)} enabled
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {filteredRoles.length === 0 && (
                <div className="bg-white rounded-card shadow-card p-12 text-center">
                    <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No roles found</h3>
                    <p className="text-gray-600">
                        {searchTerm ? 'Try a different search term' : 'Create your first role to get started'}
                    </p>
                </div>
            )}

            {/* Create/Edit Modal */}
            <Modal
                isOpen={showCreateModal || showEditModal}
                onClose={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                }}
                title={showEditModal ? 'Edit Role' : 'Create New Role'}
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
                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
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
                        <div className="border border-gray-200 rounded-lg p-4 max-h-60 overflow-y-auto">
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
                            className="flex-1"
                            onClick={() => {
                                setShowCreateModal(false);
                                setShowEditModal(false);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            className="flex-1 bg-primary text-white hover:bg-primary-600"
                        >
                            {showEditModal ? 'Update Role' : 'Create Role'}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}
