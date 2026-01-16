import { Clock, User, Calendar, Tag, ChevronDown } from 'lucide-react';
import { isTaskOverdue, getTimeRemaining, TASK_STATUS } from '../../utils/taskHelpers';
import { formatDate } from '../../utils/helpers';
import { useState } from 'react';

export default function TaskCard({ task, onStatusChange, onView, showActions = true }) {
    const isOverdue = isTaskOverdue(task.dueDate, task.status);
    const [isChangingStatus, setIsChangingStatus] = useState(false);

    const handleStatusChange = async (newStatus) => {
        if (newStatus === task.status) return;

        setIsChangingStatus(true);
        try {
            await onStatusChange(task._id, newStatus);
        } finally {
            setIsChangingStatus(false);
        }
    };

    // Simple priority colors
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'High':
                return 'bg-red-100 text-red-700 border-red-300';
            case 'Medium':
                return 'bg-yellow-100 text-yellow-700 border-yellow-300';
            case 'Low':
                return 'bg-blue-100 text-blue-700 border-blue-300';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-300';
        }
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-gray-900 text-white text-xs font-semibold rounded">
                        #{task.sno}
                    </span>
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded border ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                    </span>
                    {task.isSelfTask && (
                        <span className="px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded border border-purple-300">
                            Self
                        </span>
                    )}
                </div>
            </div>

            {/* Task Title */}
            <h3 className="text-base font-semibold text-gray-900 mb-4 line-clamp-2">
                {task.task}
            </h3>

            {/* Task Details */}
            <div className="space-y-3 mb-4">
                {/* Assigned To */}
                <div className="flex items-center gap-2.5 text-sm">
                    <User className="w-4 h-4 text-gray-400 shrink-0" />
                    <div>
                        <span className="text-gray-500">Assigned to: </span>
                        <span className="font-medium text-gray-900">{task.assignedToName}</span>
                    </div>
                </div>

                {/* Time Remaining */}
                <div className="flex items-center gap-2.5 text-sm">
                    <Clock className={`w-4 h-4 shrink-0 ${isOverdue ? 'text-red-500' : 'text-gray-400'}`} />
                    <div>
                        <span className="text-gray-500">Time: </span>
                        <span className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                            {isOverdue ? 'Overdue' : getTimeRemaining(task.dueDate)}
                        </span>
                    </div>
                </div>

                {/* Due Date */}
                <div className="flex items-center gap-2.5 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                    <div>
                        <span className="text-gray-500">Due: </span>
                        <span className="font-medium text-gray-900">{formatDate(task.dueDate)}</span>
                    </div>
                </div>

                {/* Task Given By */}
                {task.taskGivenByName && (
                    <div className="flex items-center gap-2.5 text-sm">
                        <Tag className="w-4 h-4 text-gray-400 shrink-0" />
                        <div>
                            <span className="text-gray-500">Requested by: </span>
                            <span className="font-medium text-gray-900">{task.taskGivenByName}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Notes */}
            {task.notes && (
                <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
                    <p className="text-sm text-gray-600 line-clamp-2 italic">
                        "{task.notes}"
                    </p>
                </div>
            )}

            {/* Status Selector & Actions */}
            {showActions && (
                <div className="flex gap-2 pt-4 border-t border-gray-100">
                    {/* Status Dropdown */}
                    <div className="flex-1 relative">
                        <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            disabled={isChangingStatus}
                            className={`w-full px-3 py-2 pr-8 rounded border-2 font-medium text-sm transition-colors outline-none appearance-none cursor-pointer ${task.status === TASK_STATUS.COMPLETED
                                ? 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100'
                                : task.status === TASK_STATUS.IN_PROGRESS
                                    ? 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100'
                                    : 'bg-orange-50 text-orange-700 border-orange-300 hover:bg-orange-100'
                                } ${isChangingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <option value={TASK_STATUS.PENDING}>Pending</option>
                            <option value={TASK_STATUS.IN_PROGRESS}>In Progress</option>
                            <option value={TASK_STATUS.COMPLETED}>Completed</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
                    </div>

                    {/* View Button */}
                    {onView && (
                        <button
                            onClick={() => onView(task)}
                            className="px-4 py-2 bg-white text-gray-700 border-2 border-gray-300 rounded hover:bg-gray-50 transition-colors font-medium text-sm"
                        >
                            View
                        </button>
                    )}
                </div>
            )}

            {/* Approval Status */}
            {task.approvalStatus && task.approvalStatus !== 'Pending' && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                    <span className={`inline-block px-3 py-1 rounded text-xs font-semibold ${task.approvalStatus === 'Approved'
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-red-100 text-red-700 border border-red-300'
                        }`}>
                        {task.approvalStatus === 'Approved' ? 'Approved' : 'Returned'}
                    </span>
                </div>
            )}
        </div>
    );
}
