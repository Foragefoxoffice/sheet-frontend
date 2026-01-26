import { Clock, User, Calendar, Tag, ChevronDown, Pencil, Trash2, UserCheck, AlertCircle, MessageSquare, ChevronUp, Plus as PlusIcon, FileText, CornerUpRight } from 'lucide-react';
import { isTaskOverdue, getTimeRemaining, TASK_STATUS } from '../../utils/taskHelpers';
import { formatDateTime } from '../../utils/helpers';
import { useState } from 'react';
import Modal from './Modal';

export default function TaskCard({ task, onStatusChange, onView, onEdit, onDelete, onForward, showActions = true, canEdit = true }) {
    const isOverdue = isTaskOverdue(task.dueDate, task.status);
    const [isChangingStatus, setIsChangingStatus] = useState(false);
    const [showComments, setShowComments] = useState(false);

    const handleStatusChange = async (newStatus) => {
        if (newStatus === task.status) return;

        setIsChangingStatus(true);
        try {
            await onStatusChange(task._id, newStatus);
        } finally {
            setIsChangingStatus(false);
        }
    };

    // Premium priority badges
    const getPriorityBadge = (priority) => {
        switch (priority) {
            case 'High':
                return 'bg-red-50 text-red-600 border-red-200 ring-red-500/10';
            case 'Medium':
                return 'bg-orange-50 text-orange-600 border-orange-200 ring-orange-500/10';
            case 'Low':
                return 'bg-blue-50 text-blue-600 border-blue-200 ring-blue-500/10';
            default:
                return 'bg-gray-50 text-gray-600 border-gray-200 ring-gray-500/10';
        }
    };

    const formatDateTime1 = (date) => {
        return new Date(date).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };


    return (
        <div className="group bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] border border-gray-100 transition-all duration-300 relative overflow-hidden h-full flex flex-col">

            {/* Priority Stripe */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${task.priority === 'High' ? 'bg-red-500' :
                task.priority === 'Medium' ? 'bg-orange-400' :
                    'bg-blue-400'
                }`} />

            <div className="p-5 pl-7 flex-1 flex flex-col content-between">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-400 tracking-wider">Task ID: {task.sno}</span>
                            {task.isSelfTask && (
                                <span className="px-1.5 py-0.5 bg-purple-50 text-purple-600 text-[10px] font-bold rounded border border-purple-100 uppercase tracking-wide">
                                    Self
                                </span>
                            )}
                            {task.isForwarded && (
                                <span className="px-1.5 py-0.5 bg-orange-50 text-orange-600 text-[10px] font-bold rounded border border-orange-100 uppercase tracking-wide">
                                    Forwarded
                                </span>
                            )}
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-primary-600 transition-colors line-clamp-2">
                            {task.task}
                        </h3>
                    </div>

                    {/* Action Buttons */}
                    {(onEdit || onDelete || onForward) && (
                        <div className="flex items-center gap-1 -mr-2 mt-2">
                            {onForward && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onForward(task); }}
                                    className="p-1.5 cursor-pointer hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"
                                    title="Forward Task"
                                >
                                    <CornerUpRight className="w-3.5 h-3.5" />
                                </button>
                            )}
                            {onEdit && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                                    className="p-1.5 cursor-pointer hover:bg-gray-50 rounded-lg text-gray-400 hover:text-primary-600 transition-colors"
                                    title="Edit Task"
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDelete(task); }}
                                    className="p-1.5 cursor-pointer hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                                    title="Delete Task"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-y-4 gap-x-2 mt-2 mb-4">
                    {/* Assigned To */}
                    <div className="flex flex-col gap-2">
                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            <User className="w-3 h-3" /> Assigned To
                        </span>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold ring-2 ring-white">
                                {task.assignedToName?.charAt(0) || 'U'}
                            </div>
                            <span className="text-sm font-medium text-gray-700 truncate max-w-[100px]" title={task.assignedToName}>
                                {task.assignedToName}
                            </span>
                        </div>
                    </div>

                    {/* Assigned By */}
                    <div className="flex flex-col gap-2">
                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            <UserCheck className="w-3 h-3" /> Assigned By
                        </span>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs font-bold ring-2 ring-white">
                                {task.createdBy?.name?.charAt(0) || task.createdByEmail?.charAt(0) || 'A'}
                            </div>
                            <span className="text-sm font-medium text-gray-700 truncate max-w-[100px]" title={task.createdBy?.name || task.createdByEmail}>
                                {task.createdBy?.name || task.createdByEmail}
                            </span>
                        </div>
                    </div>

                    {/* Forwarded By */}
                    {task.isForwarded && (
                        <div className="flex flex-col gap-2">
                            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                <CornerUpRight className="w-3 h-3" /> Forwarded By
                            </span>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-bold ring-2 ring-white">
                                    {(task.forwardedByName || task.forwardedBy?.name || 'F').charAt(0)}
                                </div>
                                <span className="text-sm font-medium text-gray-700 truncate max-w-[100px]" title={task.forwardedByName || task.forwardedBy?.name || 'Unknown'}>
                                    {task.forwardedByName || task.forwardedBy?.name || 'Unknown'}
                                </span>
                            </div>
                        </div>
                    )}

                    {
                        task.isSelfTask && (
                            <div className="flex flex-col gap-2">
                                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                    <UserCheck className="w-3 h-3" /> Given By
                                </span>
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs font-bold ring-2 ring-white">
                                        {(task.taskGivenByName || 'Unknown').charAt(0)}
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 truncate max-w-[100px]" title={task.taskGivenByName || 'Unknown'}>
                                        {task.taskGivenByName || 'Unknown'}
                                    </span>
                                </div>
                            </div>
                        )
                    }
                    {/* Due Date */}
                    <div className="flex flex-col gap-2">
                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Due Date & Time
                        </span>
                        <div className="flex items-center gap-1.5">
                            <span
                                className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-gray-700'
                                    }`}
                            >
                                {formatDateTime1(task.dueDate)}
                            </span>
                            {isOverdue && (
                                <AlertCircle className="w-3 h-3 text-red-500 animate-pulse" />
                            )}
                        </div>
                    </div>

                    {/* Comments Button */}
                    {task.comments && task.comments.length > 0 && (
                        <div className="flex flex-col gap-2 pt-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowComments(true);
                                }}
                                className="flex cursor-pointer items-center gap-2 px-2 py-1 bg-primary-50 hover:bg-primary-100 text-primary-600 rounded-lg transition-colors border border-primary-200"
                            >
                                <MessageSquare className="w-4 h-4" />
                                <span className="text-sm font-semibold">View Comments</span>
                                <span className="px-2 py-0.5 bg-primary-600 text-white text-xs rounded-full">
                                    {task.comments.length}
                                </span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Notes Section */}
                {task.notes && (
                    <div className="pt-2 border-t border-dashed border-gray-100">
                        <div className="flex flex-col gap-2">
                            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                <FileText className="w-3 h-3" /> Notes
                            </span>
                            <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                                {task.notes}
                            </p>
                        </div>
                    </div>
                )}

                {/* Badges Row */}
                <div className="flex flex-wrap items-center gap-2 mt-auto pt-4 border-t border-gray-50">
                    <div className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 ${task.priority === 'High' ? 'bg-red-50 text-red-600' :
                        task.priority === 'Medium' ? 'bg-orange-50 text-orange-600' :
                            'bg-blue-50 text-blue-600'
                        }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${task.priority === 'High' ? 'bg-red-500' :
                            task.priority === 'Medium' ? 'bg-orange-500' :
                                'bg-blue-500'
                            }`} />
                        {task.priority} Priority
                    </div>

                    <div className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 ${isOverdue ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                        <Clock className="w-3 h-3" />
                        {isOverdue ? 'Overdue' : getTimeRemaining(task.dueDate)}
                    </div>
                </div>
            </div>

            {/* Footer / Actions Area */}
            {showActions && (
                <div className="bg-gray-50/50 p-3 pl-7 border-t border-gray-100 flex items-center gap-3">
                    {canEdit && task.status !== TASK_STATUS.COMPLETED ? (
                        <div className="relative flex-1 group/select">
                            <select
                                value={task.status}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                disabled={isChangingStatus}
                                className={`w-full appearance-none pl-3 pr-8 py-2 text-xs font-semibold rounded-lg border shadow-sm outline-none transition-all cursor-pointer ${task.status === TASK_STATUS.PENDING ? 'bg-white border-gray-200 text-gray-700 hover:border-gray-300' :
                                    task.status === TASK_STATUS.IN_PROGRESS ? 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:border-yellow-300' :
                                        'bg-blue-50 border-blue-200 text-blue-700 hover:border-blue-300'
                                    }`}
                            >
                                <option value={TASK_STATUS.PENDING}>Pending</option>
                                <option value={TASK_STATUS.IN_PROGRESS}>In Progress</option>
                                <option value={TASK_STATUS.WAITING_FOR_APPROVAL}>Request Approval</option>
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                        </div>
                    ) : (
                        <div className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold text-center border ${task.status === TASK_STATUS.COMPLETED ? 'bg-green-50 text-[#2D9E36] border-green-200' :
                            task.status === TASK_STATUS.WAITING_FOR_APPROVAL ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                'bg-gray-100 text-gray-500 border-gray-200'
                            }`}>
                            {task.status === TASK_STATUS.WAITING_FOR_APPROVAL ? 'Waiting Approval' : task.status}
                        </div>
                    )}

                    {onView && (
                        <button
                            onClick={() => onView(task)}
                            className="px-3.5 py-2 cursor-pointer flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-600 font-semibold text-xs border border-gray-200 rounded-lg shadow-sm transition-all hover:text-primary-600 hover:border-primary-200 whitespace-nowrap"
                        >
                            <PlusIcon className="w-4 h-4" /> Add Comment
                        </button>
                    )}
                </div>
            )}

            {/* Approval Ribbon */}
            {task.approvalStatus && task.approvalStatus !== 'Pending' && (
                <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[10px] font-bold uppercase tracking-wider shadow-sm ${task.approvalStatus === 'Approved' ? 'bg-[#2D9E36] text-white' : 'bg-red-500 text-white'
                    }`}>
                    {task.approvalStatus === 'Approved' ? 'Approved' : 'Returned'}
                </div>
            )}

            {/* Comments Modal */}
            <Modal
                isOpen={showComments}
                onClose={() => setShowComments(false)}
                title={`Comments (${task.comments?.length || 0})`}
                size="medium"
            >
                <div className="space-y-4">
                    {task.comments && task.comments.length > 0 ? (
                        task.comments.map((comment, index) => (
                            <div key={index} className="flex gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-100">
                                <div className="flex-shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                                        {comment.createdByName?.charAt(0) || 'U'}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-gray-900">
                                                {comment.createdByName}
                                            </span>
                                            {(comment.userDesignation || comment.createdBy?.designation || comment.userRole) && (
                                                <span className="text-[10px] font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-100 uppercase tracking-wide">
                                                    {comment.userDesignation || comment.createdBy?.designation || comment.userRole}
                                                </span>
                                            )}
                                            {comment.userDepartment && (
                                                <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 uppercase tracking-wide">
                                                    {comment.userDepartment}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center text-xs text-gray-400 gap-1.5">
                                            <Clock className="w-3 h-3" />
                                            {formatDateTime1(comment.createdAt)}
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                        {comment.text}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            No comments yet.
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}
