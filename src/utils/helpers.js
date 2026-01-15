import { format, formatDistanceToNow, differenceInHours, differenceInDays } from 'date-fns';

// Get user initials from name
export const getUserInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// Format date
export const formatDate = (date) => {
    if (!date) return '-';
    return format(new Date(date), 'dd MMM yyyy');
};

// Format date with time
export const formatDateTime = (date) => {
    if (!date) return '-';
    return format(new Date(date), 'dd MMM yyyy, hh:mm a');
};

// Calculate remaining time
export const calculateRemainingTime = (dueDate) => {
    if (!dueDate) return null;

    const now = new Date();
    const due = new Date(dueDate);
    const diffMs = due - now;

    if (diffMs < 0) {
        // Overdue
        const hoursOverdue = Math.abs(differenceInHours(due, now));
        const daysOverdue = Math.abs(differenceInDays(due, now));

        if (hoursOverdue < 24) {
            return {
                value: hoursOverdue,
                unit: 'hours',
                isOverdue: true,
            };
        } else {
            return {
                value: daysOverdue,
                unit: 'days',
                isOverdue: true,
            };
        }
    } else {
        // Not overdue
        const hoursRemaining = differenceInHours(due, now);
        const daysRemaining = differenceInDays(due, now);

        if (hoursRemaining < 24) {
            return {
                value: hoursRemaining,
                unit: 'hours',
                isOverdue: false,
            };
        } else {
            return {
                value: daysRemaining,
                unit: 'days',
                isOverdue: false,
            };
        }
    }
};

// Format remaining time for display
export const formatRemainingTime = (remainingTime) => {
    if (!remainingTime) return '-';

    const { value, unit, isOverdue } = remainingTime;

    if (isOverdue) {
        return `${value} ${unit} overdue`;
    } else {
        return `${value} ${unit} left`;
    }
};

// Pagination helper
export const paginateArray = (array, page, perPage) => {
    const start = (page - 1) * perPage;
    const end = start + perPage;
    return array.slice(start, end);
};

// Toast notification helper
export const showToast = (message, type = 'info') => {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `fixed bottom-8 right-8 px-6 py-4 rounded-lg shadow-lg text-white font-medium z-50 transition-all transform translate-y-0 opacity-100`;

    // Set background color based on type
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500',
    };
    toast.classList.add(colors[type] || colors.info);

    toast.textContent = message;
    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
        toast.classList.add('opacity-100', 'translate-y-0');
    }, 10);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-4');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
};
