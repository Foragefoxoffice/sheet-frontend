import { useState, useEffect } from 'react';
import { Building2, UserPlus, Users, Edit, Trash2, Search as SearchIcon, LayoutGrid, CheckCircle2 } from 'lucide-react';
import { Input, Button, Modal as AntModal, Skeleton } from 'antd';
import { useAuth } from '../hooks/useAuth';
import Modal from '../components/common/Modal';
import CreateDepartmentForm from '../components/features/departments/CreateDepartmentForm';
import EditDepartmentForm from '../components/features/departments/EditDepartmentForm';
import DeleteConfirmationModal from '../components/common/DeleteConfirmationModal';
import StatCard from '../components/common/StatCard';
import api from '../utils/api';
import { showToast } from '../utils/helpers';

function DepartmentsSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="w-full md:w-auto">
                    <Skeleton active title={{ width: 200 }} paragraph={{ rows: 1, width: 300 }} />
                </div>
                <div className="hidden md:block">
                    <Skeleton.Button active size="large" style={{ width: 180, borderRadius: '0.75rem' }} />
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

            {/* Departments Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-start justify-between mb-6">
                            <Skeleton.Avatar active size={56} shape="square" className="rounded-2xl" />
                            <Skeleton.Button active size="small" shape="round" style={{ width: 70 }} />
                        </div>

                        <div className="mb-6">
                            <Skeleton active title={{ width: '70%', marginBottom: 12 }} paragraph={{ rows: 2 }} />
                        </div>

                        <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex items-center gap-3">
                                <Skeleton.Avatar active size={32} shape="circle" />
                                <div className="flex-1">
                                    <Skeleton active title={false} paragraph={{ rows: 1, width: '60%' }} />
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Skeleton.Avatar active size={32} shape="circle" />
                                <div className="flex-1">
                                    <Skeleton active title={false} paragraph={{ rows: 1, width: '40%' }} />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Skeleton.Button active block style={{ flex: 1, borderRadius: '0.75rem' }} />
                            <Skeleton.Button active style={{ width: 40, borderRadius: '0.75rem' }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function Departments() {
    const { user } = useAuth();
    const [departments, setDepartments] = useState([]);
    const [managers, setManagers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deptToDelete, setDeptToDelete] = useState(null);
    const [deptToEdit, setDeptToEdit] = useState(null);

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

    const handleEdit = (dept) => {
        setDeptToEdit(dept);
        setShowEditModal(true);
    };

    const handleEditSuccess = (updatedDept) => {
        setDepartments(prev => prev.map(d => d._id === updatedDept._id ? updatedDept : d));
        setShowEditModal(false);
        setDeptToEdit(null);
        fetchDepartments();
    };

    const handleDelete = (id) => {
        const dept = departments.find(d => d._id === id);
        setDeptToDelete(dept);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!deptToDelete) return;

        try {
            await api.delete(`/departments/${deptToDelete._id}`);
            setDepartments(prev => prev.filter(dept => dept._id !== deptToDelete._id));
            showToast('Department deleted successfully', 'success');
            fetchDepartments(); // Refresh the list
            setShowDeleteModal(false);
            setDeptToDelete(null);
        } catch (error) {
            showToast(error.response?.data?.error || 'Failed to delete department', 'error');
        }
    };

    const filteredDepartments = departments.filter(dept =>
        dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dept.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Calculate Stats
    const totalDepartments = departments.length;
    const totalMembers = departments.reduce((acc, dept) => acc + (dept.memberCount || 0), 0);
    const activeDepartments = departments.filter(d => d.isActive).length;

    // Get user role name
    const userRoleName = user?.role?.name || user?.role;

    // Check if user has permission to view departments
    if (!user?.permissions?.viewDepartments) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="text-6xl mb-4">🔒</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600">You don't have permission to view departments.</p>
                </div>
            </div>
        );
    }

    // Check role-based permissions combined with user permissions
    const canCreateDepartment = user?.permissions?.createDepartments &&
        ['superadmin', 'director', 'generalmanager'].includes(userRoleName);

    const canEditDepartment = user?.permissions?.editDepartments &&
        ['superadmin', 'director', 'generalmanager', 'manager'].includes(userRoleName);

    const canDeleteDepartment = user?.permissions?.deleteDepartments &&
        ['superadmin', 'director'].includes(userRoleName);

    if (loading) {
        return <DepartmentsSkeleton />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-[#253094]">Departments</h1>
                    <p className="text-gray-500 mt-1 font-medium">Organize and manage your team structures</p>
                </div>
                {canCreateDepartment && (
                    <Button
                        type="primary"
                        onClick={() => setShowCreateModal(true)}
                        className="bg-primary hover:bg-primary-600 flex items-center justify-center gap-2 h-11 px-6 w-full md:w-auto rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
                        icon={<Building2 className="w-5 h-5" />}
                    >
                        Add Department
                    </Button>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total Departments"
                    value={totalDepartments.toString()}
                    subtitle="All active units"
                    icon={LayoutGrid}
                    iconBg="bg-blue-50"
                    iconColor="text-[#253094]"
                />
                <StatCard
                    title="Total Members"
                    value={totalMembers.toString()}
                    subtitle="Assigned to departments"
                    icon={Users}
                    iconBg="bg-green-50"
                    iconColor="text-[#2D9E36]"
                />
                <StatCard
                    title="Active Units"
                    value={activeDepartments.toString()}
                    subtitle="Currently operational"
                    icon={CheckCircle2}
                    iconBg="bg-purple-50"
                    iconColor="text-purple-600"
                />
            </div>

            {/* Search Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="relative group">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-[#253094] transition-colors" />
                    <input
                        type="text"
                        placeholder="Search departments by name or description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 bg-gray-50 border-none rounded-xl text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-[#253094]/10 transition-all outline-none"
                    />
                </div>
            </div>

            {/* Content */}
            {filteredDepartments.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Building2 className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {searchQuery ? 'No departments found' : 'No departments yet'}
                    </h3>
                    <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                        {searchQuery ? 'Try adjusting your search terms to find what you are looking for.' : 'Get started by creating your first department to organize your team.'}
                    </p>
                    {!searchQuery && canCreateDepartment && (
                        <Button
                            type="primary"
                            onClick={() => setShowCreateModal(true)}
                            className="bg-primary hover:bg-primary-600 h-11 px-8 rounded-xl font-semibold"
                            icon={<Building2 className="w-5 h-5" />}
                        >
                            Create First Department
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDepartments.map((dept) => (
                        <div key={dept._id} className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-primary-100 transition-all duration-300 relative overflow-hidden">
                            {/* Decorative Background */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-50 to-transparent opacity-0 group-hover:opacity-100 rounded-bl-full transition-all duration-500 -mr-8 -mt-8 pointer-events-none"></div>

                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-14 h-14 bg-[#253094] rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/20 transform transition-transform duration-300">
                                        <Building2 className="w-7 h-7 text-white" />
                                    </div>
                                    {dept.isActive && (
                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E8F8EE] text-[#2D9E36] border border-green-100">
                                            Active
                                        </span>
                                    )}
                                </div>

                                <div className="mb-3">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[#253094] transition-colors">{dept.name}</h3>
                                    {dept.description && (
                                        <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{dept.description}</p>
                                    )}
                                </div>

                                <div className="space-y-4 mb-6 bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    {dept.manager && (
                                        <div className="flex items-center gap-3 text-sm text-gray-700">
                                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#253094] shadow-sm">
                                                <UserPlus className="w-4 h-4" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Manager</span>
                                                <span className="font-semibold">{dept.manager.name}</span>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3 text-sm text-gray-700">
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#2D9E36] shadow-sm">
                                            <Users className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Members</span>
                                            <span className="font-semibold">{dept.memberCount || 0} People</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    {canEditDepartment && (
                                        <Button
                                            onClick={() => handleEdit(dept)}
                                            className="flex-1 h-10 flex items-center justify-center gap-2 border-primary text-primary hover:bg-primary-50 rounded-xl font-semibold"
                                            icon={<Edit className="w-4 h-4" />}
                                        >
                                            Edit
                                        </Button>
                                    )}
                                    {canDeleteDepartment && (
                                        <Button
                                            danger
                                            onClick={() => handleDelete(dept._id)}
                                            className="h-10 px-4 rounded-xl hover:bg-red-50"
                                            icon={<Trash2 className="w-4 h-4" />}
                                        />
                                    )}
                                </div>
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

            {/* Edit Department Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setDeptToEdit(null);
                }}
                title="Edit Department"
            >
                <EditDepartmentForm
                    department={deptToEdit}
                    onSuccess={handleEditSuccess}
                    onCancel={() => {
                        setShowEditModal(false);
                        setDeptToEdit(null);
                    }}
                />
            </Modal>

            <DeleteConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setDeptToDelete(null);
                }}
                onConfirm={confirmDelete}
                title="Delete Department"
                message="Are you sure you want to delete this department? This action cannot be undone."
                itemName={deptToDelete?.name}
            />
        </div>
    );
}
