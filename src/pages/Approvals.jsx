import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, FileCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Modal from '../components/common/Modal';
import api from '../utils/api';
import { showToast } from '../utils/helpers';
import { formatDate } from '../utils/helpers';
import { ROLES } from '../utils/constants';

export default function Approvals() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [approvalAction, setApprovalAction] = useState(null);
    const [comments, setComments] = useState('');

    useEffect(() => {
        fetchPendingApprovals();
    }, []);

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

    const submitApproval = async () => {
        if (!selectedTask || !approvalAction) return;

        try {
            const endpoint = approvalAction === 'approve'
                ? `/approvals/${selectedTask._id}/approve`
                : `/approvals/${selectedTask._id}/reject`;

            const response = await api.post(endpoint, { comments });

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

    // No permission check needed - all users can view approvals for tasks they created


    return (
        <div className="p-6">
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

                                <div className="flex gap-2 ml-4">
                                    <button
                                        onClick={() => handleApprovalAction(task, 'approve')}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleApprovalAction(task, 'reject')}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        Reject
                                    </button>
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
                    title={`${approvalAction === 'approve' ? 'Approve' : 'Reject'} Task #${selectedTask.sno}`}
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Comments (Optional)
                            </label>
                            <textarea
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                rows="4"
                                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none resize-none"
                                placeholder="Add any comments..."
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowApprovalModal(false);
                                    setSelectedTask(null);
                                    setComments('');
                                }}
                                className="flex-1 px-4 py-2 border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitApproval}
                                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${approvalAction === 'approve'
                                    ? 'bg-success hover:bg-success-600'
                                    : 'bg-danger hover:bg-danger-600'
                                    }`}
                            >
                                {approvalAction === 'approve' ? 'Approve' : 'Reject'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
