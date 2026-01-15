export const TASK_STATUS = {
    PENDING: 'Pending',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
};

export const TASK_PRIORITY = {
    HIGH: 'High',
    MEDIUM: 'Medium',
    LOW: 'Low',
};

export const APPROVAL_STATUS = {
    PENDING: 'Pending',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
};

export const DURATION_TYPES = {
    HOURS: 'hours',
    DAYS: 'days',
};

// Get status badge color
export const getStatusColor = (status) => {
    switch (status) {
        case TASK_STATUS.PENDING:
            return 'bg-warning-100 text-warning-700 border-warning-200';
        case TASK_STATUS.IN_PROGRESS:
            return 'bg-info-100 text-info-700 border-info-200';
        case TASK_STATUS.COMPLETED:
            return 'bg-success-100 text-success-700 border-success-200';
        default:
            return 'bg-gray-100 text-gray-700 border-gray-200';
    }
};

// Get priority badge color
export const getPriorityColor = (priority) => {
    switch (priority) {
        case TASK_PRIORITY.HIGH:
            return 'bg-danger-100 text-danger-700 border-danger-200';
        case TASK_PRIORITY.MEDIUM:
            return 'bg-warning-100 text-warning-700 border-warning-200';
        case TASK_PRIORITY.LOW:
            return 'bg-success-100 text-success-700 border-success-200';
        default:
            return 'bg-gray-100 text-gray-700 border-gray-200';
    }
};

// Get approval status color
export const getApprovalColor = (status) => {
    switch (status) {
        case APPROVAL_STATUS.PENDING:
            return 'bg-warning-100 text-warning-700 border-warning-200';
        case APPROVAL_STATUS.APPROVED:
            return 'bg-success-100 text-success-700 border-success-200';
        case APPROVAL_STATUS.REJECTED:
            return 'bg-danger-100 text-danger-700 border-danger-200';
        default:
            return 'bg-gray-100 text-gray-700 border-gray-200';
    }
};

// Check if task is overdue
export const isTaskOverdue = (dueDate, status) => {
    if (status === TASK_STATUS.COMPLETED) return false;
    return new Date(dueDate) < new Date();
};

// Format time remaining
export const getTimeRemaining = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = due - now;

    if (diff < 0) return 'Overdue';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
};
