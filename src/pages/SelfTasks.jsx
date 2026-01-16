import { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import TaskCard from '../components/common/TaskCard';
import api from '../utils/api';
import { showToast } from '../utils/helpers';

export default function SelfTasks() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const response = await api.get('/tasks/self');
            setTasks(response.data.tasks || []);
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
                fetchTasks();
            }
        } catch (error) {
            showToast(error.response?.data?.error || 'Failed to update task status', 'error');
        }
    };

    return (
        <div className="max-w-full overflow-hidden">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Self Tasks</h1>
                <p className="text-gray-600">Tasks you've created for yourself</p>
            </div>

            {/* Task List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading tasks...</p>
                    </div>
                </div>
            ) : tasks.length === 0 ? (
                <div className="bg-white rounded-card shadow-card p-12 text-center">
                    <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No self tasks</h3>
                    <p className="text-gray-600">You haven't created any tasks for yourself yet</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 pt-5 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tasks.map(task => (
                        <TaskCard
                            key={task._id}
                            task={task}
                            onStatusChange={handleStatusChange}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
