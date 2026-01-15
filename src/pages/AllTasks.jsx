import { useState, useEffect } from 'react';
import { CheckCircle2, Clock, ListTodo } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import TaskCard from '../components/common/TaskCard';
import Modal from '../components/common/Modal';
import api from '../utils/api';
import { showToast } from '../utils/helpers';
import { TASK_STATUS } from '../utils/taskHelpers';

export default function AllTasks() {
    const { user } = useAuth();
    const [allTasks, setAllTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewFilter, setViewFilter] = useState('assigned-to-me'); // assigned-to-me, i-assigned, self-tasks
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedTask, setSelectedTask] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => {
        fetchAllTasks();
    }, []);

    const fetchAllTasks = async () => {
        try {
            setLoading(true);
            // Fetch all three types of tasks
            const [assignedToMe, iAssigned, selfTasks] = await Promise.all([
                api.get('/tasks'),
                api.get('/tasks/assigned'),
                api.get('/tasks/self'),
            ]);

            setAllTasks({
                assignedToMe: assignedToMe.data.tasks || [],
                iAssigned: iAssigned.data.tasks || [],
                selfTasks: selfTasks.data.tasks || [],
            });
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
                fetchAllTasks();
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
                fetchAllTasks();
            }
        } catch (error) {
            showToast(error.response?.data?.error || 'Failed to complete task', 'error');
        }
    };

    const handleViewTask = (task) => {
        setSelectedTask(task);
        setShowDetailModal(true);
    };

    // Get current tasks based on view filter
    const getCurrentTasks = () => {
        switch (viewFilter) {
            case 'assigned-to-me':
                return allTasks.assignedToMe || [];
            case 'i-assigned':
                return allTasks.iAssigned || [];
            case 'self-tasks':
                return allTasks.selfTasks || [];
            default:
                return [];
        }
    };

    const currentTasks = getCurrentTasks();

    // Filter by status
    const filteredTasks = currentTasks.filter(task => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'pending') return task.status === TASK_STATUS.PENDING;
        if (statusFilter === 'in-progress') return task.status === TASK_STATUS.IN_PROGRESS;
        if (statusFilter === 'completed') return task.status === TASK_STATUS.COMPLETED;
        return true;
    });

    const stats = {
        assignedToMe: allTasks.assignedToMe?.length || 0,
        iAssigned: allTasks.iAssigned?.length || 0,
        selfTasks: allTasks.selfTasks?.length || 0,
        total: (allTasks.assignedToMe?.length || 0) + (allTasks.iAssigned?.length || 0) + (allTasks.selfTasks?.length || 0),
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">All Tasks</h1>
                <p className="text-gray-600">View and manage all your tasks</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-card shadow-card p-4">
                    <div className="text-sm text-gray-600 mb-1">Total Tasks</div>
                    <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                </div>
                <div className="bg-white rounded-card shadow-card p-4">
                    <div className="text-sm text-gray-600 mb-1">Assigned to Me</div>
                    <div className="text-2xl font-bold text-blue-600">{stats.assignedToMe}</div>
                </div>
                <div className="bg-white rounded-card shadow-card p-4">
                    <div className="text-sm text-gray-600 mb-1">I Assigned</div>
                    <div className="text-2xl font-bold text-purple-600">{stats.iAssigned}</div>
                </div>
                <div className="bg-white rounded-card shadow-card p-4">
                    <div className="text-sm text-gray-600 mb-1">Self Tasks</div>
                    <div className="text-2xl font-bold text-green-600">{stats.selfTasks}</div>
                </div>
            </div>

            {/* View Filter Tabs */}
            <div className="bg-white rounded-card shadow-card mb-6 p-4">
                <div className="flex gap-2 mb-4 border-b border-gray-200 pb-4">
                    <button
                        onClick={() => setViewFilter('assigned-to-me')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${viewFilter === 'assigned-to-me'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Assigned to Me
                    </button>
                    <button
                        onClick={() => setViewFilter('i-assigned')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${viewFilter === 'i-assigned'
                                ? 'bg-purple-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        I Assigned
                    </button>
                    <button
                        onClick={() => setViewFilter('self-tasks')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${viewFilter === 'self-tasks'
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Self Tasks
                    </button>
                </div>

                {/* Status Filter */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setStatusFilter('all')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${statusFilter === 'all'
                                ? 'bg-black text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setStatusFilter('pending')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${statusFilter === 'pending'
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Pending
                    </button>
                    <button
                        onClick={() => setStatusFilter('in-progress')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${statusFilter === 'in-progress'
                                ? 'bg-yellow-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        In Progress
                    </button>
                    <button
                        onClick={() => setStatusFilter('completed')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${statusFilter === 'completed'
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
                    <ListTodo className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks found</h3>
                    <p className="text-gray-600">
                        {statusFilter === 'all'
                            ? "No tasks in this category"
                            : `No ${statusFilter.replace('-', ' ')} tasks`}
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
                            showActions={viewFilter === 'assigned-to-me' || viewFilter === 'self-tasks'}
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

                        {selectedTask.status !== TASK_STATUS.COMPLETED && (viewFilter === 'assigned-to-me' || viewFilter === 'self-tasks') && (
                            <button
                                onClick={() => {
                                    handleCompleteTask(selectedTask._id);
                                    setShowDetailModal(false);
                                }}
                                className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 className="w-5 h-5" />
                                Mark as Completed
                            </button>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
}
