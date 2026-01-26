import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, FileCheck, ShieldAlert, Search, Clock, User, Calendar, AlertCircle } from 'lucide-react';
import { Input, Button, Skeleton } from 'antd';
import { useAuth } from '../hooks/useAuth';
import Modal from '../components/common/Modal';
import StatCard from '../components/common/StatCard';
import api from '../utils/api';
import { showToast } from '../utils/helpers';
import { formatDate } from '../utils/helpers';

function ApprovalsSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header skeleton */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
                <div className="w-full md:w-auto">
                    <Skeleton active title={{ width: 220 }} paragraph={{ rows: 1, width: 340 }} />
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

            {/* Search skeleton */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                <div className="w-full">
                    <Skeleton.Input active style={{ width: '100%', height: 48, borderRadius: 12 }} />
                </div>
            </div>

            {/* Task cards skeleton */}
            <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <Skeleton.Button active size="small" style={{ width: 80, height: 24 }} />
                                    <Skeleton.Button active size="small" style={{ width: 100, height: 24 }} />
                                </div>
                                <Skeleton active title={{ width: '80%' }} paragraph={{ rows: 2, width: ['90%', '70%'] }} />
                                <div className="mt-4 grid grid-cols-2 gap-4">
                                    <Skeleton active title={false} paragraph={{ rows: 1, width: '80%' }} />
                                    <Skeleton active title={false} paragraph={{ rows: 1, width: '80%' }} />
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <Skeleton.Button active style={{ width: 100, height: 40 }} />
                                <Skeleton.Button active style={{ width: 100, height: 40 }} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function Approvals() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [approvalAction, setApprovalAction] = useState(null);
    const [comments, setComments] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Check permissions
    const userRole = (user?.role?.name || user?.role || '').toLowerCase().replace(/\s+/g, '');
    const allowedRolesForApprovals = ['staff', 'projectmanager', 'standalone', 'standalonerole', 'projectmanagerandstandalone'];

    // Allow access if user has explicit permission OR is one of the allowed roles
    const canViewApprovals = user?.permissions?.viewApprovals || allowedRolesForApprovals.includes(userRole);
    const canApproveReject = user?.permissions?.approveRejectTasks || allowedRolesForApprovals.includes(userRole);

    useEffect(() => {
        if (canViewApprovals) {
            fetchPendingApprovals();
        } else {
            setLoading(false);
        }
    }, [canViewApprovals]);

    const fetchPendingApprovals = async () => {
        try {
            const response = await api.get('/approvals');
            setTasks(response.data.tasks || []);
        } catch (error) {
            console.error('Error fetching approvals:', error);
            showToast('Failed to load approvals', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleApprovalAction = (task, action) => {
        setSelectedTask(task);
        setApprovalAction(action);
        setShowApprovalModal(true);
    };

    const handleSubmitApproval = async () => {
        if (!selectedTask || !approvalAction) return;

        try {
            const endpoint = approvalAction === 'approve'
                ? `/approvals/${selectedTask._id}/approve`
                : `/approvals/${selectedTask._id}/reject`;

            // Send 'comments' for approve, 'reason' for reject
            const payload = approvalAction === 'approve'
                ? { comments }
                : { reason: comments };

            const response = await api.post(endpoint, payload);

            if (response.data.success) {
                showToast(`Task ${approvalAction}d successfully!`, 'success');
                setShowApprovalModal(false);
                setSelectedTask(null);
                setComments('');
                fetchPendingApprovals();
            }
        } catch (error) {
            showToast(error.response?.data?.error || `Failed to ${approvalAction} task`, 'error');
        }
    };

    // Filter tasks by search query
    const filteredTasks = tasks.filter(task => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            task.task?.toLowerCase().includes(query) ||
            task.assignedToName?.toLowerCase().includes(query) ||
            task.createdByEmail?.toLowerCase().includes(query) ||
            task.sno?.toString().includes(query)
        );
    });

    // Calculate stats
    const stats = {
        pending: tasks.length,
        highPriority: tasks.filter(t => t.priority === 'High').length,
        overdue: tasks.filter(t => {
            if (!t.dueDate) return false;
            const dueDate = new Date(t.dueDate);
            // If task is waiting for approval, it's effectively completed by the assignee, so compare createdAt/updatedAt
            const completedDate = new Date(t.updatedAt);
            return completedDate > dueDate;
        }).length,
    };

    // Access Denied UI
    if (!canViewApprovals) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600">You don't have permission to view approvals.</p>
                </div>
            </div>
        );
    }

    // Show skeleton loader
    if (loading) {
        return <ApprovalsSkeleton />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-[#253094]">Pending Approvals</h1>
                    <p className="text-gray-500 mt-1 font-medium">Review and approve completed tasks</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Pending Approvals"
                    value={stats.pending.toString()}
                    subtitle="Awaiting review"
                    icon={FileCheck}
                    iconBg="bg-orange-50"
                    iconColor="text-orange-600"
                />
                <StatCard
                    title="High Priority"
                    value={stats.highPriority.toString()}
                    subtitle="Urgent tasks"
                    icon={AlertCircle}
                    iconBg="bg-red-50"
                    iconColor="text-red-600"
                />
                <StatCard
                    title="Overdue"
                    value={stats.overdue.toString()}
                    subtitle="Completed late"
                    icon={Clock}
                    iconBg="bg-yellow-50"
                    iconColor="text-yellow-600"
                />
            </div>

            {/* Search Bar */}
            {tasks.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-[#253094] transition-colors" />
                        <input
                            type="text"
                            placeholder="Search tasks by title, assigned user, creator, or task number..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-12 pl-12 pr-4 bg-gray-50 border-none rounded-xl text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-[#253094]/10 transition-all outline-none"
                        />
                    </div>
                </div>
            )}

            {/* Task List */}
            {tasks.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileCheck className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No pending approvals</h3>
                    <p className="text-gray-600">All tasks have been reviewed</p>
                </div>
            ) : filteredTasks.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks found</h3>
                    <p className="text-gray-600">Try adjusting your search query</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredTasks.map(task => (
                        <div key={task._id} className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:border-primary-100 transition-all duration-300 relative overflow-hidden">
                            {/* Decorative Background */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-50 to-transparent opacity-0 group-hover:opacity-100 rounded-bl-full transition-all duration-500 -mr-8 -mt-8 pointer-events-none"></div>

                            <div className="relative z-10">
                                <div className="md:flex block items-start justify-between gap-4">
                                    <div className="flex-1">
                                        {/* Task Header */}
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#253094] text-white">
                                                #{task.sno}
                                            </span>
                                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#2D9E36] text-white shadow-sm">
                                                Completed
                                            </span>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${task.priority === 'High' ? 'bg-red-100 text-red-700' :
                                                task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-blue-100 text-blue-700'
                                                }`}>
                                                {task.priority} Priority
                                            </span>
                                        </div>

                                        {/* Task Title */}
                                        <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-[#253094] transition-colors">
                                            {task.task}
                                        </h3>

                                        {/* Task Details Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#253094]">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <span className="text-xs text-gray-500 font-medium">Assigned To</span>
                                                    <p className="font-semibold text-gray-900">{task.assignedToName}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <span className="text-xs text-gray-500 font-medium">Created By</span>
                                                    <p className="font-semibold text-gray-900">{task.createdByEmail}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-[#2D9E36]">
                                                    <Calendar className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <span className="text-xs text-gray-500 font-medium">Completed</span>
                                                    <p className="font-semibold text-gray-900">{formatDate(task.updatedAt)}</p>
                                                </div>
                                            </div>
                                            {task.dueDate && (
                                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                                    <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                                                        <Clock className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <span className="text-xs text-gray-500 font-medium">Due Date</span>
                                                        <p className="font-semibold text-gray-900">{formatDate(task.dueDate)}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Notes */}
                                        {task.notes && (
                                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-4">
                                                <p className="text-sm text-gray-700 font-medium">Notes:</p>
                                                <p className="text-sm text-gray-600 mt-1">{task.notes}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    {canApproveReject && (
                                        <div className="flex flex-col gap-2 shrink-0">
                                            <Button
                                                type="primary"
                                                onClick={() => handleApprovalAction(task, 'approve')}
                                                className="bg-[#2D9E36] create-user-btn hover:bg-[#2D9E36]/90 border-none flex items-center justify-center gap-2 h-11 px-6 rounded-xl font-semibold shadow-lg shadow-green-500/20 hover:shadow-green-500/30 transition-all hover:-translate-y-0.5"
                                                icon={<CheckCircle2 className="w-5 h-5" />}
                                            >
                                                {task.isForwarded && !task.forwarderApproved ? 'Verify & Sent Approval' : 'Approve'}
                                            </Button>
                                            <Button
                                                danger
                                                onClick={() => handleApprovalAction(task, 'reject')}
                                                className="flex items-center justify-center gap-2 h-11 px-6 rounded-xl font-semibold hover:bg-red-50 transition-all hover:-translate-y-0.5"
                                                icon={<XCircle className="w-5 h-5" />}
                                            >
                                                Reject
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Approval Modal */}
            {selectedTask && (
                <Modal
                    isOpen={showApprovalModal}
                    onClose={() => {
                        setShowApprovalModal(false);
                        setSelectedTask(null);
                        setComments('');
                    }}
                    title={`${approvalAction === 'approve' ? (selectedTask.isForwarded && !selectedTask.forwarderApproved ? 'Verify & Sent Approval' : 'Approve') : 'Reject'} Task #${selectedTask.sno}`}
                >
                    <div className="space-y-6">
                        {/* Task Info Summary */}
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <h4 className="font-semibold text-lg text-gray-900 mb-2">Task Details</h4>
                            <p className="text-sm text-gray-700">{selectedTask.task}</p>
                            <div className="mt-3 flex items-center gap-4 text-xs text-gray-600">
                                <span><strong>Assigned to:</strong> {selectedTask.assignedToName}</span>
                                <span><strong>Priority:</strong> {selectedTask.priority}</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {approvalAction === 'approve' ? 'Comments (Optional)' : 'Rejection Reason (Optional)'}
                            </label>
                            <Input.TextArea
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                rows={4}
                                placeholder={approvalAction === 'approve' ? 'Add any comments or feedback...' : 'Provide a reason for rejection...'}
                                size="large"
                                className="rounded-xl"
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button
                                size="large"
                                onClick={() => {
                                    setShowApprovalModal(false);
                                    setSelectedTask(null);
                                    setComments('');
                                }}
                                className="flex-1 h-11 rounded-xl cancel-btn"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="primary"
                                size="large"
                                onClick={handleSubmitApproval}
                                className={`flex-1 create-user-btn h-11 rounded-xl font-semibold ${approvalAction === 'approve'
                                    ? 'bg-[#2D9E36] hover:bg-[#2D9E36]/90 shadow-lg shadow-green-500/20'
                                    : 'bg-red-600 hover:bg-red-500 shadow-lg shadow-red-500/20'
                                    }`}
                                icon={approvalAction === 'approve' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                            >
                                {approvalAction === 'approve' ? (selectedTask.isForwarded && !selectedTask.forwarderApproved ? 'Verify & Sent Approval' : 'Approve Task') : 'Reject Task'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
