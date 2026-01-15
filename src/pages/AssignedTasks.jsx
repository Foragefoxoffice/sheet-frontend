import { useState, useEffect } from 'react';
import { ListTodo, Search, Filter } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import TaskCard from '../components/common/TaskCard';
import api from '../utils/api';
import { showToast } from '../utils/helpers';
import { TASK_STATUS } from '../utils/taskHelpers';

export default function AssignedTasks() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const response = await api.get('/tasks/assigned');
            setTasks(response.data.tasks || []);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            showToast('Failed to load tasks', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filteredTasks = tasks.filter(task => {
        const matchesFilter = filter === 'all' || task.status === filter;
        const matchesSearch = task.task.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.assignedToName.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Assigned Tasks</h1>
                <p className="text-gray-600">Tasks you've assigned to others</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-card shadow-card mb-6 p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                        />
                    </div>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none bg-white"
                    >
                        <option value="all">All Status</option>
                        <option value={TASK_STATUS.PENDING}>Pending</option>
                        <option value={TASK_STATUS.IN_PROGRESS}>In Progress</option>
                        <option value={TASK_STATUS.COMPLETED}>Completed</option>
                    </select>
                </div>
            </div>

            {/* Task List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading tasks...</p>
                    </div>
                </div>
            ) : filteredTasks.length === 0 ? (
                <div className="bg-white rounded-card shadow-card p-12 text-center">
                    <ListTodo className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks found</h3>
                    <p className="text-gray-600">
                        {searchQuery ? 'Try adjusting your search' : "You haven't assigned any tasks yet"}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTasks.map(task => (
                        <TaskCard
                            key={task._id}
                            task={task}
                            showActions={false}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
