import { useState, useEffect } from 'react';
import { ListTodo, Search as SearchIcon, Filter, X, Plus } from 'lucide-react';
import { Select, Input, Button, Modal as AntModal, Form, DatePicker, TimePicker, Checkbox, Pagination } from 'antd';
import dayjs from 'dayjs';
import { useAuth } from '../hooks/useAuth';
import TaskCard from '../components/common/TaskCard';
import Modal from '../components/common/Modal';
import DeleteConfirmationModal from '../components/common/DeleteConfirmationModal';
import api from '../utils/api';
import { showToast } from '../utils/helpers';
import { TASK_STATUS } from '../utils/taskHelpers';

export default function AssignedTasks() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const [departmentFilter, setDepartmentFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [roleFilter, setRoleFilter] = useState('all');
    const [userFilter, setUserFilter] = useState('all');
    const [departments, setDepartments] = useState([]);
    const [users, setUsers] = useState([]);
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
        assignedToEmail: '',
        priority: 'Medium',
        targetDate: '',
        targetTime: '',
        notes: '',
        isSelfTask: false,
        taskGivenBy: '',
    });

    useEffect(() => {
        fetchTasks();
        fetchDepartments();
        fetchUsers();
    }, []);

    const fetchTasks = async () => {
        try {
            const response = await api.get('/tasks/assigned');
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

        // Resolve email to ID for Select
        let assignedToId = task.assignedToEmail;
        if (!task.isSelfTask) {
            const u = users.find(u => u.email === task.assignedToEmail);
            if (u) assignedToId = u._id;
        }

        setCreateFormData({
            task: task.task,
            assignedToEmail: assignedToId,
            priority: task.priority,
            targetDate: task.dueDate ? dayjs(task.dueDate) : null,
            targetTime: task.dueDate ? dayjs(task.dueDate).format('HH:mm') : '',
            notes: task.notes || '',
            isSelfTask: task.isSelfTask || false,
            taskGivenBy: task.taskGivenBy || '',
        });
        setShowCreateModal(true);
    };

    const handleSubmitTask = async () => {
        if (!createFormData.task.trim()) {
            showToast('Task is required', 'error');
            return;
        }

        if (!createFormData.isSelfTask && !createFormData.assignedToEmail) {
            showToast('Please select a user to assign the task', 'error');
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

            // IDs are already in createFormData.assignedToEmail (unless selfTask which is email)
            let finalAssignedToEmail = createFormData.assignedToEmail;
            let finalAssignedToUserId = null;

            if (createFormData.isSelfTask) {
                finalAssignedToUserId = user._id;
                finalAssignedToEmail = user.email;
            } else {
                finalAssignedToUserId = createFormData.assignedToEmail;
                const u = users.find(u => u._id === createFormData.assignedToEmail);
                if (u) finalAssignedToEmail = u.email;
            }

            const payload = {
                task: createFormData.task,
                assignedToEmail: finalAssignedToEmail,
                assignedToUserId: finalAssignedToUserId,
                priority: createFormData.priority,
                notes: createFormData.notes,
                isSelfTask: createFormData.isSelfTask,
                taskGivenBy: createFormData.taskGivenBy,
                taskGivenByUserId: createFormData.taskGivenBy, // In this form, taskGivenBy is the ID from user input/edit logic
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
                    assignedToEmail: '',
                    priority: 'Medium',
                    targetDate: '',
                    targetTime: '',
                    notes: '',
                    isSelfTask: false,
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

    // Filter by status
    const filteredTasks = tasks.filter(task => {
        if (filter === 'all') return true;
        return task.status === filter;
    });

    // Filter by search query
    const searchedTasks = filteredTasks.filter(task => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            task.task?.toLowerCase().includes(query) ||
            task.assignedToName?.toLowerCase().includes(query) ||
            task.assignedToEmail?.toLowerCase().includes(query)
        );
    });

    // Filter by department
    const departmentFilteredTasks = searchedTasks.filter(task => {
        if (departmentFilter === 'all') return true;
        const assignedUser = users.find(u => u.email === task.assignedToEmail);
        return assignedUser?.department?._id === departmentFilter || assignedUser?.department === departmentFilter;
    });

    // Filter by priority
    const priorityFilteredTasks = departmentFilteredTasks.filter(task => {
        if (priorityFilter === 'all') return true;
        return task.priority === priorityFilter;
    });

    // Filter by role
    const roleFilteredTasks = priorityFilteredTasks.filter(task => {
        if (roleFilter === 'all') return true;
        const assignedUser = users.find(u => u.email === task.assignedToEmail);
        const userRoleName = assignedUser?.role?.name || assignedUser?.role;
        return userRoleName === roleFilter;
    });

    // Filter by user
    const userFilteredTasks = roleFilteredTasks.filter(task => {
        if (userFilter === 'all') return true;
        return task.assignedToEmail === userFilter;
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

    return (
        <div className="max-w-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Assigned Tasks</h1>
                    <p className="text-gray-600">Tasks you've assigned to others</p>
                </div>
                <Button
                    type="primary"
                    onClick={() => {
                        setEditingTask(null);
                        setCreateFormData({
                            task: '',
                            assignedToEmail: '',
                            priority: 'Medium',
                            targetDate: '',
                            targetTime: '',
                            notes: '',
                            isSelfTask: false,
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
                                placeholder="Search tasks by description or assignee..."
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
                        {searchQuery && (
                            <div className="mt-2 text-sm text-gray-600">
                                Found {sortedTasks.length} task{sortedTasks.length !== 1 ? 's' : ''}
                            </div>
                        )}
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
                        { key: 'all', label: 'All Status', color: 'default' },
                        { key: TASK_STATUS.PENDING, label: 'Pending', color: 'red' },
                        { key: TASK_STATUS.IN_PROGRESS, label: 'In Progress', color: 'gold' },
                        { key: TASK_STATUS.COMPLETED, label: 'Completed', color: 'green' }
                    ].map(status => (
                        <Button
                            key={status.key}
                            type={filter === status.key ? 'primary' : 'default'}
                            onClick={() => setFilter(status.key)}
                            danger={status.key === TASK_STATUS.PENDING && filter === TASK_STATUS.PENDING}
                            className={`whitespace-nowrap shrink-0 ${filter === status.key ?
                                (status.key === TASK_STATUS.PENDING ? 'bg-red-500 border-red-500' :
                                    status.key === TASK_STATUS.IN_PROGRESS ? 'bg-yellow-500 border-yellow-500' :
                                        status.key === TASK_STATUS.COMPLETED ? 'bg-green-500 border-green-500' : 'bg-black border-black')
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
                            placeholder="Search tasks by description or assignee..."
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
                            placeholder="Assignee"
                            showSearch
                            optionFilterProp="label"
                            options={[
                                { value: 'all', label: 'All Assignees' },
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
                    <ListTodo className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks found</h3>
                    <p className="text-gray-600">
                        {searchQuery || departmentFilter !== 'all' || priorityFilter !== 'all' || roleFilter !== 'all' || userFilter !== 'all'
                            ? 'Try adjusting your filters or search'
                            : "You haven't assigned any tasks yet"}
                    </p>
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
                                        showActions={true}
                                        onView={handleViewTask}
                                        onEdit={canEditDetails ? handleEditTask : undefined}
                                        onDelete={canDeleteTask ? handleDeleteTask : undefined}
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
                        label={<span className="font-medium text-gray-700">Task </span>}
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Form.Item
                            label={<span className="font-medium text-gray-700">Assign To </span>}
                            required
                        >
                            <Select
                                value={createFormData.assignedToEmail}
                                onChange={(value) => setCreateFormData({ ...createFormData, assignedToEmail: value })}
                                placeholder="Select user"
                                disabled={createFormData.isSelfTask}
                                showSearch
                                optionFilterProp="label"
                                size="large"
                                options={users.map(u => ({
                                    value: u._id,
                                    label: `${u.name} (${u.role?.displayName || u.role})`
                                }))}
                            />
                        </Form.Item>

                        <Form.Item
                            label={<span className="font-medium text-gray-700">Priority </span>}
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

                        <Form.Item
                            label={<span className="font-medium text-gray-700">Target Date </span>}
                            required
                        >
                            <DatePicker
                                value={createFormData.targetDate ? dayjs(createFormData.targetDate) : null}
                                onChange={(date, dateString) => setCreateFormData({ ...createFormData, targetDate: dateString })}
                                className="w-full"
                                size="large"
                                disabledDate={(current) => current && current < dayjs().startOf('day')}
                            />
                        </Form.Item>

                        <Form.Item
                            label={<span className="font-medium text-gray-700">Target Time </span>}
                            required
                        >
                            <TimePicker
                                value={createFormData.targetTime ? dayjs(`2000-01-01 ${createFormData.targetTime}`) : null}
                                onChange={(time, timeString) => setCreateFormData({ ...createFormData, targetTime: timeString })}
                                className="w-full"
                                size="large"
                                format="HH:mm"
                            />
                        </Form.Item>
                    </div>

                    <Form.Item label={<span className="font-medium text-gray-700">Notes (Optional)</span>}>
                        <Input.TextArea
                            value={createFormData.notes}
                            onChange={(e) => setCreateFormData({ ...createFormData, notes: e.target.value })}
                            rows={3}
                            placeholder="Add any additional notes..."
                            size="large"
                        />
                    </Form.Item>

                    <div className="mb-6">
                        <Checkbox
                            checked={createFormData.isSelfTask}
                            onChange={(e) => {
                                const checked = e.target.checked;
                                if (checked) {
                                    setCreateFormData(prev => ({
                                        ...prev,
                                        isSelfTask: true,
                                        assignedToEmail: user.email
                                    }));
                                } else {
                                    setCreateFormData(prev => ({
                                        ...prev,
                                        isSelfTask: false,
                                        assignedToEmail: ''
                                    }));
                                }
                            }}
                        >
                            This is a self-assigned task
                        </Checkbox>
                    </div>

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
                    </div>
                </Modal>
            )}
        </div>
    );
}
