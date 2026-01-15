import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Shield, Search } from 'lucide-react';
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
    const [formData, setFormData] = useState({
        name: '',
        displayName: '',
        description: '',
        permissions: {},
    });

    useEffect(() => {
        fetchRoles();
    }, []);

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
        'Task Management': ['viewAllTasks', 'createTasks', 'editOwnTasks', 'editAllTasks', 'deleteOwnTasks', 'deleteAllTasks'],
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
        createTasks: 'Create Tasks',
        editOwnTasks: 'Edit Own Tasks',
        editAllTasks: 'Edit All Tasks',
        deleteOwnTasks: 'Delete Own Tasks',
        deleteAllTasks: 'Delete All Tasks',
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
        setFormData({
            name: '',
            displayName: '',
            description: '',
            permissions: {},
        });
        setShowCreateModal(true);
    };

    const handleEditRole = (role) => {
        setSelectedRole(role);
        setFormData({
            name: role.name,
            displayName: role.displayName,
            description: role.description || '',
            permissions: role.permissions || {},
        });
        setShowEditModal(true);
    };

    const handleDeleteRole = async (roleId, roleName) => {
        if (!window.confirm(`Are you sure you want to delete the role "${roleName}"?`)) return;

        try {
            await api.delete(`/roles/${roleId}`);
            showToast('Role deleted successfully', 'success');
            fetchRoles();
        } catch (error) {
            showToast(error.response?.data?.error || 'Failed to delete role', 'error');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (showEditModal) {
                await api.put(`/roles/${selectedRole._id}`, formData);
                showToast('Role updated successfully', 'success');
            } else {
                await api.post('/roles', formData);
                showToast('Role created successfully', 'success');
            }

            setShowCreateModal(false);
            setShowEditModal(false);
            fetchRoles();
        } catch (error) {
            showToast(error.response?.data?.error || 'Failed to save role', 'error');
        }
    };

    const handlePermissionChange = (permission, value) => {
        setFormData(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [permission]: value,
            },
        }));
    };

    const handleSelectAllCategory = (category, value) => {
        const categoryPermissions = permissionCategories[category];
        const newPermissions = { ...formData.permissions };

        categoryPermissions.forEach(perm => {
            newPermissions[perm] = value;
        });

        setFormData(prev => ({
            ...prev,
            permissions: newPermissions,
        }));
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

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
                    <p className="text-gray-600 mt-1">Create and manage user roles with custom permissions</p>
                </div>
                {user?.permissions?.createRoles && (
                    <button
                        onClick={handleCreateRole}
                        className="px-4 py-2 bg-primary text-black rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Create Role
                    </button>
                )}
            </div>

            {/* Search */}
            <div className="bg-white rounded-card shadow-card p-4 mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search roles..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none"
                    />
                </div>
            </div>

            {/* Roles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRoles.map((role) => (
                    <div key={role._id} className="bg-white rounded-card shadow-card p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${role.isSystem ? 'bg-blue-100' : 'bg-purple-100'
                                    }`}>
                                    <Shield className={`w-6 h-6 ${role.isSystem ? 'text-blue-600' : 'text-purple-600'
                                        }`} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{role.displayName}</h3>
                                    {role.isSystem && (
                                        <span className="text-xs text-blue-600 font-medium">System Role</span>
                                    )}
                                </div>
                            </div>
                            {!role.isSystem && user?.permissions?.editRoles && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEditRole(role)}
                                        className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    {user?.permissions?.deleteRoles && (
                                        <button
                                            onClick={() => handleDeleteRole(role._id, role.displayName)}
                                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
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
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Role Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none"
                                placeholder="e.g., teamlead"
                                required
                                disabled={showEditModal}
                            />
                            <p className="text-xs text-gray-500 mt-1">Lowercase, no spaces</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Display Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.displayName}
                                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none"
                                placeholder="e.g., Team Lead"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none"
                            rows="2"
                            placeholder="Brief description of this role"
                        />
                    </div>

                    {/* Permissions */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Permissions</h3>
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                            {Object.entries(permissionCategories).map(([category, permissions]) => (
                                <div key={category} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-medium text-gray-900">{category}</h4>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleSelectAllCategory(category, true)}
                                                className="text-xs px-2 py-1 text-primary hover:bg-primary-50 rounded"
                                            >
                                                Select All
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleSelectAllCategory(category, false)}
                                                className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 rounded"
                                            >
                                                Deselect All
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {permissions.map((permission) => (
                                            <label key={permission} className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.permissions[permission] || false}
                                                    onChange={(e) => handlePermissionChange(permission, e.target.checked)}
                                                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                                                />
                                                <span className="text-sm text-gray-700">{permissionLabels[permission]}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={() => {
                                setShowCreateModal(false);
                                setShowEditModal(false);
                            }}
                            className="flex-1 px-4 py-2 border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-primary text-black rounded-lg hover:bg-primary-600 transition-colors"
                        >
                            {showEditModal ? 'Update Role' : 'Create Role'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
