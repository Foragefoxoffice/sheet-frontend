import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { showToast } from '../utils/helpers';

export default function CreateTask() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);

    const [formData, setFormData] = useState({
        task: '',
        assignedToEmail: '',
        priority: 'Medium',
        targetDate: '',
        targetTime: '',
        notes: '',
        isSelfTask: false,
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users/for-tasks');
            setUsers(response.data.users || []);
        } catch (error) {
            console.error('Error fetching users:', error);
            showToast('Failed to load users', 'error');
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.task.trim()) {
            showToast('Task description is required', 'error');
            return;
        }

        if (!formData.assignedToEmail) {
            showToast('Please select a user to assign the task', 'error');
            return;
        }

        if (!formData.targetDate || !formData.targetTime) {
            showToast('Please select target date and time', 'error');
            return;
        }

        setLoading(true);

        try {
            // Combine date and time into a single Date object
            const dueDate = new Date(`${formData.targetDate}T${formData.targetTime}`);

            // Check if due date is in the past
            if (dueDate < new Date()) {
                showToast('Target date/time cannot be in the past', 'error');
                setLoading(false);
                return;
            }

            // Calculate duration from now to target date/time
            const now = new Date();
            const diffMs = dueDate - now;
            const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

            const requestData = {
                task: formData.task,
                assignedToEmail: formData.assignedToEmail,
                priority: formData.priority,
                durationType: 'hours',
                durationValue: diffHours,
                notes: formData.notes,
                isSelfTask: formData.isSelfTask,
            };

            const response = await api.post('/tasks', requestData);

            if (response.data.success) {
                showToast('Task created successfully!', 'success');

                // Reset form
                setFormData({
                    task: '',
                    assignedToEmail: '',
                    priority: 'Medium',
                    targetDate: '',
                    targetTime: '',
                    notes: '',
                    isSelfTask: false,
                });

                // Navigate to assigned tasks after 1 second
                setTimeout(() => {
                    navigate('/assigned-tasks');
                }, 1000);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.error || 'Failed to create task';
            showToast(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Create New Task</h1>
                <p className="text-gray-600">Assign a task to a team member</p>
            </div>

            {/* Form */}
            <div className="bg-white rounded-card shadow-card p-6 max-w-3xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Task Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Task Description <span className="text-danger">*</span>
                        </label>
                        <textarea
                            name="task"
                            value={formData.task}
                            onChange={handleChange}
                            rows="4"
                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none resize-none"
                            placeholder="Describe the task in detail..."
                            required
                        />
                    </div>

                    {/* Assign To */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Assign To <span className="text-danger">*</span>
                        </label>
                        <select
                            name="assignedToEmail"
                            value={formData.assignedToEmail}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none bg-white"
                            required
                        >
                            <option value="">Select a user</option>
                            {users.map(u => (
                                <option key={u._id} value={u.email}>
                                    {u.name} ({u.role?.displayName || u.role}) - {u.email}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Priority, Date, and Time Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Priority */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Priority
                            </label>
                            <select
                                name="priority"
                                value={formData.priority}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none bg-white"
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>

                        {/* Target Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Target Date <span className="text-danger">*</span>
                            </label>
                            <input
                                type="date"
                                name="targetDate"
                                value={formData.targetDate}
                                onChange={handleChange}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                required
                            />
                        </div>

                        {/* Target Time */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Target Time <span className="text-danger">*</span>
                            </label>
                            <input
                                type="time"
                                name="targetTime"
                                value={formData.targetTime}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                required
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notes (Optional)
                        </label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows="3"
                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none resize-none"
                            placeholder="Add any additional notes or instructions..."
                        />
                    </div>

                    {/* Self Task Checkbox */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="isSelfTask"
                            checked={formData.isSelfTask}
                            onChange={handleChange}
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <label className="text-sm text-gray-700">
                            This is a self-assigned task
                        </label>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="flex-1 px-6 py-2.5 border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-2.5 bg-black text-white rounded-lg hover:bg-primary-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Plus className="w-5 h-5" />
                                    Create Task
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
