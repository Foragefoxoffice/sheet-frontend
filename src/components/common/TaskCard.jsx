import { Clock, User, AlertCircle } from 'lucide-react';
import { getStatusColor, getPriorityColor, isTaskOverdue, getTimeRemaining } from '../../utils/taskHelpers';
import { formatDate } from '../../utils/helpers';

export default function TaskCard({ task, onStatusChange, onView, showActions = true }) {
    const isOverdue = isTaskOverdue(task.dueDate, task.status);

    return (
        <div className="bg-white rounded-card shadow-card p-5 hover:shadow-card-hover transition-all">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold text-gray-500">#{task.sno}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                            {task.status}
                        </span>
                        {task.approvalStatus && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${task.approvalStatus === 'Approved' ? 'bg-success-100 text-success-700 border-success-200' :
                                    task.approvalStatus === 'Rejected' ? 'bg-danger-100 text-danger-700 border-danger-200' :
                                        'bg-warning-100 text-warning-700 border-warning-200'
                                }`}>
                                {task.approvalStatus === 'Rejected' ? 'Returned' : task.approvalStatus}
                            </span>
                        )}
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 line-clamp-2">
                        {task.task}
                    </h3>
                </div>
            </div>

            {/* Task Details */}
            <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-4 h-4" />
                    <span className="truncate">
                        Assigned to: <span className="font-medium">{task.assignedToName}</span>
                    </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4" />
                    <span className={isOverdue ? 'text-danger font-medium' : 'text-gray-600'}>
                        {isOverdue ? (
                            <span className="flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" />
                                Overdue
                            </span>
                        ) : (
                            getTimeRemaining(task.dueDate)
                        )}
                    </span>
                </div>

                <div className="text-xs text-gray-500">
                    Due: {formatDate(task.dueDate)}
                </div>
            </div>

            {/* Notes Preview */}
            {task.notes && (
                <p className="text-sm text-gray-600 line-clamp-2 mb-4 italic">
                    "{task.notes}"
                </p>
            )}

            {/* Actions */}
            {showActions && (
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                    {task.status !== 'Completed' && (
                        <button
                            onClick={() => onStatusChange && onStatusChange(task._id, 'In Progress')}
                            className="flex-1 px-3 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
                        >
                            Start
                        </button>
                    )}
                    <button
                        onClick={() => onView && onView(task)}
                        className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        View Details
                    </button>
                </div>
            )}
        </div>
    );
}
