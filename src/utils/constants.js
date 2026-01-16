// Role Constants
export const ROLES = {
    SUPERADMIN: 'SuperAdmin',
    DIRECTOR: 'Director',
    GENERAL_MANAGER: 'GeneralManager',
    MANAGER: 'Manager',
    STAFF: 'Staff',
};

// Task Status Constants
export const TASK_STATUS = {
    PENDING: 'Pending',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
};

// Priority Levels
export const PRIORITY = {
    HIGH: 'High',
    MEDIUM: 'Medium',
    LOW: 'Low',
};

// Duration Types
export const DURATION_TYPE = {
    HOURS: 'hours',
    DAYS: 'days',
};

// Permission Helpers
export const isSuperAdmin = (role) => {
    return role === ROLES.SUPERADMIN;
};

export const canUpdateAnyTask = (role) => {
    return role === ROLES.SUPERADMIN || role === ROLES.DIRECTOR || role === ROLES.GENERAL_MANAGER;
};

export const canApproveTask = (role, taskAssignedToRole) => {
    if (role === ROLES.SUPERADMIN || role === ROLES.DIRECTOR || role === ROLES.GENERAL_MANAGER) return true;
    if (role === ROLES.MANAGER && taskAssignedToRole === ROLES.STAFF) return true;
    return false;
};

export const canCreateTask = (role) => {
    // All roles can create tasks
    return true;
};

export const canManageRoles = (role) => {
    // Only super admin can manage roles
    return role === ROLES.SUPERADMIN;
};

export const getStatusOptionsForRole = (role) => {
    if (role === ROLES.SUPERADMIN || role === ROLES.DIRECTOR || role === ROLES.GENERAL_MANAGER || role === ROLES.MANAGER) {
        return [TASK_STATUS.PENDING, TASK_STATUS.IN_PROGRESS, TASK_STATUS.COMPLETED];
    }
    if (role === ROLES.STAFF) {
        return [TASK_STATUS.IN_PROGRESS, TASK_STATUS.COMPLETED];
    }
    return [];
};

