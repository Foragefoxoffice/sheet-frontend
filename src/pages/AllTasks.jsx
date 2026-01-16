import { useState, useEffect } from 'react';
import { Select, DatePicker, TimePicker, Input, Checkbox, Button, Form, ConfigProvider } from 'antd';
import dayjs from 'dayjs';
import { CheckCircle2, Clock, ListTodo, Plus, Search, ArrowUpDown, Filter, X } from 'lucide-react';
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
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [users, setUsers] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [createFormData, setCreateFormData] = useState({
        task: '',
        assignedToEmail: '',
        priority: 'Medium',
        targetDate: '',
        targetTime: '',
        notes: '',
        isSelfTask: false,
        taskGivenBy: '', // Email of person who gave the task
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('date'); // date, priority, status
    const [departmentFilter, setDepartmentFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [roleFilter, setRoleFilter] = useState('all');
    const [userFilter, setUserFilter] = useState('all');
    const [departments, setDepartments] = useState([]);
    const [showSearch, setShowSearch] = useState(false);
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    useEffect(() => {
        fetchAllTasks();
        fetchUsers();
        fetchDepartments();
    }, []);

    const fetchAllTasks = async () => {
        try {
            setLoading(true);
            // Fetch all four types of tasks
            const [assignedToMe, iAssigned, selfTasks, allDeptTasks] = await Promise.all([
                api.get('/tasks'),
                api.get('/tasks/assigned'),
                api.get('/tasks/self'),
                api.get('/tasks/all'),
            ]);

            setAllTasks({
                assignedToMe: assignedToMe.data.tasks || [],
                iAssigned: iAssigned.data.tasks || [],
                selfTasks: selfTasks.data.tasks || [],
                allDeptTasks: allDeptTasks.data.tasks || [],
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

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users/for-tasks');
            setUsers(response.data.users || []);
        } catch (error) {
            console.error('Error fetching users:', error);
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

    const handleCreateFormChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === 'isSelfTask' && checked) {
            // When self-task is checked, auto-assign to current user
            setCreateFormData(prev => ({
                ...prev,
                isSelfTask: true,
                assignedToEmail: user.email
            }));
        } else if (name === 'isSelfTask' && !checked) {
            // When unchecked, clear the assignment
            setCreateFormData(prev => ({
                ...prev,
                isSelfTask: false,
                assignedToEmail: ''
            }));
        } else {
            setCreateFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleCreateTask = async () => {
        // e.preventDefault() is not needed directly with Ant Design Form onFinish

        if (!createFormData.task.trim()) {
            showToast('Task description is required', 'error');
            return;
        }

        // Only validate assignedToEmail if not a self-task
        if (!createFormData.isSelfTask && !createFormData.assignedToEmail) {
            showToast('Please select a user to assign the task', 'error');
            return;
        }

        if (!createFormData.targetDate || !createFormData.targetTime) {
            showToast('Please select target date and time', 'error');
            return;
        }

        try {
            const dueDate = new Date(`${createFormData.targetDate}T${createFormData.targetTime}`);

            if (dueDate < new Date()) {
                showToast('Target date/time cannot be in the past', 'error');
                return;
            }

            const now = new Date();
            const diffMs = dueDate - now;
            const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

            const requestData = {
                task: createFormData.task,
                assignedToEmail: createFormData.assignedToEmail,
                priority: createFormData.priority,
                durationType: 'hours',
                durationValue: diffHours,
                notes: createFormData.notes,
                isSelfTask: createFormData.isSelfTask,
                taskGivenBy: createFormData.taskGivenBy, // Include taskGivenBy
            };

            const response = await api.post('/tasks', requestData);

            if (response.data.success) {
                showToast('Task created successfully!', 'success');
                setShowCreateModal(false);
                setCreateFormData({
                    task: '',
                    assignedToEmail: '',
                    priority: 'Medium',
                    targetDate: '',
                    targetTime: '',
                    notes: '',
                    isSelfTask: false,
                    taskGivenBy: '', // Reset taskGivenBy
                });
                fetchAllTasks();
            }
        } catch (error) {
            showToast(error.response?.data?.error || 'Failed to create task', 'error');
        }
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
            case 'all-tasks':
                return allTasks.allDeptTasks || [];
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

    // Filter by search query
    const searchedTasks = filteredTasks.filter(task => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            task.task?.toLowerCase().includes(query) ||
            task.assignedToName?.toLowerCase().includes(query) ||
            task.assignedToEmail?.toLowerCase().includes(query) ||
            task.createdByEmail?.toLowerCase().includes(query)
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

    // Get user role for tab visibility
    const userRoleName = user?.role?.name || user?.role;
    const isStaff = userRoleName === 'staff';

    const stats = {
        assignedToMe: allTasks.assignedToMe?.length || 0,
        iAssigned: allTasks.iAssigned?.length || 0,
        selfTasks: allTasks.selfTasks?.length || 0,
        allDeptTasks: allTasks.allDeptTasks?.length || 0,
        total: (allTasks.assignedToMe?.length || 0) + (allTasks.iAssigned?.length || 0) + (allTasks.selfTasks?.length || 0),
    };

    return (
        <div className="max-w-full overflow-hidden">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">All Tasks</h1>
                    <p className="text-gray-600">View and manage all your tasks</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Search Toggle Button */}

                    <Button
                        type="primary"
                        onClick={() => setShowCreateModal(true)}
                        className="bg-primary hover:bg-primary-600 flex items-center gap-2 h-auto py-2.5 px-6 w-full md:w-auto justify-center"
                        icon={<Plus className="w-5 h-5" />}
                    >
                        Create Task
                    </Button>
                </div>
            </div>

            {/* Floating Search Bar */}
            {showSearch && (
                <div className="mb-6 animate-slideDown">
                    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
                        <div className="flex items-center gap-3">
                            <Input
                                prefix={<Search className="w-5 h-5 text-gray-400" />}
                                placeholder="Search tasks by description, assignee, or creator..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1"
                                size="large"
                                autoFocus
                                allowClear
                            />
                            <Button
                                type="text"
                                onClick={() => {
                                    setShowSearch(false);
                                    setSearchQuery('');
                                }}
                                className="flex items-center justify-center"
                                icon={<X className="w-5 h-5 text-gray-500" />}
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
                    <div className="text-sm text-gray-600 mb-1">Assigned to Me</div>
                    <div className="text-2xl font-bold text-blue-600">{stats.assignedToMe}</div>
                </div>
                <div className="bg-white rounded-card shadow-card p-3 md:p-4">
                    <div className="text-sm text-gray-600 mb-1">I Assigned</div>
                    <div className="text-2xl font-bold text-purple-600">{stats.iAssigned}</div>
                </div>
                <div className="bg-white rounded-card shadow-card p-3 md:p-4">
                    <div className="text-sm text-gray-600 mb-1">Self Tasks</div>
                    <div className="text-2xl font-bold text-green-600">{stats.selfTasks}</div>
                </div>
            </div>

            {/* View Filter Tabs */}
            <div className="bg-white rounded-card shadow-card mb-6 p-4">
                <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-200 pb-4 overflow-x-auto nice-scrollbar">
                    <button
                        onClick={() => setViewFilter('assigned-to-me')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap shrink-0 ${viewFilter === 'assigned-to-me'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Assigned to Me
                    </button>
                    <button
                        onClick={() => setViewFilter('i-assigned')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap shrink-0 ${viewFilter === 'i-assigned'
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        I Assigned
                    </button>
                    <button
                        onClick={() => setViewFilter('self-tasks')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap shrink-0 ${viewFilter === 'self-tasks'
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Self Tasks
                    </button>
                    {/* Hide All Tasks tab for Staff */}
                    {!isStaff && (
                        <button
                            onClick={() => setViewFilter('all-tasks')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap shrink-0 ${viewFilter === 'all-tasks'
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            All Tasks
                        </button>
                    )}
                </div>

                {/* Status Filter */}
                <div className="flex flex-wrap gap-2 overflow-x-auto nice-scrollbar pb-2">
                    <button
                        onClick={() => setStatusFilter('all')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap shrink-0 ${statusFilter === 'all'
                            ? 'bg-black text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setStatusFilter('pending')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap shrink-0 ${statusFilter === 'pending'
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Pending
                    </button>
                    <button
                        onClick={() => setStatusFilter('in-progress')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap shrink-0 ${statusFilter === 'in-progress'
                            ? 'bg-yellow-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        In Progress
                    </button>
                    <button
                        onClick={() => setStatusFilter('completed')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap shrink-0 ${statusFilter === 'completed'
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Completed
                    </button>
                </div>

                {/* Mobile Filter Button */}
                <div className="md:hidden mt-4">
                    <Button
                        type="primary"
                        onClick={() => setShowMobileFilters(true)}
                        className="w-full flex items-center justify-center gap-2"
                        icon={<Filter className="w-4 h-4" />}
                    >
                        Filters & Search
                    </Button>
                </div>


                {/* Desktop Filters - Hidden on Mobile */}
                <div className="hidden md:flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:flex md:flex-wrap items-center gap-3 mt-0 md:mt-3 w-full md:w-auto">
                        <div className="hidden md:flex items-center gap-2">
                            <Filter className="w-5 h-5 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Filters:</span>
                        </div>

                        {/* Department Filter */}
                        <div className="w-full md:w-auto">
                            <Select
                                value={departmentFilter}
                                onChange={(value) => setDepartmentFilter(value)}
                                className="w-full md:w-48"
                                placeholder="Department"
                                options={[
                                    { value: 'all', label: 'All Departments' },
                                    ...departments.map(dept => ({ value: dept._id, label: dept.name }))
                                ]}
                            />
                        </div>

                        {/* Priority Filter */}
                        <div className="w-full md:w-auto">
                            <Select
                                value={priorityFilter}
                                onChange={(value) => setPriorityFilter(value)}
                                className="w-full md:w-36"
                                options={[
                                    { value: 'all', label: 'All Priorities' },
                                    { value: 'High', label: 'High Priority' },
                                    { value: 'Medium', label: 'Medium Priority' },
                                    { value: 'Low', label: 'Low Priority' }
                                ]}
                            />
                        </div>

                        {/* Role Filter */}
                        <div className="w-full md:w-auto">
                            <Select
                                value={roleFilter}
                                onChange={(value) => setRoleFilter(value)}
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

                        {/* User Filter */}
                        <div className="w-full md:w-auto">
                            <Select
                                value={userFilter}
                                onChange={(value) => setUserFilter(value)}
                                className="w-full md:w-56"
                                showSearch
                                optionFilterProp="label"
                                options={[
                                    { value: 'all', label: 'All Users' },
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
                                type="text"
                                danger
                                onClick={() => {
                                    setDepartmentFilter('all');
                                    setPriorityFilter('all');
                                    setRoleFilter('all');
                                    setUserFilter('all');
                                }}
                                className="font-medium hover:bg-red-50 w-full md:w-auto"
                            >
                                Clear Filters
                            </Button>
                        )}
                    </div>

                    <Button
                        onClick={() => setShowSearch(!showSearch)}
                        className="h-auto p-2.5 flex items-center justify-center bg-gray-100 hover:bg-gray-200 border-none self-end md:self-auto"
                        icon={<Search className="w-5 h-5 text-gray-700" />}
                    />

                </div>

                {/* Advanced Filters */}

            </div>

            {/* Task List */}
            {loading ? (
                <div className="flex  items-center justify-center py-12">
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
                        {statusFilter === 'all'
                            ? "No tasks in this category"
                            : `No ${statusFilter.replace('-', ' ')} tasks`}
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

            {/* Create Task Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Create New Task"
            >
                <Form layout="vertical" onFinish={handleCreateTask} className="mt-4">
                    <Form.Item
                        label={<span className="font-medium text-gray-700">Task Description <span className="text-danger">*</span></span>}
                        required
                        validateStatus={!createFormData.task && "error"}
                    >
                        <Input.TextArea
                            value={createFormData.task}
                            onChange={(e) => setCreateFormData({ ...createFormData, task: e.target.value })}
                            rows={4}
                            placeholder="Describe the task in detail..."
                            size="large"
                        />
                    </Form.Item>

                    {/* Show Assign To only if not self-task */}
                    {!createFormData.isSelfTask && (
                        <Form.Item
                            label={<span className="font-medium text-gray-700">Assign To <span className="text-danger">*</span></span>}
                            required
                        >
                            <Select
                                value={createFormData.assignedToEmail || undefined}
                                onChange={(value) => setCreateFormData({ ...createFormData, assignedToEmail: value })}
                                placeholder="Select a user"
                                size="large"
                                showSearch
                                optionFilterProp="children"
                            >
                                {users.map(u => (
                                    <Select.Option key={u._id} value={u.email}>
                                        {u.name} ({u.role?.displayName || u.role})
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    )}

                    {/* Show creator info for self-tasks */}
                    {createFormData.isSelfTask && (
                        <div className="space-y-4 mb-6">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 text-blue-700">
                                    <ListTodo className="w-5 h-5" />
                                    <span className="font-medium">Self-Assigned Task</span>
                                </div>
                                <p className="text-sm text-blue-600 mt-2">
                                    Assigned to: <span className="font-semibold">{user.name}</span> ({user.email})
                                </p>
                            </div>

                            {/* Task Given By field */}
                            <Form.Item
                                label={<span className="font-medium text-gray-700">Task Given By (Optional)</span>}
                                help="Select the person who originally requested or assigned this task to you"
                            >
                                <Select
                                    value={createFormData.taskGivenBy || undefined}
                                    onChange={(value) => setCreateFormData({ ...createFormData, taskGivenBy: value })}
                                    placeholder="Select who gave you this task"
                                    size="large"
                                    showSearch
                                    optionFilterProp="children"
                                    allowClear
                                >
                                    {users
                                        .filter(u => u.email !== user.email)
                                        .map(u => (
                                            <Select.Option key={u._id} value={u.email}>
                                                {u.name} ({u.role?.displayName || u.role})
                                            </Select.Option>
                                        ))}
                                </Select>
                            </Form.Item>
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-4">
                        <Form.Item label={<span className="font-medium text-gray-700">Priority</span>}>
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
                            label={<span className="font-medium text-gray-700">Target Date <span className="text-danger">*</span></span>}
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
                            label={<span className="font-medium text-gray-700">Target Time <span className="text-danger">*</span></span>}
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
                            Create Task
                        </Button>
                    </div>
                </Form>
            </Modal>

            {/* Mobile Filter Modal */}
            <Modal
                isOpen={showMobileFilters}
                onClose={() => setShowMobileFilters(false)}
                title="Filters & Search"
            >
                <div className="space-y-4">
                    {/* Search */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Search</label>
                        <Input
                            prefix={<Search className="w-4 h-4 text-gray-400" />}
                            placeholder="Search tasks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            allowClear
                            size="large"
                        />
                    </div>

                    {/* Department Filter */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Department</label>
                        <Select
                            value={departmentFilter}
                            onChange={(value) => setDepartmentFilter(value)}
                            className="w-full"
                            size="large"
                            options={[
                                { value: 'all', label: 'All Departments' },
                                ...departments.map(dept => ({ value: dept._id, label: dept.name }))
                            ]}
                        />
                    </div>

                    {/* Priority Filter */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Priority</label>
                        <Select
                            value={priorityFilter}
                            onChange={(value) => setPriorityFilter(value)}
                            className="w-full"
                            size="large"
                            options={[
                                { value: 'all', label: 'All Priorities' },
                                { value: 'High', label: 'High Priority' },
                                { value: 'Medium', label: 'Medium Priority' },
                                { value: 'Low', label: 'Low Priority' }
                            ]}
                        />
                    </div>

                    {/* Role Filter */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Role</label>
                        <Select
                            value={roleFilter}
                            onChange={(value) => setRoleFilter(value)}
                            className="w-full"
                            size="large"
                            options={[
                                { value: 'all', label: 'All Roles' },
                                { value: 'director', label: 'Director' },
                                { value: 'generalmanager', label: 'General Manager' },
                                { value: 'manager', label: 'Manager' },
                                { value: 'staff', label: 'Staff' }
                            ]}
                        />
                    </div>

                    {/* User Filter */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">User</label>
                        <Select
                            value={userFilter}
                            onChange={(value) => setUserFilter(value)}
                            className="w-full"
                            size="large"
                            showSearch
                            optionFilterProp="label"
                            options={[
                                { value: 'all', label: 'All Users' },
                                ...users.map(u => ({
                                    value: u.email,
                                    label: `${u.name} (${u.role?.displayName || u.role})`
                                }))
                            ]}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t">
                        <Button
                            danger
                            onClick={() => {
                                setSearchQuery('');
                                setDepartmentFilter('all');
                                setPriorityFilter('all');
                                setRoleFilter('all');
                                setUserFilter('all');
                            }}
                            className="flex-1"
                            size="large"
                        >
                            Clear All
                        </Button>
                        <Button
                            type="primary"
                            onClick={() => setShowMobileFilters(false)}
                            className="flex-1"
                            size="large"
                        >
                            Apply Filters
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
