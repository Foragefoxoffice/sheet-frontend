import { useState, useEffect } from 'react';
import { CheckCircle2, Clock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import TaskCard from '../components/common/TaskCard';
import Modal from '../components/common/Modal';
import api from '../utils/api';
import { showToast } from '../utils/helpers';
import { TASK_STATUS } from '../utils/taskHelpers';

export default function MyTasks() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [selectedTask, setSelectedTask] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const response = await api.get('/tasks');
            setTasks(response.data.tasks || []);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            showToast('Failed to load tasks', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            const response = await api.patch(`/tasks/${taskId}/status`, { status: newStatus });

            if (response.data.success) {
                showToast(`Task status updated to ${newStatus}`, 'success');
                fetchTasks();
            }
        } catch (error) {
            showToast(error.response?.data?.error || 'Failed to update task status', 'error');
        }
    };

    const handleCompleteTask = async (taskId) => {
        if (!window.confirm('Mark this task as completed?')) return;

        try {
            const response = await api.patch(`/tasks/${taskId}/status`, { status: TASK_STATUS.COMPLETED });

            if (response.data.success) {
                showToast('Task marked as completed!', 'success');
                fetchTasks();
            }
        } catch (error) {
            showToast(error.response?.data?.error || 'Failed to complete task', 'error');
        }
    };

    const handleViewTask = (task) => {
        setSelectedTask(task);
        setShowDetailModal(true);
    };

    const filteredTasks = tasks.filter(task => {
        if (filter === 'all') return true;
        if (filter === 'pending') return task.status === TASK_STATUS.PENDING;
        if (filter === 'in-progress') return task.status === TASK_STATUS.IN_PROGRESS;
        if (filter === 'completed') return task.status === TASK_STATUS.COMPLETED;
        return true;
    });

    const stats = {
        total: tasks.length,
        pending: tasks.filter(t => t.status === TASK_STATUS.PENDING).length,
        inProgress: tasks.filter(t => t.status === TASK_STATUS.IN_PROGRESS).length,
        completed: tasks.filter(t => t.status === TASK_STATUS.COMPLETED).length,
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">My Works</h1>
                <p className="text-gray-600">Tasks assigned to you</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-card shadow-card p-4">
                    <div className="text-sm text-gray-600 mb-1">Total Tasks</div>
                    <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                </div>
                <div className="bg-white rounded-card shadow-card p-4">
                    <div className="text-sm text-gray-600 mb-1">Pending</div>
                    <div className="text-2xl font-bold text-warning">{stats.pending}</div>
                </div>
                <div className="bg-white rounded-card shadow-card p-4">
                    <div className="text-sm text-gray-600 mb-1">In Progress</div>
                    <div className="text-2xl font-bold text-info">{stats.inProgress}</div>
                </div>
                <div className="bg-white rounded-card shadow-card p-4">
                    <div className="text-sm text-gray-600 mb-1">Completed</div>
                    <div className="text-2xl font-bold text-success">{stats.completed}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-card shadow-card mb-6 p-4">
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'all'
                            ? 'bg-black text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('pending')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'pending'
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Pending
                    </button>
                    <button
                        onClick={() => setFilter('in-progress')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'in-progress'
                            ? 'bg-yellow-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        In Progress
                    </button>
                    <button
                        onClick={() => setFilter('completed')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'completed'
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Completed
                    </button>
                </div>
            </div>

            {/* Task List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading tasks...</p>
                    </div>
                </div>
            ) : filteredTasks.length === 0 ? (
                <div className="bg-white rounded-card shadow-card p-12 text-center">
                    <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks found</h3>
                    <p className="text-gray-600">
                        {filter === 'all'
                            ? "You don't have any tasks assigned yet"
                            : `No ${filter.replace('-', ' ')} tasks`}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTasks.map(task => (
                        <TaskCard
                            key={task._id}
                            task={task}
                            onStatusChange={handleStatusChange}
                            onView={handleViewTask}
                        />
                    ))}
                </div>
            )}

            {/* Task Detail Modal */}
            {selectedTask && (
                <Modal
                    isOpen={showDetailModal}
                    onClose={() => {
                        setShowDetailModal(false);
                        setSelectedTask(null);
                    }}
                    title={`Task #${selectedTask.sno}`}
                >
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700">Description</label>
                            <p className="mt-1 text-gray-900">{selectedTask.task}</p>
                        </div>

                        {selectedTask.notes && (
                            <div>
                                <label className="text-sm font-medium text-gray-700">Notes</label>
                                <p className="mt-1 text-gray-600 italic">{selectedTask.notes}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Status</label>
                                <p className="mt-1 text-gray-900">{selectedTask.status}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Priority</label>
                                <p className="mt-1 text-gray-900">{selectedTask.priority}</p>
                            </div>
                        </div>

                        {selectedTask.status !== TASK_STATUS.COMPLETED && (
                            <button
                                onClick={() => {
                                    handleCompleteTask(selectedTask._id);
                                    setShowDetailModal(false);
                                }}
                                className="w-full px-4 py-2 bg-success text-white rounded-lg hover:bg-success-600 transition-colors flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 className="w-5 h-5" />
                                {selectedTask.approvalStatus === 'Rejected' ? 'Resubmit for Approval' : 'Mark as Completed'}
                            </button>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
}
