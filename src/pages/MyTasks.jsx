import { useState, useEffect } from 'react';
import { CheckCircle2, Clock, Search as SearchIcon, Filter, X } from 'lucide-react';
import { Select, Input, Button, Modal as AntModal } from 'antd';
import { useAuth } from '../hooks/useAuth';
import TaskCard from '../components/common/TaskCard';
import Modal from '../components/common/Modal'; // Keeping custom modal for consistency in layout, or switch? Sticking to custom for now as per plan, but replacing inner content.
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
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const [departmentFilter, setDepartmentFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [roleFilter, setRoleFilter] = useState('all');
    const [userFilter, setUserFilter] = useState('all');
    const [departments, setDepartments] = useState([]);
    const [users, setUsers] = useState([]);
    const [newComment, setNewComment] = useState('');

    useEffect(() => {
        fetchTasks();
        fetchDepartments();
        fetchUsers();
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

    const fetchDepartments = async () => {
        try {
            const response = await api.get('/departments');
            setDepartments(response.data.departments || []);
        } catch (error) {
            console.error('Error fetching departments:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users/for-tasks');
            setUsers(response.data.users || []);
        } catch (error) {
            console.error('Error fetching users:', error);
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
        // Use standard window.confirm or Ant Design Modal.confirm? Stick to window.confirm for speed or Ant Design Modal.
        AntModal.confirm({
            title: 'Mark as Completed?',
            content: 'Are you sure you want to mark this task as completed?',
            onOk: async () => {
                try {
                    const response = await api.patch(`/tasks/${taskId}/status`, { status: TASK_STATUS.COMPLETED });
                    if (response.data.success) {
                        showToast('Task marked as completed!', 'success');
                        fetchTasks();
                        setShowDetailModal(false);
                    }
                } catch (error) {
                    showToast(error.response?.data?.error || 'Failed to complete task', 'error');
                }
            }
        });
    };

    const handleViewTask = (task) => {
        setSelectedTask(task);
        setNewComment('');
        setShowDetailModal(true);
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;

        try {
            const response = await api.post(`/tasks/${selectedTask._id}/comments`, {
                text: newComment
            });

            if (response.data.success) {
                // Update selected task with new comments
                setSelectedTask(response.data.task);
                setNewComment('');
                showToast('Comment added', 'success');
            }
        } catch (error) {
            console.error('Error adding comment:', error);
            showToast('Failed to add comment', 'error');
        }
    };

    // Filter by status
    const filteredTasks = tasks.filter(task => {
        if (filter === 'all') return true;
        if (filter === 'pending') return task.status === TASK_STATUS.PENDING;
        if (filter === 'in-progress') return task.status === TASK_STATUS.IN_PROGRESS;
        if (filter === 'completed') return task.status === TASK_STATUS.COMPLETED;
        return true;
    });

    // Filter by search query
    const searchedTasks = filteredTasks.filter(task => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            task.task?.toLowerCase().includes(query) ||
            task.assignedToName?.toLowerCase().includes(query) ||
            task.createdByEmail?.toLowerCase().includes(query)
        );
    });

    // Filter by department
    const departmentFilteredTasks = searchedTasks.filter(task => {
        if (departmentFilter === 'all') return true;
        const createdByUser = users.find(u => u.email === task.createdByEmail);
        return createdByUser?.department?._id === departmentFilter || createdByUser?.department === departmentFilter;
    });

    // Filter by priority
    const priorityFilteredTasks = departmentFilteredTasks.filter(task => {
        if (priorityFilter === 'all') return true;
        return task.priority === priorityFilter;
    });

    // Filter by role
    const roleFilteredTasks = priorityFilteredTasks.filter(task => {
        if (roleFilter === 'all') return true;
        const createdByUser = users.find(u => u.email === task.createdByEmail);
        const userRoleName = createdByUser?.role?.name || createdByUser?.role;
        return userRoleName === roleFilter;
    });

    // Filter by user
    const userFilteredTasks = roleFilteredTasks.filter(task => {
        if (userFilter === 'all') return true;
        return task.createdByEmail === userFilter;
    });

    // Sort tasks
    const sortedTasks = [...userFilteredTasks].sort((a, b) => {
        switch (sortBy) {
            case 'date':
                return new Date(b.createdAt) - new Date(a.createdAt);
            case 'priority': {
                const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
                return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
            }
            case 'status': {
                const statusOrder = { 'Pending': 1, 'In Progress': 2, 'Completed': 3 };
                return (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
            }
            default:
                return 0;
        }
    });

    const stats = {
        total: tasks.length,
        pending: tasks.filter(t => t.status === TASK_STATUS.PENDING).length,
        inProgress: tasks.filter(t => t.status === TASK_STATUS.IN_PROGRESS).length,
        completed: tasks.filter(t => t.status === TASK_STATUS.COMPLETED).length,
    };

    return (
        <div className="max-w-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">My Works</h1>
                    <p className="text-gray-600">Tasks assigned to you</p>
                </div>
            </div>

            {/* Floating Search Bar */}
            {showSearch && (
                <div className="mb-6 animate-slideDown">
                    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
                        <div className="flex items-center gap-3">
                            <Input
                                prefix={<SearchIcon className="w-4 h-4 text-gray-400" />}
                                placeholder="Search tasks by description or creator..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                allowClear
                                size="large"
                                autoFocus
                            />
                            <Button
                                icon={<X className="w-4 h-4" />}
                                onClick={() => {
                                    setShowSearch(false);
                                    setSearchQuery('');
                                }}
                            />
                        </div>
                        {searchQuery && (
                            <div className="mt-2 text-sm text-gray-600">
                                Found {sortedTasks.length} task{sortedTasks.length !== 1 ? 's' : ''}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="bg-white rounded-card shadow-card p-3 md:p-4">
                    <div className="text-sm text-gray-600 mb-1">Total Tasks</div>
                    <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                </div>
                <div className="bg-white rounded-card shadow-card p-3 md:p-4">
                    <div className="text-sm text-gray-600 mb-1">Pending</div>
                    <div className="text-2xl font-bold text-warning">{stats.pending}</div>
                </div>
                <div className="bg-white rounded-card shadow-card p-3 md:p-4">
                    <div className="text-sm text-gray-600 mb-1">In Progress</div>
                    <div className="text-2xl font-bold text-info">{stats.inProgress}</div>
                </div>
                <div className="bg-white rounded-card shadow-card p-3 md:p-4">
                    <div className="text-sm text-gray-600 mb-1">Completed</div>
                    <div className="text-2xl font-bold text-success">{stats.completed}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-card shadow-card mb-6 p-4">
                <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-200 pb-4 overflow-x-auto nice-scrollbar">
                    {[
                        { key: 'all', label: 'All', color: 'default' },
                        { key: 'pending', label: 'Pending', color: 'red' },
                        { key: 'in-progress', label: 'In Progress', color: 'gold' },
                        { key: 'completed', label: 'Completed', color: 'green' }
                    ].map(status => (
                        <Button
                            key={status.key}
                            type={filter === status.key ? 'primary' : 'default'}
                            onClick={() => setFilter(status.key)}
                            danger={status.key === 'pending' && filter === 'pending'} // Example styling
                            className={`whitespace-nowrap shrink-0 ${filter === status.key ?
                                (status.key === 'pending' ? 'bg-red-500 border-red-500' :
                                    status.key === 'in-progress' ? 'bg-yellow-500 border-yellow-500' :
                                        status.key === 'completed' ? 'bg-green-500 border-green-500' : 'bg-black border-black')
                                : ''}`}
                        >
                            {status.label}
                        </Button>
                    ))}
                </div>

                {/* Search and Sort */}
                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-200">
                    <div className="flex-1">
                        <Input
                            prefix={<SearchIcon className="w-4 h-4 text-gray-400" />}
                            placeholder="Search tasks by description or creator..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            allowClear
                        />
                    </div>
                </div>

                {/* Advanced Filters */}
                <div className="grid grid-cols-1 md:flex md:flex-wrap items-center gap-3">
                    <div className="hidden md:flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Filters:</span>
                    </div>

                    <div className="w-full md:w-auto">
                        <Select
                            value={departmentFilter}
                            onChange={setDepartmentFilter}
                            className="w-full md:w-40"
                            placeholder="Department"
                            options={[
                                { value: 'all', label: 'All Departments' },
                                ...departments.map(d => ({ value: d._id, label: d.name }))
                            ]}
                        />
                    </div>

                    <div className="w-full md:w-auto">
                        <Select
                            value={roleFilter}
                            onChange={setRoleFilter}
                            className="w-full md:w-36"
                            options={[
                                { value: 'all', label: 'All Roles' },
                                { value: 'director', label: 'Director' },
                                { value: 'generalmanager', label: 'General Manager' },
                                { value: 'manager', label: 'Manager' },
                                { value: 'staff', label: 'Staff' }
                            ]}
                        />
                    </div>

                    <div className="w-full md:w-auto">
                        <Select
                            value={userFilter}
                            onChange={setUserFilter}
                            className="w-full md:w-48"
                            placeholder="Creator"
                            showSearch
                            optionFilterProp="label"
                            options={[
                                { value: 'all', label: 'All Creators' },
                                ...users.map(u => ({
                                    value: u.email,
                                    label: `${u.name} (${u.role?.displayName || u.role})`
                                }))
                            ]}
                        />
                    </div>

                    {/* Clear Filters Button */}
                    {(departmentFilter !== 'all' || priorityFilter !== 'all' || roleFilter !== 'all' || userFilter !== 'all') && (
                        <Button
                            danger
                            type="text"
                            onClick={() => {
                                setDepartmentFilter('all');
                                setPriorityFilter('all');
                                setRoleFilter('all');
                                setUserFilter('all');
                            }}
                        >
                            Clear Filters
                        </Button>
                    )}
                </div>

                {/* Task List */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading tasks...</p>
                        </div>
                    </div>
                ) : sortedTasks.length === 0 ? (
                    <div className="bg-white rounded-card shadow-card p-12 text-center">
                        <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks found</h3>
                        <p className="text-gray-600">
                            {searchQuery || departmentFilter !== 'all' || priorityFilter !== 'all' || roleFilter !== 'all' || userFilter !== 'all'
                                ? 'Try adjusting your filters'
                                : filter === 'all'
                                    ? "You don't have any tasks assigned yet"
                                    : `No ${filter.replace('-', ' ')} tasks`}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 pt-5 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sortedTasks.map(task => (
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

                            {/* Comments Section */}
                            <div className="border-t pt-4">
                                <h4 className="text-sm font-medium text-gray-700 mb-3">Comments & Activity</h4>
                                <div className="space-y-4 mb-4 max-h-60 overflow-y-auto">
                                    {selectedTask.comments?.map((comment, index) => (
                                        <div key={index} className={`flex flex-col ${comment.itemType === 'system' ? 'items-center' : 'items-start'}`}>
                                            <div className="bg-gray-50 rounded-lg p-3 w-full">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-medium text-sm text-gray-900">
                                                        {comment.createdByName}
                                                        {comment.userRole && <span className="text-xs text-gray-500 ml-2">({comment.userRole})</span>}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(comment.createdAt).toLocaleString()}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {(!selectedTask.comments || selectedTask.comments.length === 0) && (
                                        <p className="text-sm text-gray-500 text-center py-2">No comments yet</p>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <Input.TextArea
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Add a note..."
                                        autoSize={{ minRows: 2, maxRows: 4 }}
                                        className="flex-1"
                                    />
                                    <Button
                                        type="primary"
                                        onClick={handleAddComment}
                                        className="self-end"
                                    >
                                        Add
                                    </Button>
                                </div>
                            </div>

                            {selectedTask.status !== TASK_STATUS.COMPLETED && (
                                <Button
                                    type="primary"
                                    onClick={() => handleCompleteTask(selectedTask._id)}
                                    className="w-full bg-green-600 hover:bg-green-500 h-10"
                                    icon={<CheckCircle2 className="w-4 h-4" />}
                                >
                                    {selectedTask.approvalStatus === 'Rejected' ? 'Resubmit for Approval' : 'Mark as Completed'}
                                </Button>
                            )}
                        </div>
                    </Modal>
                )}
            </div>
        </div>
    );
}