import { useState, useEffect, useMemo } from 'react';
import { Select, DatePicker, TimePicker, Input, Checkbox, Button, Form, Pagination, Modal as AntModal, Skeleton } from 'antd';
import dayjs from 'dayjs';
import { CheckCircle2, ListTodo, Plus, Search, Filter, Users, Send, Target, Briefcase, LayoutGrid, CornerUpRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import TaskCard from '../components/common/TaskCard';
import Modal from '../components/common/Modal';
import DeleteConfirmationModal from '../components/common/DeleteConfirmationModal';
import StatCard from '../components/common/StatCard';
import api from '../utils/api';
import { showToast } from '../utils/helpers';
import { TASK_STATUS } from '../utils/taskHelpers';

function TaskGridSkeleton({ count = 12 }) {
    return (
        <>
            <div className="grid grid-cols-1 pt-0 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: count }).map((_, idx) => (
                    <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <Skeleton
                                    active
                                    title={{ width: '70%' }}
                                    paragraph={{ rows: 3, width: ['90%', '80%', '60%'] }}
                                />
                            </div>
                            <Skeleton.Avatar active size={44} shape="square" />
                        </div>
                        <div className="mt-4 flex items-center justify-between gap-3">
                            <Skeleton active title={false} paragraph={{ rows: 1, width: 120 }} />
                            <Skeleton.Button active size="small" style={{ width: 96, height: 28 }} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 flex justify-center">
                <div className="bg-white rounded-xl border border-gray-100 px-6 py-4 shadow-sm">
                    <Skeleton active title={false} paragraph={{ rows: 1, width: 260 }} />
                </div>
            </div>
        </>
    );
}

function AllTasksSkeleton({
    canCreateTask,
    statCardCount,
    viewTabCount,
    pageSize,
    filterSelectCount = 3,
}) {
    return (
        <div className="space-y-6">
            {/* Header skeleton */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="w-full md:w-auto">
                    <Skeleton active title={{ width: 220 }} paragraph={{ rows: 1, width: 360 }} />
                </div>
                <div className="w-full md:w-auto">
                    {canCreateTask ? (
                        <Skeleton.Button active style={{ width: 180, height: 44, borderRadius: 12 }} />
                    ) : (
                        <Skeleton active title={false} paragraph={false} />
                    )}
                </div>
            </div>

            {/* Stats cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: statCardCount }).map((_, idx) => (
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

            {/* Tabs + filters skeleton */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                <div className="flex flex-col gap-5">
                    {/* View tabs skeleton */}
                    <div className="flex flex-wrap gap-3 overflow-x-auto nice-scrollbar pb-1">
                        {Array.from({ length: viewTabCount }).map((_, idx) => (
                            <Skeleton.Button
                                key={idx}
                                active
                                size="small"
                                style={{ width: 140, height: 40, borderRadius: 12 }}
                            />
                        ))}
                    </div>

                    {/* Status pills skeleton */}
                    <div className="flex flex-wrap gap-2 overflow-x-auto nice-scrollbar">
                        {Array.from({ length: 5 }).map((_, idx) => (
                            <Skeleton.Button
                                key={idx}
                                active
                                size="small"
                                style={{ width: 120, height: 36, borderRadius: 10 }}
                            />
                        ))}
                    </div>
                </div>

                {/* Search + selects skeleton */}
                <div className="mt-6 flex flex-col gap-4">
                    <div className="h-px bg-gray-100 w-full" />
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <div className="w-full md:flex-1">
                            <Skeleton.Input active style={{ width: '100%', height: 44, borderRadius: 12 }} />
                        </div>
                        <div className="w-full md:w-auto flex flex-wrap items-center gap-3">
                            {Array.from({ length: filterSelectCount }).map((_, idx) => (
                                <Skeleton.Input
                                    key={idx}
                                    active
                                    style={{ width: 160, height: 32, borderRadius: 10 }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Task grid skeleton */}
            <TaskGridSkeleton count={pageSize} />
        </div>
    );
}

export default function AllTasks() {
    const { user } = useAuth();
    const userRoleName = (user?.role?.name || user?.role || '').toLowerCase().replace(/\s+/g, '');
    const [editingTask, setEditingTask] = useState(null);
    const [allTasks, setAllTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState(null);
    const [viewFilter, setViewFilter] = useState(() => {
        // Default to 'assigned-to-me'
        // If Dept Head/Manager wants Forwarded Tasks as default? Probably not.
        return 'assigned-to-me';
    });
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedTask, setSelectedTask] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [users, setUsers] = useState([]);
    const [assignableUsers, setAssignableUsers] = useState([]);
    const [allUsersList, setAllUsersList] = useState([]); // All users for "Task Given By" dropdown
    const [newComment, setNewComment] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);
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

    // Forwarding specific states
    const [showForwardModal, setShowForwardModal] = useState(false);
    const [forwardingTask, setForwardingTask] = useState(null);
    const [forwardUsers, setForwardUsers] = useState([]);
    const [selectedForwardUsers, setSelectedForwardUsers] = useState([]);
    const [forwardNote, setForwardNote] = useState('');

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
                fetchAllTasks();
                setShowDeleteModal(false);
                setTaskToDelete(null);
            }
        } catch (error) {
            console.error('Delete task error:', error);
            showToast(error.response?.data?.error || 'Failed to delete task', 'error');
        }
    };

    const handleForwardTask = (task) => {
        setForwardingTask(task);
        setSelectedForwardUsers([]);
        setForwardNote('');

        const currentUserRole = (user?.role?.name || user?.role || '').toLowerCase().replace(/\s+/g, '');
        let availableUsers = [];

        // Helper to get ID string safely
        const getDeptId = (dept) => {
            if (!dept) return '';
            if (typeof dept === 'object' && dept._id) return dept._id.toString();
            return dept.toString();
        };

        const myDeptId = getDeptId(user.department);

        // Logic for Department Head/Manager
        if (['departmenthead', 'manager'].includes(currentUserRole)) {
            // "Give same assign to field option for forward task without other department head"
            // Start with Assignable Users (which includes: Own Staff + Other Dept Heads + PMs + Standalone)
            const sourceUsers = assignableUsers.length > 0 ? assignableUsers : users;

            availableUsers = sourceUsers.filter(u => {
                const uDeptId = getDeptId(u.department);
                const uRole = (u.role?.name || u.role || '').toLowerCase().replace(/\s+/g, '');
                const isSelf = u.email === user.email;

                // Always exclude self
                if (isSelf) return false;

                // Always exclude the person currently assigned (forwarding away from them)
                if (u.email === task.assignedToEmail) return false;

                // CRITICAL RULE: "without other department head"
                // If user is a Department Head role (or Manager)
                // Filter out if they are a Department Head/Manager in a DIFFERENT department
                if (['departmenthead', 'manager'].includes(uRole)) {
                    if (uDeptId !== myDeptId && uDeptId !== '') {
                        return false;
                    }
                }

                // If they passed the above exclusion, they are valid (assuming they were in assignableUsers)
                return true;
            });
        }
        // Logic for other roles (Director, GM, etc) -> Standard Assignable Logic
        else {
            availableUsers = assignableUsers.filter(u => u.email !== task.assignedToEmail);
        }

        // Apply strict "Staff Only" filter as requested
        availableUsers = availableUsers.filter(u => {
            const r = (u.role?.name || u.role || '').toLowerCase().replace(/\s+/g, '');
            return r === 'staff';
        });

        setForwardUsers(availableUsers);
        setShowForwardModal(true);
    };

    const submitForwardTask = async () => {
        if (selectedForwardUsers.length === 0) {
            showToast('Please select at least one user to forward to', 'error');
            return;
        }

        try {
            // selectedForwardUsers contains User IDs now (to handle duplicate emails correctly in UI)
            const selectedIds = selectedForwardUsers;

            // Map IDs to User Objects to get emails
            const selectedUsers = selectedIds.map(id => forwardUsers.find(u => u._id === id)).filter(Boolean);

            if (selectedUsers.length === 0) return;

            // 1. First user gets the ORIGINAL task (Forward)
            // 2. Subsequent users get a CLONE
            const [firstUser, ...otherUsers] = selectedUsers;
            const firstUserEmail = firstUser.email;

            // --- Process First User (Move Original) ---
            const updatedNotes = forwardNote
                ? (forwardingTask.notes ? `${forwardingTask.notes}\n\n[Forwarded]: ${forwardNote}` : `[Forwarded]: ${forwardNote}`)
                : forwardingTask.notes;

            // Updated existing task
            await api.put(`/tasks/${forwardingTask._id}`, {
                assignedToEmail: firstUserEmail,
                assignedToUserId: firstUser._id,
                notes: updatedNotes
            });

            // --- Process Other Users (Create Copies) ---
            if (otherUsers.length > 0) {
                // Prepare common payload
                const basePayload = {
                    task: forwardingTask.task,
                    priority: forwardingTask.priority,
                    dueDate: forwardingTask.dueDate,
                    notes: updatedNotes,
                    isSelfTask: false,
                    taskGivenBy: user.email,
                    taskGivenByName: user.name
                };

                // Create copies for other users
                const createPromises = otherUsers.map(uObj => {
                    return api.post('/tasks', {
                        ...basePayload,
                        assignedToEmail: uObj.email,
                        assignedToUserId: uObj._id,
                        durationType: 'custom',
                        durationValue: 0
                    });
                });

                await Promise.all(createPromises);
            }

            showToast(`Task forwarded to ${selectedUsers.length} users`, 'success');
            setShowForwardModal(false);
            setForwardingTask(null);
            fetchAllTasks();
        } catch (error) {
            console.error('Forward task error:', error);
            showToast(error.response?.data?.error || 'Failed to forward task', 'error');
        }
    };

    const handleEditTask = (task) => {
        setEditingTask(task);

        let assignedToId = task.assignedToEmail;
        if (!task.isSelfTask) {
            const foundUser = users.find(u => u.email === task.assignedToEmail);
            if (foundUser) assignedToId = foundUser._id;
        }

        let taskGivenById = task.taskGivenBy;
        if (task.taskGivenBy) {
            const foundGiver = users.find(u => u.email === task.taskGivenBy);
            if (foundGiver) taskGivenById = foundGiver._id;
        }

        // Populate form data for editing
        setCreateFormData({
            task: task.task,
            assignedToEmail: assignedToId,
            priority: task.priority,
            targetDate: task.dueDate ? dayjs(task.dueDate) : null,
            targetTime: task.dueDate ? dayjs(task.dueDate).format('HH:mm') : '',
            notes: task.notes || '',
            isSelfTask: task.isSelfTask || false,
            taskGivenBy: taskGivenById || '',
        });

        setShowCreateModal(true);
    };

    const handleCreateOrUpdateTask = async () => {
        // ... validation logic ...

        try {
            // Combine date and time
            let finalDueDate = createFormData.targetDate;
            if (createFormData.targetTime) {
                finalDueDate = createFormData.targetDate
                    .hour(createFormData.targetTime.hour())
                    .minute(createFormData.targetTime.minute());
            }

            const payload = {
                task: createFormData.task,
                assignedToEmail: createFormData.assignedToEmail, // This might be email or ID if not resolved yet
                assignedToUserId: createFormData.isSelfTask ? user._id : createFormData.assignedToEmail, // Send ID directly
                priority: createFormData.priority,
                dueDate: finalDueDate ? finalDueDate.toISOString() : undefined,
                notes: createFormData.notes,
                isSelfTask: createFormData.isSelfTask,
                taskGivenBy: createFormData.taskGivenBy
            };

            if (editingTask) {
                const response = await api.put(`/ tasks / ${editingTask._id} `, payload);
                if (response.data.success) {
                    showToast('Task updated successfully', 'success');
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
                    fetchAllTasks();
                }
            } else {
                // ... existing create logic ...
            }
        } catch (error) {
            // ... error handling ...
        }
    };


    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('date'); // date, priority, status
    const [departmentFilter, setDepartmentFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [roleFilter, setRoleFilter] = useState('all');
    const [userFilter, setUserFilter] = useState('all');
    const [departments, setDepartments] = useState([]);
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // Derive available roles dynamically from allUsersList
    const roles = useMemo(() => {
        const uniqueRoles = new Map();
        // Use allUsersList to ensure we capture roles from all potential users, not just assignable ones
        const sourceList = allUsersList.length > 0 ? allUsersList : users;

        sourceList.forEach(u => {
            if (u.role) {
                const roleName = u.role.name || u.role;
                const displayName = u.role.displayName || u.role.name || u.role;
                if (roleName && !uniqueRoles.has(roleName)) {
                    uniqueRoles.set(roleName, displayName);
                }
            }
        });
        return Array.from(uniqueRoles.entries())
            .map(([value, label]) => ({ value, label }))
            .sort((a, b) => a.label.localeCompare(b.label));
    }, [users, allUsersList]);

    // Filter user options based on selected department and role
    const filteredUserOptions = useMemo(() => {
        let filtered = users;

        // Strict User Filter for Department Heads in Department Tasks Tab
        if (userRoleName === 'departmenthead' && viewFilter === 'department-tasks') {
            const myDeptId = user.department?._id || user.department;
            if (myDeptId) {
                filtered = filtered.filter(u => {
                    const uDeptId = u.department?._id || u.department;
                    return uDeptId && String(uDeptId) === String(myDeptId);
                });
            }
        }

        if (departmentFilter !== 'all') {
            filtered = filtered.filter(u => {
                const deptId = u.department?._id || u.department;
                return deptId === departmentFilter;
            });
        }

        if (roleFilter !== 'all') {
            filtered = filtered.filter(u => {
                const roleName = u.role?.name || u.role;
                return roleName === roleFilter;
            });
        }

        // Deduplicate users by email to prevent duplicate entries in dropdown
        const uniqueUsersMap = new Map();
        filtered.forEach(u => {
            if (u.email && !uniqueUsersMap.has(u.email)) {
                const departmentName = u.department?.name || 'No Department';
                const displayText = u.designation || u.role?.displayName || u.role?.name || 'N/A';
                uniqueUsersMap.set(u.email, {
                    value: u.email,
                    label: `${u.name} (${displayText})`,
                    department: departmentName
                });
            }
        });

        return [
            { value: 'all', label: viewFilter === 'department-tasks' ? 'Department Users' : 'All Users' },
            ...Array.from(uniqueUsersMap.values())
                .sort((a, b) => {
                    // Sort by department first, then by name
                    if (a.department !== b.department) {
                        return a.department.localeCompare(b.department);
                    }
                })
        ];
    }, [users, departmentFilter, roleFilter, userRoleName, viewFilter, user.department]);

    // Task Given By options with department grouping (excludes current user)
    // Uses allUsersList to show ALL users regardless of role restrictions
    const taskGivenByOptions = useMemo(() => {
        const usersList = allUsersList.filter(u => u.email !== user.email);

        // Group users by department
        const usersWithDept = usersList.map(u => ({
            ...u,
            departmentName: u.department?.name || 'No Department'
        }));

        // Sort by department first, then by name
        usersWithDept.sort((a, b) => {
            if (a.departmentName !== b.departmentName) {
                return a.departmentName.localeCompare(b.departmentName);
            }
            return a.name.localeCompare(b.name);
        });

        return usersWithDept;
    }, [allUsersList, user.email]);

    // Assignable users with department grouping
    const assignableUsersGrouped = useMemo(() => {
        // Group users by department
        const usersWithDept = assignableUsers.map(u => ({
            ...u,
            departmentName: u.department?.name || 'No Department'
        }));

        // Sort by department first, then by name
        usersWithDept.sort((a, b) => {
            if (a.departmentName !== b.departmentName) {
                return a.departmentName.localeCompare(b.departmentName);
            }
            return a.name.localeCompare(b.name);
        });

        return usersWithDept;
    }, [assignableUsers]);

    // Reset user filter if selected user is not in the filtered options
    useEffect(() => {
        if (userFilter !== 'all') {
            const isUserValid = filteredUserOptions.some(opt => opt.value === userFilter);
            if (!isUserValid) {
                setUserFilter('all');
            }
        }
    }, [filteredUserOptions, userFilter]);

    useEffect(() => {
        fetchAllTasks();
        fetchUsers();
        fetchAllUsersForGivenBy();
        fetchDepartments();
    }, []);

    const fetchAllTasks = async () => {
        try {
            setLoading(true);

            // Optimized: Fetch all relevant tasks in one call
            // The backend /tasks/all endpoint now handles all RBAC scenarios correctly
            const response = await api.get('/tasks/all');
            const allFetchedTasks = response.data.tasks || [];

            // Filter tasks into categories client-side to avoid multiple API calls
            // Filter tasks into categories client-side to avoid multiple API calls
            const assignedToMe = allFetchedTasks.filter(task => {
                const assignedToId = task.assignedTo?._id || task.assignedTo;
                const createdById = task.createdBy?._id || task.createdBy;
                const currentUserId = user?.id || user?._id;

                return String(assignedToId) === String(currentUserId) && String(createdById) !== String(currentUserId);
            });

            const iAssigned = allFetchedTasks.filter(task => {
                const assignedToId = task.assignedTo?._id || task.assignedTo;
                const createdById = task.createdBy?._id || task.createdBy;
                const currentUserId = user?.id || user?._id;

                return String(createdById) === String(currentUserId) && String(assignedToId) !== String(currentUserId);
            });

            const selfTasks = allFetchedTasks.filter(task => {
                const assignedToId = task.assignedTo?._id || task.assignedTo;
                const createdById = task.createdBy?._id || task.createdBy;
                const currentUserId = user?.id || user?._id;

                return task.isSelfTask && String(createdById) === String(currentUserId) && String(assignedToId) === String(currentUserId);
            });

            // Filter tasks I forwarded
            // Logic: isForwarded is true AND forwardedBy matches my ID (or email)
            const forwardedByMe = allFetchedTasks.filter(task => {
                const currentUserId = user?.id || user?._id;
                const forwardedById = task.forwardedBy?._id || task.forwardedBy;

                return task.isForwarded && (
                    task.forwardedByEmail === user?.email ||
                    String(forwardedById) === String(currentUserId)
                );
            });

            setAllTasks({
                assignedToMe,
                iAssigned,
                selfTasks,
                forwardedByMe,
                allDeptTasks: allFetchedTasks, // This serves as the source for 'all-tasks' and 'department-tasks' views
            });
        } catch (error) {
            console.error('Error fetching tasks:', error);
            showToast('Failed to load tasks', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (taskId, newStatus) => {
        // Show confirmation dialog
        AntModal.confirm({
            title: 'Confirm Status Change',
            content: `Are you sure you want to change the task status to "${newStatus}" ? `,
            okText: 'Yes, Change Status',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    const response = await api.patch(`/tasks/${taskId}/status`, {
                        status: newStatus
                    });

                    if (response.data.success) {
                        showToast('Task status updated', 'success');
                        fetchAllTasks();

                        // Update selected task if it's the one being changed
                        if (selectedTask?._id === taskId) {
                            setSelectedTask(response.data.task);
                        }
                    }
                } catch (error) {
                    console.error('Error updating task status:', error);
                    showToast(error.response?.data?.error || 'Failed to update task status', 'error');
                }
            },
        });
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
                const updatedTask = response.data.task;
                setSelectedTask(updatedTask);
                setNewComment('');
                showToast('Comment added', 'success');

                // Update local tasks state
                setAllTasks(prev => {
                    const updateList = (list) => (list || []).map(t => t._id === updatedTask._id ? updatedTask : t);
                    return {
                        assignedToMe: updateList(prev.assignedToMe),
                        iAssigned: updateList(prev.iAssigned),
                        selfTasks: updateList(prev.selfTasks),
                        forwardedByMe: updateList(prev.forwardedByMe), // Make sure forwarded tasks are updated too
                        allDeptTasks: updateList(prev.allDeptTasks)
                    };
                });
            }
        } catch (error) {
            console.error('Error adding comment:', error);
            showToast('Failed to add comment', 'error');
        }
    };

    const fetchUsers = async () => {
        try {
            let fetchedUsers = [];

            // Always use the task-specific endpoint to ensure correct assignment logic
            // This ensures Department Heads and others see the correct list of assignable users
            const response = await api.get('/users/for-tasks');
            fetchedUsers = response.data.users || [];
            setUsers(fetchedUsers);


            // 2. Filter assignable users based on Role (Frontend Mirror of Backend Logic)
            // This ensures we show the correct options even if the specific backend endpoint misses some
            const currentUserRole = (user?.role?.name || user?.role || '').toLowerCase().replace(/\s+/g, '');
            let validAssignees = fetchedUsers;

            // Logic matching TaskController.js restrictions
            // Main Director can assign to ALL users
            if (currentUserRole === 'maindirector') {
                validAssignees = fetchedUsers;
            }
            // Directors -> GMs and Dept Heads
            else if (currentUserRole === 'director' || currentUserRole === 'director2' || user?.name?.includes('Vasanth') || user?.name?.includes('Guna') || user?.name?.includes('Sathish')) {
                validAssignees = fetchedUsers.filter(u => {
                    const r = (u.role?.name || u.role || '').toLowerCase().replace(/\s+/g, '');
                    return ['generalmanager', 'manager', 'departmenthead'].includes(r);
                });
            }
            else if (currentUserRole === 'generalmanager') {
                // GMs -> Dept Heads, PMs, Standalone
                validAssignees = fetchedUsers.filter(u => {
                    const r = (u.role?.name || u.role || '').toLowerCase().replace(/\s+/g, '');
                    return ['manager', 'departmenthead', 'projectmanager', 'standalone', 'standalonerole', 'projectmanagerandstandalone'].includes(r);
                });
            }
            else if (currentUserRole === 'manager' || currentUserRole === 'departmenthead') {
                // Return all users provided by the backend. 
                // The backend handles the filtering logic (Own Dept + Other Dept Heads/PMs/Standalone).
                validAssignees = fetchedUsers;
            }
            else if (['staff', 'projectmanager', 'standalone', 'standalonerole', 'projectmanagerandstandalone'].includes(currentUserRole)) {
                validAssignees = fetchedUsers;
            }

            setAssignableUsers(validAssignees);


        } catch (error) {
            console.error('Error fetching users:', error);
            // Fallback
            if (users.length > 0) setAssignableUsers(users);
        }
    };

    const fetchAllUsersForGivenBy = async () => {
        try {
            // Fetch all users without role-based filtering for "Task Given By" dropdown
            const response = await api.get('/users/list');
            setAllUsersList(response.data.users || []);
        } catch (error) {
            console.error('Error fetching all users for Task Given By:', error);
            // Fallback to using the filtered users list
            setAllUsersList(users);
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

    const handleSubmitTask = async () => {
        // e.preventDefault() is not needed directly with Ant Design Form onFinish

        if (!createFormData.task.trim()) {
            showToast('Task is required', 'error');
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
            // Reconstruct Date object from components
            // handle both string (from input) and dayjs object (from picker/edit preload)
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

            // IDs are already in createFormData.assignedToEmail, sending checking logic for email just in case
            let finalAssignedToEmail = createFormData.assignedToEmail;
            let finalAssignedToUserId = null;

            if (createFormData.isSelfTask) {
                finalAssignedToUserId = user._id;
                finalAssignedToEmail = user.email;
            } else {
                finalAssignedToUserId = createFormData.assignedToEmail; // Raw ID
                const u = users.find(u => u._id === createFormData.assignedToEmail);
                if (u) finalAssignedToEmail = u.email;
            }

            let finalTaskGivenBy = createFormData.taskGivenBy;
            let finalTaskGivenByUserId = null;
            if (createFormData.taskGivenBy) {
                finalTaskGivenByUserId = createFormData.taskGivenBy; // Raw ID
                const u = users.find(u => u._id === createFormData.taskGivenBy);
                if (u) finalTaskGivenBy = u.email;
            }

            const payload = {
                task: createFormData.task,
                assignedToEmail: finalAssignedToEmail,
                assignedToUserId: finalAssignedToUserId,
                priority: createFormData.priority,
                notes: createFormData.notes,
                isSelfTask: createFormData.isSelfTask,
                taskGivenBy: finalTaskGivenBy,
                taskGivenByUserId: finalTaskGivenByUserId,
            };

            let response;
            if (editingTask) {
                // Update specific payload
                response = await api.put(`/tasks/${editingTask._id}`, {
                    ...payload,
                    dueDate: dueDate.toISOString() // Update endpoint expects strict date if changing
                });
            } else {
                // Create specific payload (uses duration)
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
                fetchAllTasks();
            }
        } catch (error) {
            console.error('Task save error:', error);
            showToast(error.response?.data?.error || 'Failed to save task', 'error');
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
                // For users with viewAllTasks permission, show all tasks
                // Backend returns all tasks when user has viewAllTasks
                return allTasks.allDeptTasks || [];
            case 'department-tasks':
                // For users with viewDepartmentTasks permission, show department tasks
                // Backend returns department-filtered tasks when user has viewDepartmentTasks
                return allTasks.allDeptTasks || [];
            case 'forwarded-tasks':
                return allTasks.forwardedByMe || [];
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
        if (statusFilter === 'waiting-for-approval') return task.status === TASK_STATUS.WAITING_FOR_APPROVAL;
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
    // Filter by department
    const departmentFilteredTasks = searchedTasks.filter(task => {
        // Strict department filtering for Department Head ONLY in Department Tasks tab
        if (userRoleName === 'departmenthead' && viewFilter === 'department-tasks') {
            // Find assignee details
            const assignedUser = users.find(u => u.email === task.assignedToEmail);

            // Always include tasks assigned to self if they appear in this list (safety check)
            if (task.assignedToEmail === user?.email) return true;

            // Get IDs safely
            const myDeptId = user.department?._id || user.department;
            const userDeptId = assignedUser?.department?._id || assignedUser?.department;

            // Match department ID strictly
            return myDeptId && userDeptId && String(myDeptId) === String(userDeptId);
        }

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
    const sortedTasks = useMemo(() => {
        let sorted = [...userFilteredTasks];
        switch (sortBy) {
            case 'date':
                sorted.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
                break;
            case 'newest':
                sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'oldest':
                sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            case 'priority':
                const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
                sorted.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
                break;
            case 'status':
                const statusOrder = { 'Pending': 1, 'In Progress': 2, 'Completed': 3 };
                sorted.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
                break;
            default:
                break;
        }
        return sorted;
    }, [userFilteredTasks, sortBy]);

    // Get user permissions for tab visibility
    const canViewAllTasks = user?.permissions?.viewAllTasks;
    const canViewDeptTasks = user?.permissions?.viewDepartmentTasks;
    const showAllTasksTab = canViewAllTasks || canViewDeptTasks;

    // Detailed granular permissions (default to true for backward compatibility if undefined)
    const canViewAssignedToMe = user?.permissions?.viewAssignedToMeTasks !== false;
    const canViewIAssigned = user?.permissions?.viewIAssignedTasks !== false;
    const canViewSelfTasks = user?.permissions?.viewSelfTasks !== false;
    const canViewForwardedTasks = ['departmenthead', 'manager'].includes(userRoleName);

    // Determine initial view filter based on permissions
    useEffect(() => {
        // If current filter is not allowed, switch to first allowed filter
        const isCurrentAllowed =
            (viewFilter === 'assigned-to-me' && canViewAssignedToMe) ||
            (viewFilter === 'i-assigned' && canViewIAssigned) ||
            (viewFilter === 'self-tasks' && canViewSelfTasks) ||
            (viewFilter === 'all-tasks' && canViewAllTasks) ||
            (viewFilter === 'department-tasks' && canViewDeptTasks) ||
            (viewFilter === 'forwarded-tasks' && canViewForwardedTasks);

        if (!isCurrentAllowed) {
            if (canViewAssignedToMe) setViewFilter('assigned-to-me');
            else if (canViewIAssigned) setViewFilter('i-assigned');
            else if (canViewSelfTasks) setViewFilter('self-tasks');
            else if (canViewAllTasks) setViewFilter('all-tasks');
            else if (canViewDeptTasks) setViewFilter('department-tasks');
            else if (canViewForwardedTasks) setViewFilter('forwarded-tasks');
        }
    }, [user, viewFilter, canViewAssignedToMe, canViewIAssigned, canViewSelfTasks, canViewAllTasks, canViewDeptTasks, canViewForwardedTasks]);

    // Check create permission
    const canCreateTask = user?.permissions?.createTasks !== false; // Default true if undefined

    const stats = {
        assignedToMe: allTasks.assignedToMe?.length || 0,
        iAssigned: allTasks.iAssigned?.length || 0,
        selfTasks: allTasks.selfTasks?.length || 0,
        allDeptTasks: allTasks.allDeptTasks?.length || 0,
        total: allTasks.allDeptTasks?.length || 0,
    };

    if (loading) {
        const statCardCount =
            1 +
            (canViewAssignedToMe ? 1 : 0) +
            (canViewIAssigned ? 1 : 0) +
            (canViewSelfTasks ? 1 : 0);

        const viewTabCount =
            (canViewAssignedToMe ? 1 : 0) +
            (canViewIAssigned ? 1 : 0) +
            (canViewSelfTasks ? 1 : 0) +
            (canViewAllTasks ? 1 : 0) +
            (canViewDeptTasks ? 1 : 0);

        return (
            <AllTasksSkeleton
                canCreateTask={canCreateTask}
                statCardCount={Math.max(1, statCardCount)}
                viewTabCount={Math.max(2, viewTabCount)}
                pageSize={pageSize}
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-[#253094]">All Tasks</h1>
                    <p className="text-gray-500 mt-1 font-medium">Manage and track all your team's tasks in one place</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    {canCreateTask && (
                        <Button
                            type="primary"
                            onClick={() => setShowCreateModal(true)}
                            className="bg-primary hover:bg-primary-600 flex items-center justify-center gap-2 h-11 px-6 w-full md:w-auto rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
                            icon={<Plus className="w-5 h-5" />}
                        >
                            Create New Task
                        </Button>
                    )}
                </div>
            </div>

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

            <Modal
                isOpen={showForwardModal}
                onClose={() => setShowForwardModal(false)}
                title="Forward Task"
                size="small"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Forward To <span className="text-red-500">*</span>
                        </label>
                        <Select
                            className="w-full"
                            mode="multiple"
                            placeholder="Select staff members"
                            value={selectedForwardUsers}
                            onChange={setSelectedForwardUsers}
                            showSearch
                            optionFilterProp="children"
                            maxTagCount="responsive"
                        >
                            {forwardUsers.map(u => (
                                <Select.Option key={u._id} value={u._id}>
                                    {u.name} ({u.designation || 'Staff'})
                                </Select.Option>
                            ))}
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Note (Optional)
                        </label>
                        <Input.TextArea
                            rows={3}
                            placeholder="Add a reason for forwarding..."
                            value={forwardNote}
                            onChange={(e) => setForwardNote(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                        <Button onClick={() => setShowForwardModal(false)}>Cancel</Button>
                        <Button type="primary" onClick={submitForwardTask} className="bg-primary hover:bg-primary-600">
                            Forward Task
                        </Button>
                    </div>
                </div>
            </Modal>



            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Tasks"
                    value={stats.total.toString()}
                    subtitle="All time tasks"
                    icon={LayoutGrid}
                    iconBg="bg-indigo-50"
                    iconColor="text-indigo-600"
                />

                {canViewAssignedToMe && (
                    <StatCard
                        title="My Works"
                        value={stats.assignedToMe.toString()}
                        subtitle="Assigned to you"
                        icon={Briefcase}
                        iconBg="bg-blue-50"
                        iconColor="text-blue-600"
                    />
                )}

                {canViewIAssigned && (
                    <StatCard
                        title="I Assigned"
                        value={stats.iAssigned.toString()}
                        subtitle="Delegated tasks"
                        icon={Send}
                        iconBg="bg-purple-50"
                        iconColor="text-purple-600"
                    />
                )}

                {canViewSelfTasks && (
                    <StatCard
                        title="Self Tasks"
                        value={stats.selfTasks.toString()}
                        subtitle="Personal tasks"
                        icon={Target}
                        iconBg="bg-green-50"
                        iconColor="text-[#2D9E36]"
                    />
                )}
            </div>
            <div className='relative'>
                {/* View Filter Tabs */}
                {/* View Filter Tabs & Search */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                    <div className="flex flex-col gap-5">
                        {/* Top Row: Task Type Tabs */}
                        <div className="flex flex-wrap gap-3 overflow-x-auto nice-scrollbar pb-1">
                            {canViewAssignedToMe && (
                                <button
                                    onClick={() => setViewFilter('assigned-to-me')}
                                    className={`px-5 py-2.5 rounded-xl cursor-pointer font-semibold text-sm transition-all duration-300 ease-out whitespace-nowrap shrink-0 flex items-center gap-2 ${viewFilter === 'assigned-to-me'
                                        ? 'bg-[#253094] text-white'
                                        : 'bg-gray-50 text-gray-600 hover:bg-[#253094]/20 hover:text-[#253094]'
                                        }`}
                                >
                                    <Briefcase className="w-4 h-4" />
                                    My Works
                                </button>
                            )}
                            {canViewIAssigned && (
                                <button
                                    onClick={() => setViewFilter('i-assigned')}
                                    className={`px-5 py-2.5 rounded-xl cursor-pointer font-semibold text-sm transition-all duration-300 ease-out whitespace-nowrap shrink-0 flex items-center gap-2 ${viewFilter === 'i-assigned'
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-gray-50 text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                                        }`}
                                >
                                    <Send className="w-4 h-4" />
                                    I Assigned
                                </button>
                            )}
                            {canViewSelfTasks && (
                                <button
                                    onClick={() => setViewFilter('self-tasks')}
                                    className={`px-5 py-2.5 rounded-xl cursor-pointer font-semibold text-sm transition-all duration-300 ease-out whitespace-nowrap shrink-0 flex items-center gap-2 ${viewFilter === 'self-tasks'
                                        ? 'bg-[#2D9E36] text-white'
                                        : 'bg-gray-50 text-gray-600 hover:bg-green-50 hover:text-[#2D9E36]'
                                        }`}
                                >
                                    <Target className="w-4 h-4" />
                                    Self Tasks
                                </button>
                            )}
                            {canViewAllTasks && (
                                <button
                                    onClick={() => setViewFilter('all-tasks')}
                                    className={`px-5 py-2.5 rounded-xl cursor-pointer font-semibold text-sm transition-all duration-300 ease-out whitespace-nowrap shrink-0 flex items-center gap-2 ${viewFilter === 'all-tasks'
                                        ? 'bg-orange-500 text-white'
                                        : 'bg-gray-50 text-gray-600 hover:bg-orange-50 hover:text-orange-500'
                                        }`}

                                >
                                    <ListTodo className="w-4 h-4" />
                                    All Tasks
                                </button>
                            )}
                            {canViewDeptTasks && (
                                <button
                                    onClick={() => setViewFilter('department-tasks')}
                                    className={`px-5 py-2.5 rounded-xl cursor-pointer font-semibold text-sm transition-all duration-300 ease-out whitespace-nowrap shrink-0 flex items-center gap-2 ${viewFilter === 'department-tasks'
                                        ? 'bg-teal-500 text-white'
                                        : 'bg-gray-50 text-gray-600 hover:bg-teal-50 hover:text-teal-500'
                                        }`}
                                >
                                    <Users className="w-4 h-4" />
                                    Department Tasks
                                </button>
                            )}
                            {/* Forwarded Tasks Tab - Only for Dept Head/Manager */}
                            {/* Forwarded Tasks Tab - Only for Dept Head/Manager */}
                            {['departmenthead', 'manager'].includes((user?.role?.name || user?.role || '').toLowerCase().replace(/\s+/g, '')) && (
                                <button
                                    onClick={() => setViewFilter('forwarded-tasks')}
                                    className={`px-5 py-2.5 rounded-xl cursor-pointer font-semibold text-sm transition-all duration-300 ease-out whitespace-nowrap shrink-0 flex items-center gap-2 ${viewFilter === 'forwarded-tasks'
                                        ? 'bg-purple-500 text-white'
                                        : 'bg-gray-50 text-gray-600 hover:bg-purple-50 hover:text-purple-500'
                                        }`}
                                >
                                    <CornerUpRight className="w-4 h-4" />
                                    Forwarded Tasks
                                </button>
                            )}
                        </div>

                        {/* Bottom Row: Status Filters */}
                        <div className="flex flex-wrap gap-2 overflow-x-auto nice-scrollbar">
                            <button
                                onClick={() => setStatusFilter('all')}
                                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap shrink-0 ${statusFilter === 'all'
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                All Status
                            </button>
                            <button
                                onClick={() => setStatusFilter('pending')}
                                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap shrink-0 flex items-center gap-2 ${statusFilter === 'pending'
                                    ? 'bg-red-50 text-red-600 border border-red-200'
                                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <span className={`w-2 h-2 rounded-full bg-red-500 ${statusFilter === 'pending' ? 'animate-pulse' : ''}`}></span>
                                Pending
                            </button>
                            <button
                                onClick={() => setStatusFilter('in-progress')}
                                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap shrink-0 flex items-center gap-2 ${statusFilter === 'in-progress'
                                    ? 'bg-yellow-50 text-yellow-600 border border-yellow-200'
                                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <span className={`w-2 h-2 rounded-full bg-yellow-500 ${statusFilter === 'in-progress' ? 'animate-pulse' : ''}`}></span>
                                In Progress
                            </button>
                            <button
                                onClick={() => setStatusFilter('waiting-for-approval')}
                                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap shrink-0 flex items-center gap-2 ${statusFilter === 'waiting-for-approval'
                                    ? 'bg-blue-50 text-blue-600 border border-blue-200'
                                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <span className={`w-2 h-2 rounded-full bg-blue-500 ${statusFilter === 'waiting-for-approval' ? 'animate-pulse' : ''}`}></span>
                                Waiting Approval
                            </button>
                            <button
                                onClick={() => setStatusFilter('completed')}
                                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap shrink-0 flex items-center gap-2 ${statusFilter === 'completed'
                                    ? 'bg-[#2D9E36] text-white shadow-md'
                                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Completed
                            </button>
                        </div>
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
                    {/* Show filters permissions based */}
                    {(() => {
                        // Get tab-specific filter permissions
                        const getFilterPermissions = () => {
                            let perms = { department: false, priority: false, role: false, user: false };

                            switch (viewFilter) {
                                case 'all-tasks':
                                    perms = {
                                        department: user?.permissions?.filterAllTasksDepartment,
                                        priority: user?.permissions?.filterAllTasksPriority,
                                        role: user?.permissions?.filterAllTasksRole,
                                        user: user?.permissions?.filterAllTasksUser,
                                    };
                                    break;
                                case 'department-tasks':
                                    perms = {
                                        department: user?.permissions?.filterDeptTasksDepartment,
                                        priority: user?.permissions?.filterDeptTasksPriority,
                                        role: user?.permissions?.filterDeptTasksRole,
                                        user: user?.permissions?.filterDeptTasksUser,
                                    };
                                    break;
                                case 'assigned-to-me':
                                    perms = {
                                        department: false,
                                        priority: user?.permissions?.filterAssignedToMePriority,
                                        role: user?.permissions?.filterAssignedToMeRole,
                                        user: false,
                                    };
                                    break;
                                case 'i-assigned':
                                    perms = {
                                        department: user?.permissions?.filterIAssignedDepartment,
                                        priority: user?.permissions?.filterIAssignedPriority,
                                        role: user?.permissions?.filterIAssignedRole,
                                        user: true,
                                    };
                                    break;
                                case 'self-tasks':
                                    perms = {
                                        department: user?.permissions?.filterSelfTasksDepartment,
                                        priority: user?.permissions?.filterSelfTasksPriority,
                                        role: user?.permissions?.filterSelfTasksRole,
                                        user: user?.permissions?.filterSelfTasksUser,
                                    };
                                    break;
                                case 'forwarded-tasks':
                                    perms = {
                                        department: false,
                                        priority: true,
                                        role: true,
                                        user: true,
                                    };
                                    break;
                                default:
                                    perms = { department: false, priority: false, role: false, user: false };
                            }

                            // Override: Department Heads should not see Department or Role filters
                            if (userRoleName === 'departmenthead') {
                                perms.department = false;
                                perms.role = false;
                            }

                            return perms;
                        };

                        const filterPerms = getFilterPermissions();

                        return (
                            <div className="mt-6 flex flex-col gap-4">
                                <div className="h-px bg-gray-100 w-full" />

                                {/* Search and Filters Row */}
                                <div className="flex flex-col md:flex-row items-center gap-4">
                                    {/* Search Bar */}
                                    <div className="w-full md:flex-1 relative group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-[#253094] transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="Search tasks..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full h-11 pl-12 pr-4 bg-gray-50 border-none rounded-xl text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-[#253094]/10 transition-all outline-none"
                                        />
                                    </div>

                                    {/* Filters Group */}
                                    <div className="w-full md:w-auto flex flex-wrap items-center gap-3">
                                        <div className="hidden md:flex items-center gap-2 mr-1">
                                            <Filter className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm font-medium text-gray-500">Filters:</span>
                                        </div>

                                        {/* Sort Filter */}
                                        <div className="w-full md:w-auto">
                                            <Select
                                                value={sortBy}
                                                onChange={(value) => setSortBy(value)}
                                                className="w-full md:w-40"
                                                options={[
                                                    { value: 'newest', label: 'Newest First' },
                                                    { value: 'oldest', label: 'Oldest First' },
                                                    { value: 'date', label: 'Sort by Due Date' },
                                                    { value: 'priority', label: 'Sort by Priority' },
                                                    { value: 'status', label: 'Sort by Status' }
                                                ]}
                                            />
                                        </div>

                                        {/* Department Filter */}
                                        {filterPerms.department && (
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
                                        )}

                                        {/* Priority Filter */}
                                        {filterPerms.priority && (
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
                                        )}

                                        {/* Role Filter */}
                                        {filterPerms.role && (
                                            <div className="w-full md:w-auto">
                                                <Select
                                                    value={roleFilter}
                                                    onChange={(value) => setRoleFilter(value)}
                                                    className="w-full md:w-36"
                                                    options={[
                                                        { value: 'all', label: 'All Roles' },
                                                        ...roles
                                                    ]}
                                                />
                                            </div>
                                        )}

                                        {/* User Filter */}
                                        {/* User Filter */}
                                        {(filterPerms.user || viewFilter === 'department-tasks') && (
                                            <div className="w-full md:w-auto">
                                                <Select
                                                    value={userFilter}
                                                    onChange={(value) => setUserFilter(value)}
                                                    className="w-full md:w-56"
                                                    showSearch
                                                    placeholder={viewFilter === 'department-tasks' ? "Department Users" : "Search User"}
                                                    optionFilterProp="label"
                                                    filterOption={(input, option) => {
                                                        if (option?.value === 'all') return true;
                                                        const searchText = input.toLowerCase();
                                                        return (
                                                            (option?.label ?? '').toLowerCase().includes(searchText) ||
                                                            (option?.department ?? '').toLowerCase().includes(searchText)
                                                        );
                                                    }}
                                                >
                                                    {(() => {
                                                        const options = [];
                                                        let lastDepartment = null;

                                                        filteredUserOptions.forEach((option, index) => {
                                                            if (option.value === 'all') {
                                                                options.push(
                                                                    <Select.Option key="all" value="all">
                                                                        {option.label}
                                                                    </Select.Option>
                                                                );
                                                            } else {
                                                                // Add department header if it's a new department
                                                                if (option.department !== lastDepartment) {
                                                                    options.push(
                                                                        <Select.Option
                                                                            key={`dept-${option.department}-${index}`}
                                                                            value={`dept-header-${index}`}
                                                                            disabled
                                                                            className="!bg-gray-100 !cursor-default"
                                                                        >
                                                                            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                                                                {option.department}
                                                                            </div>
                                                                        </Select.Option>
                                                                    );
                                                                    lastDepartment = option.department;
                                                                }

                                                                // Add user option
                                                                options.push(
                                                                    <Select.Option
                                                                        key={option.value}
                                                                        value={option.value}
                                                                        label={option.label}
                                                                        department={option.department}
                                                                    >
                                                                        <div className="pl-2">
                                                                            {option.label}
                                                                        </div>
                                                                    </Select.Option>
                                                                );
                                                            }
                                                        });

                                                        return options;
                                                    })()}
                                                </Select>
                                            </div>
                                        )}

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
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* Task List */}
            {sortedTasks.length === 0 ? (
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
                <>
                    <div className="grid grid-cols-1 pt-0 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sortedTasks
                            .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                            .map(task => {
                                // Helper to safely get string ID
                                const getId = (obj) => {
                                    if (!obj) return '';
                                    return typeof obj === 'object' ? obj._id?.toString() : obj.toString();
                                };
                                const userId = user._id?.toString();
                                const userEmail = user.email;
                                const canEditStatus = task.assignedToEmail === userEmail;
                                const isCreator = getId(task.createdBy) === userId;
                                const userRoleName = (user?.role?.name || user?.role || '').toLowerCase().replace(/\s+/g, '');
                                const isDirectorRole = ['director', 'maindirector', 'generalmanager'].includes(userRoleName);

                                const canEditDetails =
                                    viewFilter !== 'assigned-to-me' &&
                                    ((!isDirectorRole && user.permissions.editAllTasks) ||
                                        (isCreator && user.permissions.editOwnTasks));
                                const canDeleteTask =
                                    viewFilter !== 'assigned-to-me' &&
                                    ((!isDirectorRole && user.permissions.deleteAllTasks) ||
                                        (isCreator && user.permissions.deleteOwnTasks));

                                const canForward =
                                    (['departmenthead', 'manager'].includes(userRoleName) && task.assignedToEmail === user.email);

                                return (
                                    <TaskCard
                                        key={task._id}
                                        task={task}
                                        onStatusChange={handleStatusChange}
                                        onView={handleViewTask}
                                        onEdit={canEditDetails ? handleEditTask : undefined}
                                        onDelete={canDeleteTask ? handleDeleteTask : undefined}
                                        onForward={canForward ? handleForwardTask : undefined}
                                        showActions={true}
                                        canEdit={canEditStatus}
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
            )
            }

            {/* Task Detail Modal */}
            {
                selectedTask && (
                    <Modal
                        isOpen={showDetailModal}
                        onClose={() => {
                            setShowDetailModal(false);
                            setSelectedTask(null);
                        }}
                        title={`Task ID: ${selectedTask.sno}`}
                    >
                        <div className="space-y-4">


                            {/* Comments Section */}
                            <div className=" pt-4">

                                <div className="flex gap-2">
                                    <Input.TextArea
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Add a note..."
                                        autoSize={{ minRows: 2, maxRows: 4 }}
                                        className="flex-1"
                                    />

                                </div>
                                <div className='w-full pt-5 text-right'>
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
                )
            }

            {/* Create Task Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => {
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
                }}
                title={editingTask ? "Edit Task" : "Create New Task"}
            >
                <Form layout="vertical" onFinish={handleSubmitTask} className="mt-4">
                    <Form.Item
                        label={<span className="font-medium text-gray-700">Task </span>}
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
                            label={<span className="font-medium text-gray-700">Assign To </span>}
                            required
                        >
                            <Select
                                value={createFormData.assignedToEmail || undefined}
                                onChange={(value) => setCreateFormData({ ...createFormData, assignedToEmail: value })}
                                placeholder="Select a user"
                                size="large"
                                showSearch
                                optionFilterProp="label"
                                filterOption={(input, option) => {
                                    const searchText = input.toLowerCase();
                                    return (
                                        (option?.label ?? '').toLowerCase().includes(searchText) ||
                                        (option?.department ?? '').toLowerCase().includes(searchText)
                                    );
                                }}
                            >
                                {(() => {
                                    const options = [];
                                    let lastDepartment = null;

                                    assignableUsersGrouped.forEach((u, index) => {
                                        // Add department header if it's a new department
                                        if (u.departmentName !== lastDepartment) {
                                            options.push(
                                                <Select.Option
                                                    key={`dept-${u.departmentName}-${index}`}
                                                    value={`dept-header-${index}`}
                                                    disabled
                                                    className="!bg-gray-100 !cursor-default"
                                                >
                                                    <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                                        {u.departmentName}
                                                    </div>
                                                </Select.Option>
                                            );
                                            lastDepartment = u.departmentName;
                                        }

                                        // Add user option
                                        options.push(
                                            <Select.Option
                                                key={u._id}
                                                value={u._id}
                                                label={`${u.name} (${u.designation || u.role?.displayName})`}
                                                department={u.departmentName}
                                            >
                                                <div className="pl-2">
                                                    {u.name} ({u.designation || u.role?.displayName})
                                                </div>
                                            </Select.Option>
                                        );
                                    });

                                    return options;
                                })()}
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
                                    Assigned to: <span className="font-semibold">{user.name}</span> ({user.designation || user.role?.displayName})
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
                                    optionFilterProp="label"
                                    allowClear
                                    filterOption={(input, option) => {
                                        const searchText = input.toLowerCase();
                                        return (
                                            (option?.label ?? '').toLowerCase().includes(searchText) ||
                                            (option?.department ?? '').toLowerCase().includes(searchText)
                                        );
                                    }}
                                >
                                    {(() => {
                                        const options = [];
                                        let lastDepartment = null;

                                        taskGivenByOptions.forEach((u, index) => {
                                            // Add department header if it's a new department
                                            if (u.departmentName !== lastDepartment) {
                                                options.push(
                                                    <Select.Option
                                                        key={`dept-${u.departmentName}-${index}`}
                                                        value={`dept-header-${index}`}
                                                        disabled
                                                        className="!bg-gray-100 !cursor-default"
                                                    >
                                                        <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                                            {u.departmentName}
                                                        </div>
                                                    </Select.Option>
                                                );
                                                lastDepartment = u.departmentName;
                                            }

                                            // Add user option
                                            options.push(
                                                <Select.Option
                                                    key={u._id}
                                                    value={u._id}
                                                    label={`${u.name} (${u.designation || u.role?.displayName})`}
                                                    department={u.departmentName}
                                                >
                                                    <div className="pl-2">
                                                        {u.name} ({u.designation || u.role?.displayName})
                                                    </div>
                                                </Select.Option>
                                            );
                                        });

                                        return options;
                                    })()}
                                </Select>
                            </Form.Item>
                        </div>
                    )}

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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                    <div className="flex gap-3 pt-2">
                        <Button
                            size="large"
                            onClick={() => setShowCreateModal(false)}
                            className="flex-1 cancel-btn"
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

            {/* Mobile Filter Modal */}
            <Modal
                isOpen={showMobileFilters}
                onClose={() => setShowMobileFilters(false)}
                title="Filters & Search"
            >
                {(() => {
                    // Get tab-specific filter permissions
                    const getFilterPermissions = () => {
                        let perms = { department: false, priority: false, role: false, user: false };

                        switch (viewFilter) {
                            case 'all-tasks':
                                perms = {
                                    department: user?.permissions?.filterAllTasksDepartment,
                                    priority: user?.permissions?.filterAllTasksPriority,
                                    role: user?.permissions?.filterAllTasksRole,
                                    user: user?.permissions?.filterAllTasksUser,
                                };
                                break;
                            case 'department-tasks':
                                perms = {
                                    department: user?.permissions?.filterDeptTasksDepartment,
                                    priority: user?.permissions?.filterDeptTasksPriority,
                                    role: user?.permissions?.filterDeptTasksRole,
                                    user: user?.permissions?.filterDeptTasksUser,
                                };
                                break;
                            case 'assigned-to-me':
                                perms = {
                                    department: false,
                                    priority: user?.permissions?.filterAssignedToMePriority,
                                    role: user?.permissions?.filterAssignedToMeRole,
                                    user: false,
                                };
                                break;
                            case 'i-assigned':
                                perms = {
                                    department: user?.permissions?.filterIAssignedDepartment,
                                    priority: user?.permissions?.filterIAssignedPriority,
                                    role: user?.permissions?.filterIAssignedRole,
                                    user: true,
                                };
                                break;
                            case 'self-tasks':
                                perms = {
                                    department: user?.permissions?.filterSelfTasksDepartment,
                                    priority: user?.permissions?.filterSelfTasksPriority,
                                    role: user?.permissions?.filterSelfTasksRole,
                                    user: user?.permissions?.filterSelfTasksUser,
                                };
                                break;
                            default:
                                perms = { department: false, priority: false, role: false, user: false };
                        }

                        // Override: Department Heads should not see Department or Role filters
                        if (userRoleName === 'departmenthead') {
                            perms.department = false;
                            perms.role = false;
                        }

                        return perms;
                    };

                    const filterPerms = getFilterPermissions();

                    return (
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

                            {/* Sort Filter */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-2 block">Sort By</label>
                                <Select
                                    value={sortBy}
                                    onChange={(value) => setSortBy(value)}
                                    className="w-full"
                                    size="large"
                                    options={[
                                        { value: 'newest', label: 'Newest First' },
                                        { value: 'oldest', label: 'Oldest First' },
                                        { value: 'date', label: 'Sort by Due Date' },
                                        { value: 'priority', label: 'Sort by Priority' },
                                        { value: 'status', label: 'Sort by Status' }
                                    ]}
                                />
                            </div>

                            {/* Department Filter */}
                            {filterPerms.department && (
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
                            )}

                            {/* Priority Filter */}
                            {filterPerms.priority && (
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
                            )}

                            {/* Role Filter */}
                            {filterPerms.role && (
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">Role</label>
                                    <Select
                                        value={roleFilter}
                                        onChange={(value) => setRoleFilter(value)}
                                        className="w-full"
                                        size="large"
                                        options={[
                                            { value: 'all', label: 'All Roles' },
                                            ...roles
                                        ]}
                                    />
                                </div>
                            )}

                            {/* User Filter */}
                            {filterPerms.user && (
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">User</label>
                                    <Select
                                        value={userFilter}
                                        onChange={(value) => setUserFilter(value)}
                                        className="w-full"
                                        size="large"
                                        showSearch
                                        optionFilterProp="label"
                                        filterOption={(input, option) => {
                                            if (option?.value === 'all') return true;
                                            const searchText = input.toLowerCase();
                                            return (
                                                (option?.label ?? '').toLowerCase().includes(searchText) ||
                                                (option?.department ?? '').toLowerCase().includes(searchText)
                                            );
                                        }}
                                    >
                                        {(() => {
                                            const options = [];
                                            let lastDepartment = null;

                                            filteredUserOptions.forEach((option, index) => {
                                                if (option.value === 'all') {
                                                    options.push(
                                                        <Select.Option key="all" value="all">
                                                            All Users
                                                        </Select.Option>
                                                    );
                                                } else {
                                                    // Add department header if it's a new department
                                                    if (option.department !== lastDepartment) {
                                                        options.push(
                                                            <Select.Option
                                                                key={`dept-${option.department}-${index}`}
                                                                value={`dept-header-${index}`}
                                                                disabled
                                                                className="!bg-gray-100 !cursor-default"
                                                            >
                                                                <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                                                    {option.department}
                                                                </div>
                                                            </Select.Option>
                                                        );
                                                        lastDepartment = option.department;
                                                    }

                                                    // Add user option
                                                    options.push(
                                                        <Select.Option
                                                            key={option.value}
                                                            value={option.value}
                                                            label={`${option.label} (${option.designation})`}
                                                            department={option.department}
                                                            designation={option.designation}
                                                        >
                                                            <div className="pl-2">
                                                                {option.label} <span className="text-gray-500 text-sm">({option.designation})</span>
                                                            </div>
                                                        </Select.Option>
                                                    );
                                                }
                                            });

                                            return options;
                                        })()}
                                    </Select>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4 border-t border-gray-100 mt-auto">
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
                                    className="flex-1 bg-primary"
                                    size="large"
                                >
                                    Apply Filters
                                </Button>
                            </div>
                        </div>
                    );
                })()}
            </Modal>
        </div >
    );
};
