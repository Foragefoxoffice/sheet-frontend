import { useState, useEffect } from 'react';
import { User, Search as SearchIcon, Filter, X, Plus, CheckCircle2 } from 'lucide-react';
import { Select, Input, Button, Modal as AntModal, Form, DatePicker, TimePicker, Checkbox, Pagination } from 'antd';
import dayjs from 'dayjs';
import { useAuth } from '../hooks/useAuth';
import TaskCard from '../components/common/TaskCard';
import Modal from '../components/common/Modal';
import DeleteConfirmationModal from '../components/common/DeleteConfirmationModal';
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
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState(null);

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

    const handleDeleteTask = (task) => {
        setTaskToDelete(task);
        setShowDeleteModal(true);
    };

    const confirmDeleteTask = async () => {
        if (!taskToDelete) return;

        try {
            const response = await api.delete(`/tasks/${taskToDelete._id}`);
            if (response.data.success) {
                showToast('Task deleted successfully', 'success');
                fetchTasks();
                setShowDeleteModal(false);
                setTaskToDelete(null);
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
            targetTime: task.dueDate ? dayjs(task.dueDate).format('HH:mm') : '',
            notes: task.notes || '',
            isSelfTask: true,
            taskGivenBy: task.taskGivenBy || '',
        });
        setShowCreateModal(true);
    };

    const handleSubmitTask = async () => {
        if (!createFormData.task.trim()) {
            showToast('Task is required', 'error');
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

            let finalTaskGivenBy = createFormData.taskGivenBy;
            let finalTaskGivenByUserId = null;
            // Note: In SelfTasks context, users list might not be fully loaded or used for lookup, 
            // but we need to ensure we have the ID to send. 
            // IMPORTANT: In SelfTasks, createFormData.taskGivenBy usually holds the ID if coming from a Select with users.
            // But looking at the component, there is NO Select for taskGivenBy in SelfTasks.jsx yet? 
            // Wait, there IS a Select for taskGivenBy in CreateTask.jsx but let's check SelfTasks.jsx form.
            // SelfTasks.jsx:41 initialValues taskGivenBy: ''.
            // SelfTasks.jsx does not have a field for "Task Given By" in the form render! 
            // Wait, looking at lines 480+ in view_file output...
            // It seems SelfTasks.jsx doesn't actually expose Task Given By field in the modal form?
            // Let me re-read SelfTasks.jsx content from Step 72.
            // Lines 490-551 show the Form.
            // It has Task, Priority, "This is a self-assigned task" checkbox (disabled).
            // It strictly does NOT have a "Task Given By" field visible.
            // HOWEVER, the user's screenshot clearly shows "Task Given By (Optional)" dropdown in a modal that looks like a self task.
            // Task ID: 46 SELF.
            // Ah, the screenshot might be from CreateTask page or the user might have added it and I missed it?
            // "Task Given By (Optional)" is in CreateTask.jsx.
            // The screenshot "Task ID: 46 SELF" implies a detail view or edit view. 
            // If it's SelfTasks.jsx, maybe I missed the field in the view_file?
            // Let's look closely at SelfTasks.jsx again.
            // Lines 490-551: Task, Priority, Checkbox. NO TaskGivenBy.
            // So if the user is seeing it, they might be in CreateTask.jsx selecting "Self Task".
            // OR the screenshot IS CreateTask.jsx.
            // The user says "check the self assign name also" and shows a screenshot of "Task ID: 46 SELF" and a form.
            // The Form screenshot has "Task Given By" dropdown. This matches CreateTask.jsx structure.
            // But wait, the Update Task modal in AllTasks/MyTasks DOES have it potentially?
            // Let's check AllTasks.jsx and others.

            // In AllTasks.jsx, I added payload support.

            // If the user's screenshot is from "Create Task" page, I fixed it in Step 87.
            // If the user is editing a task, I need to fix it there too.
            // Let's update AllTasks.jsx, AssignedTasks.jsx, MyTasks.jsx to support valid ID sending.

            // For now, I will update SelfTasks.jsx payload construction JUST IN CASE the field is added later or hidden
            // AND primarily update AllTasks, AssignedTasks, MyTasks.

            // Actually, let's look at the screenshot again (I can't see it but I can infer). "Task Given By (Optional)" with a dropdown.
            // CreateTask.jsx has this.

            // Let's systematically update the other files to be safe.

            const payload = {
                task: createFormData.task,
                assignedToEmail: user.email,
                assignedToUserId: user._id,
                priority: createFormData.priority,
                notes: createFormData.notes,
                isSelfTask: true,
                taskGivenBy: createFormData.taskGivenBy, // If this is ID
                taskGivenByUserId: createFormData.taskGivenBy, // Send as ID
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
                const updatedTask = response.data.task;
                setSelectedTask(updatedTask);
                setNewComment('');
                showToast('Comment added', 'success');

                // Update local tasks state
                setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
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

            <DeleteConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setTaskToDelete(null);
                }}
                onConfirm={confirmDeleteTask}
                title="Delete Task"
                message="Are you sure you want to delete this task? This action cannot be undone."
                itemName={taskToDelete?.task}
            />

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
                        label={<span className="font-medium text-gray-700">Task</span>}
                        required
                    >
                        <Input.TextArea
                            value={createFormData.task}
                            onChange={(e) => setCreateFormData({ ...createFormData, task: e.target.value })}
                            placeholder="Enter task"
                            rows={3}
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item
                        label={<span className="font-medium text-gray-700">Priority</span>}
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
                    title={`Task ID: ${selectedTask.sno}`}
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
