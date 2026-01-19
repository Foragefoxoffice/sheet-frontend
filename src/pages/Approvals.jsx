import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, FileCheck, ShieldAlert } from 'lucide-react';
import { Input, Button } from 'antd';
import { useAuth } from '../hooks/useAuth';
import Modal from '../components/common/Modal';
import api from '../utils/api';
import { showToast } from '../utils/helpers';
import { formatDate } from '../utils/helpers';

export default function Approvals() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [approvalAction, setApprovalAction] = useState(null);
    const [comments, setComments] = useState('');

    // Check permissions
    const canViewApprovals = user?.permissions?.viewApprovals;
    const canApproveReject = user?.permissions?.approveRejectTasks;

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

    // Access Denied UI
    if (!canViewApprovals) {
        return (
            <div className="p-6">
                <div className="bg-white rounded-card shadow-card p-12 text-center">
                    <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
                    <p className="text-gray-600">
                        You don't have permission to view approvals. Please contact your administrator.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-0 md:p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Approvals</h1>
                <p className="text-gray-600">Review and approve completed tasks</p>
            </div>

            {/* Task List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading approvals...</p>
                    </div>
                </div>
            ) : tasks.length === 0 ? (
                <div className="bg-white rounded-card shadow-card p-12 text-center">
                    <FileCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No pending approvals</h3>
                    <p className="text-gray-600">All tasks have been reviewed</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {tasks.map(task => (
                        <div key={task._id} className="bg-white rounded-card shadow-card p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs font-semibold text-gray-500">#{task.sno}</span>
                                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-700 border border-success-200">
                                            Completed
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{task.task}</h3>

                                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                                        <div>
                                            <span className="font-medium">Assigned to:</span> {task.assignedToName}
                                        </div>
                                        <div>
                                            <span className="font-medium">Created by:</span> {task.createdByEmail}
                                        </div>
                                        <div>
                                            <span className="font-medium">Completed:</span> {formatDate(task.updatedAt)}
                                        </div>
                                        <div>
                                            <span className="font-medium">Priority:</span> {task.priority}
                                        </div>
                                    </div>

                                    {task.notes && (
                                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                            <p className="text-sm text-gray-700 italic">"{task.notes}"</p>
                                        </div>
                                    )}
                                </div>

                                {canApproveReject && (
                                    <div className="flex gap-2 ml-4">
                                        <Button
                                            type="primary"
                                            onClick={() => handleApprovalAction(task, 'approve')}
                                            className="bg-green-600 hover:bg-green-500 border-none flex items-center gap-2 h-auto py-2"
                                            icon={<CheckCircle2 className="w-4 h-4" />}
                                        >
                                            Approve
                                        </Button>
                                        <Button
                                            danger
                                            onClick={() => handleApprovalAction(task, 'reject')}
                                            className="flex items-center gap-2 h-auto py-2"
                                            icon={<XCircle className="w-4 h-4" />}
                                        >
                                            Reject
                                        </Button>
                                    </div>
                                )}
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
                    title={`${approvalAction === 'approve' ? 'Approve' : 'Reject'} Task #${selectedTask.sno}`}
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Comments (Optional)
                            </label>
                            <Input.TextArea
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                rows={4}
                                placeholder="Add any comments..."
                                size="large"
                            />
                        </div>

                        <div className="flex gap-3">
                            <Button
                                size="large"
                                onClick={() => {
                                    setShowApprovalModal(false);
                                    setSelectedTask(null);
                                    setComments('');
                                }}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="primary"
                                size="large"
                                onClick={handleSubmitApproval}
                                className={`flex-1 ${approvalAction === 'approve'
                                    ? 'bg-green-600 hover:bg-green-500'
                                    : 'bg-red-600 hover:bg-red-500'
                                    }`}
                            >
                                {approvalAction === 'approve' ? 'Approve' : 'Reject'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
