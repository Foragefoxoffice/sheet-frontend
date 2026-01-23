import { useState, useEffect } from 'react';
import { User, Search as SearchIcon, Filter, X, Plus, CheckCircle2 } from 'lucide-react';
import { Select, Input, Button, Modal as AntModal, Form, DatePicker, TimePicker, Checkbox, Pagination } from 'antd';
import dayjs from 'dayjs';
import { useAuth } from '../hooks/useAuth';
import TaskCard from '../components/common/TaskCard';
import Modal from '../components/common/Modal';
import api from '../utils/api';
import { showToast } from '../utils/helpers';
import { TASK_STATUS } from '../utils/taskHelpers';

export default function SelfTasks() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [selectedTask, setSelectedTask] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);

    // CRUD State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [createFormData, setCreateFormData] = useState({
        task: '',
        assignedToEmail: user.email, // Default to self
        priority: 'Medium',
        targetDate: '',
        targetTime: '',
        notes: '',
        isSelfTask: true, // Always true for self tasks context
        taskGivenBy: '',
    });

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const response = await api.get('/tasks/self');
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

    const handleDeleteTask = async (task) => {
        if (!window.confirm(`Are you sure you want to delete task "${task.task}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const response = await api.delete(`/tasks/${task._id}`);
            if (response.data.success) {
                showToast('Task deleted successfully', 'success');
                fetchTasks();
            }
        } catch (error) {
            console.error('Delete task error:', error);
            showToast(error.response?.data?.error || 'Failed to delete task', 'error');
        }
    };

    const handleEditTask = (task) => {
        setEditingTask(task);
        setCreateFormData({
            task: task.task,
            assignedToEmail: user.email,
            priority: task.priority,
            targetDate: task.dueDate ? dayjs(task.dueDate) : null,
            targetTime: task.dueDate ? dayjs(task.dueDate) : null,
            notes: task.notes || '',
            isSelfTask: true,
            taskGivenBy: task.taskGivenBy || '',
        });
        setShowCreateModal(true);
    };

    const handleSubmitTask = async () => {
        if (!createFormData.task.trim()) {
            showToast('Task description is required', 'error');
            return;
        }

        if (!createFormData.targetDate || !createFormData.targetTime) {
            showToast('Please select target date and time', 'error');
            return;
        }

        try {
            const dateStr = dayjs.isDayjs(createFormData.targetDate)
                ? createFormData.targetDate.format('YYYY-MM-DD')
                : createFormData.targetDate;

            const timeStr = dayjs.isDayjs(createFormData.targetTime)
                ? createFormData.targetTime.format('HH:mm')
                : createFormData.targetTime;

            const dueDate = new Date(`${dateStr}T${timeStr}`);

            if (dueDate < new Date()) {
                showToast('Target date/time cannot be in the past', 'error');
                return;
            }

            const now = new Date();
            const diffMs = dueDate - now;
            const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

            const payload = {
                task: createFormData.task,
                assignedToEmail: user.email, // Force self
                priority: createFormData.priority,
                notes: createFormData.notes,
                isSelfTask: true, // Force true
                taskGivenBy: createFormData.taskGivenBy,
            };

            let response;
            if (editingTask) {
                response = await api.put(`/tasks/${editingTask._id}`, {
                    ...payload,
                    dueDate: dueDate.toISOString()
                });
            } else {
                response = await api.post('/tasks', {
                    ...payload,
                    durationType: 'hours',
                    durationValue: diffHours,
                });
            }

            if (response.data.success) {
                showToast(editingTask ? 'Task updated successfully' : 'Task created successfully!', 'success');
                setShowCreateModal(false);
                setEditingTask(null);
                setCreateFormData({
                    task: '',
                    assignedToEmail: user.email,
                    priority: 'Medium',
                    targetDate: '',
                    targetTime: '',
                    notes: '',
                    isSelfTask: true,
                    taskGivenBy: '',
                });
                fetchTasks();
            }
        } catch (error) {
            console.error('Task save error:', error);
            showToast(error.response?.data?.error || 'Failed to save task', 'error');
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;

        try {
            const response = await api.post(`/tasks/${selectedTask._id}/comments`, {
                text: newComment
            });

            if (response.data.success) {
                setSelectedTask(response.data.task);
                setNewComment('');
                showToast('Comment added', 'success');
            }
        } catch (error) {
            console.error('Error adding comment:', error);
            showToast('Failed to add comment', 'error');
        }
    };

    // Filters & Sorting
    const filteredTasks = tasks.filter(task => {
        if (filter === 'all') return true;
        if (filter === 'pending') return task.status === TASK_STATUS.PENDING;
        if (filter === 'in-progress') return task.status === TASK_STATUS.IN_PROGRESS;
        if (filter === 'completed') return task.status === TASK_STATUS.COMPLETED;
        return true;
    });

    const searchedTasks = filteredTasks.filter(task => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return task.task?.toLowerCase().includes(query);
    });

    const priorityFilteredTasks = searchedTasks.filter(task => {
        if (priorityFilter === 'all') return true;
        return task.priority === priorityFilter;
    });

    const sortedTasks = [...priorityFilteredTasks].sort((a, b) => {
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

    return (
        <div className="max-w-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Self Tasks</h1>
                    <p className="text-gray-600">Tasks you've created for yourself</p>
                </div>
                <Button
                    type="primary"
                    onClick={() => {
                        setEditingTask(null);
                        setCreateFormData({
                            task: '',
                            assignedToEmail: user.email,
                            priority: 'Medium',
                            targetDate: '',
                            targetTime: '',
                            notes: '',
                            isSelfTask: true,
                            taskGivenBy: '',
                        });
                        setShowCreateModal(true);
                    }}
                    icon={<Plus className="w-4 h-4" />}
                    size="large"
                >
                    Create Task
                </Button>
            </div>

            {/* Floating Search Bar */}
            {showSearch && (
                <div className="mb-6 animate-slideDown">
                    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
                        <div className="flex items-center gap-3">
                            <Input
                                prefix={<SearchIcon className="w-4 h-4 text-gray-400" />}
                                placeholder="Search tasks..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                                allowClear
                            />
                            <Button
                                icon={<X className="w-4 h-4" />}
                                onClick={() => {
                                    setShowSearch(false);
                                    setSearchQuery('');
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

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
                            danger={status.key === 'pending' && filter === 'pending'}
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
                            placeholder="Search tasks..."
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
                            value={priorityFilter}
                            onChange={setPriorityFilter}
                            className="w-full md:w-36"
                            options={[
                                { value: 'all', label: 'All Priorities' },
                                { value: 'High', label: 'High Priority' },
                                { value: 'Medium', label: 'Medium Priority' },
                                { value: 'Low', label: 'Low Priority' }
                            ]}
                        />
                    </div>

                    {(priorityFilter !== 'all') && (
                        <Button danger type="text" onClick={() => setPriorityFilter('all')}>Clear Filters</Button>
                    )}
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
            ) : sortedTasks.length === 0 ? (
                <div className="bg-white rounded-card shadow-card p-12 text-center">
                    <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No self tasks</h3>
                    <p className="text-gray-600">You haven't created any tasks for yourself yet</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 pt-5 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sortedTasks
                            .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                            .map(task => {
                                // Helper to safely get string ID
                                const getId = (obj) => {
                                    if (!obj) return '';
                                    return typeof obj === 'object' ? obj._id?.toString() : obj.toString();
                                };
                                const userId = user._id?.toString();

                                const isCreator = getId(task.createdBy) === userId;

                                // User can edit if they have 'editAllTasks' OR if they are creator + have 'editOwnTasks'
                                const canEditDetails =
                                    user.permissions.editAllTasks ||
                                    (isCreator && user.permissions.editOwnTasks);

                                // User can delete if they have 'deleteAllTasks' OR if they are creator + have 'deleteOwnTasks'
                                const canDeleteTask =
                                    user.permissions.deleteAllTasks ||
                                    (isCreator && user.permissions.deleteOwnTasks);

                                return (
                                    <TaskCard
                                        key={task._id}
                                        task={task}
                                        onStatusChange={handleStatusChange}
                                        onView={handleViewTask}
                                        onEdit={canEditDetails ? handleEditTask : undefined}
                                        onDelete={canDeleteTask ? handleDeleteTask : undefined}
                                        showActions={true}
                                    />
                                );
                            })}
                    </div>

                    {/* Pagination */}
                    {sortedTasks.length > 0 && (
                        <div className="mt-8 flex justify-center">
                            <Pagination
                                current={currentPage}
                                total={sortedTasks.length}
                                pageSize={pageSize}
                                onChange={(page) => {
                                    setCurrentPage(page);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                onShowSizeChange={(current, size) => {
                                    setPageSize(size);
                                    setCurrentPage(1);
                                }}
                                showSizeChanger
                                showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} tasks`}
                                pageSizeOptions={['6', '12', '24', '48']}
                            />
                        </div>
                    )}
                </>
            )}

            {/* Create/Edit Task Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => {
                    setShowCreateModal(false);
                    setEditingTask(null);
                }}
                title={editingTask ? 'Update Task' : 'Create Task'}
            >
                <Form
                    layout="vertical"
                    onFinish={handleSubmitTask}
                    initialValues={{ priority: 'Medium' }}
                    className="mt-4"
                >
                    <Form.Item
                        label={<span className="font-medium text-gray-700">Task Description <span className="text-danger">*</span></span>}
                        required
                    >
                        <Input.TextArea
                            value={createFormData.task}
                            onChange={(e) => setCreateFormData({ ...createFormData, task: e.target.value })}
                            placeholder="Enter task description"
                            rows={3}
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item
                        label={<span className="font-medium text-gray-700">Priority <span className="text-danger">*</span></span>}
                    >
                        <Select
                            value={createFormData.priority}
                            onChange={(value) => setCreateFormData({ ...createFormData, priority: value })}
                            size="large"
                        >
                            <Select.Option value="Low">Low</Select.Option>
                            <Select.Option value="Medium">Medium</Select.Option>
                            <Select.Option value="High">High</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item>
                        <Checkbox
                            checked={true}
                            disabled
                        >
                            This is a self-assigned task
                        </Checkbox>
                    </Form.Item>

                    <div className="flex gap-3 pt-2">
                        <Button
                            size="large"
                            onClick={() => setShowCreateModal(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            className="flex-1 bg-primary hover:bg-primary-600"
                            icon={<Plus className="w-4 h-4" />}
                        >
                            {editingTask ? 'Update Task' : 'Create Task'}
                        </Button>
                    </div>
                </Form>
            </Modal>

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
                                    className="self-end create-user-btn"
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
    );
}
