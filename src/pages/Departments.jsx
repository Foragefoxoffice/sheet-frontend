import { useState, useEffect } from 'react';
import { Building2, UserPlus, Users, Edit, Trash2, Search as SearchIcon } from 'lucide-react';
import { Input, Button, Modal as AntModal } from 'antd';
import { useAuth } from '../hooks/useAuth';
import Modal from '../components/common/Modal'; // Keeping the custom Modal for forms as pattern
import CreateDepartmentForm from '../components/features/departments/CreateDepartmentForm';
import api from '../utils/api';
import { showToast } from '../utils/helpers';

export default function Departments() {
    const { user } = useAuth();
    const [departments, setDepartments] = useState([]);
    const [managers, setManagers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        fetchDepartments();
        fetchManagers();
    }, []);

    const fetchDepartments = async () => {
        try {
            const response = await api.get('/departments');
            setDepartments(response.data.departments || []);
        } catch (error) {
            console.error('Error fetching departments:', error);
            showToast('Failed to load departments', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchManagers = async () => {
        try {
            // Mock data for now - replace with actual API call to get managers
            const mockManagers = [
                { id: '3', name: 'Manager User', email: 'manager@company.com' },
            ];
            setManagers(mockManagers);
        } catch (error) {
            console.error('Error fetching managers:', error);
        }
    };

    const handleCreateSuccess = (newDepartment) => {
        setDepartments(prev => [newDepartment, ...prev]);
        setShowCreateModal(false);
        fetchDepartments(); // Refresh the list
    };

    const handleDelete = (id) => {
        AntModal.confirm({
            title: 'Delete Department',
            content: 'Are you sure you want to delete this department? This action cannot be undone.',
            okText: 'Yes, Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    await api.delete(`/departments/${id}`);
                    setDepartments(prev => prev.filter(dept => dept._id !== id));
                    showToast('Department deleted successfully', 'success');
                    fetchDepartments(); // Refresh the list
                } catch (error) {
                    showToast(error.response?.data?.error || 'Failed to delete department', 'error');
                }
            }
        });
    };

    const filteredDepartments = departments.filter(dept =>
        dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dept.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Check if user has permission - managers should NOT have access
    const userRoleName = user?.role?.name || user?.role;
    const isManager = userRoleName === 'manager';

    if (!user?.permissions?.viewDepartments || isManager) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="text-6xl mb-4">🔒</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600">You don't have permission to manage departments.</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
                    <p className="text-gray-500 mt-1">Organize your team into departments</p>
                </div>
                <Button
                    type="primary"
                    onClick={() => setShowCreateModal(true)}
                    className="bg-primary hover:bg-primary-600 flex items-center gap-2 h-auto py-2.5 px-6"
                    icon={<Building2 className="w-5 h-5" />}
                >
                    Add Department
                </Button>
            </div>

            {/* Search */}
            <div className="bg-white rounded-card shadow-card mb-6 p-4">
                <Input
                    prefix={<SearchIcon className="w-5 h-5 text-gray-400" />}
                    placeholder="Search departments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    size="large"
                />
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading departments...</p>
                    </div>
                </div>
            ) : filteredDepartments.length === 0 ? (
                <div className="bg-white rounded-card shadow-card p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Building2 className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {searchQuery ? 'No departments found' : 'No departments yet'}
                    </h3>
                    <p className="text-gray-600 mb-6">
                        {searchQuery ? 'Try adjusting your search' : 'Get started by creating your first department'}
                    </p>
                    {!searchQuery && (
                        <Button
                            type="primary"
                            onClick={() => setShowCreateModal(true)}
                            className="bg-primary hover:bg-primary-600 h-auto py-2.5 px-6"
                            icon={<Building2 className="w-5 h-5" />}
                        >
                            Create First Department
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDepartments.map((dept) => (
                        <div key={dept._id} className="bg-white rounded-card shadow-card p-6 hover:shadow-card-hover transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center">
                                    <Building2 className="w-6 h-6 text-primary" />
                                </div>
                                {dept.isActive && (
                                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-success-100 text-success-700">
                                        Active
                                    </span>
                                )}
                            </div>

                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{dept.name}</h3>

                            {dept.description && (
                                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{dept.description}</p>
                            )}

                            <div className="space-y-2 mb-4">
                                {dept.manager && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <UserPlus className="w-4 h-4" />
                                        <span>Manager: {dept.manager.name}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Users className="w-4 h-4" />
                                    <span>{dept.memberCount || 0} members</span>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4 border-t border-gray-100">
                                <Button
                                    className="flex-1 flex items-center justify-center gap-2"
                                    icon={<Edit className="w-4 h-4" />}
                                >
                                    Edit
                                </Button>
                                {user?.permissions?.deleteDepartments && (
                                    <Button
                                        danger
                                        onClick={() => handleDelete(dept._id)}
                                        icon={<Trash2 className="w-4 h-4" />}
                                    />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Department Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Create New Department"
            >
                <CreateDepartmentForm
                    onSuccess={handleCreateSuccess}
                    onCancel={() => setShowCreateModal(false)}
                    managers={managers}
                />
            </Modal>
        </div>
    );
}
