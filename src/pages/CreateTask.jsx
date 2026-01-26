import { useState, useEffect } from 'react';
import { Plus, ListTodo } from 'lucide-react';
import { Form, Input, Select, DatePicker, TimePicker, Button, Checkbox, Card } from 'antd';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../utils/api';
import { showToast } from '../utils/helpers';

export default function CreateTask() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [form] = Form.useForm();
    const [isSelfTask, setIsSelfTask] = useState(false);
    const [taskGivenBy, setTaskGivenBy] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const [usersResponse, rolesResponse] = await Promise.all([
                api.get('/users/for-tasks'),
                api.get('/users/available-roles')
            ]);

            const allUsers = usersResponse.data.users || [];
            const managedRoles = rolesResponse.data.roles || [];
            const managedRoleIds = managedRoles.map(r => r._id);

            // Filter removed as requested: allow selecting all users
            const assignableUsers = allUsers;

            setUsers(assignableUsers);
        } catch (error) {
            console.error('Error fetching users:', error);
            showToast('Failed to load users', 'error');
        }
    };

    const handleSelfTaskChange = (e) => {
        const checked = e.target.checked;
        setIsSelfTask(checked);
        if (checked) {
            form.setFieldsValue({ assignedToEmail: user.email });
        } else {
            form.setFieldsValue({ assignedToEmail: undefined, taskGivenBy: undefined });
            setTaskGivenBy('');
        }
    };

    const handleSubmit = async (values) => {
        setLoading(true);

        try {
            const targetDate = values.targetDate.format('YYYY-MM-DD');
            const targetTime = values.targetTime.format('HH:mm');

            // Combine date and time into a single Date object
            const dueDate = new Date(`${targetDate}T${targetTime}`);

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

            // Robustly determine ID and Email
            let finalAssignedToUserId = null;
            let finalAssignedToEmail = '';

            if (isSelfTask) {
                finalAssignedToUserId = user._id;
                finalAssignedToEmail = user.email;
            } else {
                // values.assignedToEmail IS the user ID from the Select component
                finalAssignedToUserId = values.assignedToEmail;

                // Attempt to resolve email for legacy support/notifications, but primary ID is now set
                const assignedUser = users.find(u => u._id === values.assignedToEmail);
                if (assignedUser) {
                    finalAssignedToEmail = assignedUser.email;
                }
            }

            // Prepare Task Giver data
            let finalTaskGivenBy = values.taskGivenBy;
            let finalTaskGivenByName = '';
            let finalTaskGivenByUserId = null;

            if (values.taskGivenBy) {
                // values.taskGivenBy is the ID from the Select
                finalTaskGivenByUserId = values.taskGivenBy;

                const giverUser = users.find(u => u._id === values.taskGivenBy);
                if (giverUser) {
                    finalTaskGivenBy = giverUser.email || '';
                    finalTaskGivenByName = giverUser.name;
                }
            }

            const requestData = {
                task: values.task,
                assignedToEmail: finalAssignedToEmail,
                assignedToUserId: finalAssignedToUserId,
                priority: values.priority,
                durationType: 'hours',
                durationValue: diffHours,
                notes: values.notes,
                isSelfTask: isSelfTask,
                taskGivenBy: finalTaskGivenBy,
                taskGivenByUserId: finalTaskGivenByUserId,
                taskGivenByName: finalTaskGivenByName,
            };

            const response = await api.post('/tasks', requestData);

            if (response.data.success) {
                showToast('Task created successfully!', 'success');

                // Reset form
                form.resetFields();
                setIsSelfTask(false);
                setTaskGivenBy('');

                // Navigate to assigned tasks after 1 second
                setTimeout(() => {
                    navigate('/assigned-tasks');
                }, 1000);
            }
        } catch (error) {
            console.error('Task save error:', error);
            showToast(error.response?.data?.error || 'Failed to save task', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="md:p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Task</h1>

            <Card className="shadow-sm">
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    className="mt-4"
                    initialValues={{
                        priority: 'Medium',
                        isSelfTask: false
                    }}
                >
                    <Form.Item
                        name="task"
                        label={<span className="font-medium text-gray-700">Task</span>}
                        rules={[{ required: true, message: 'Please enter a task' }]}
                    >
                        <Input.TextArea
                            rows={4}
                            placeholder="Describe the task in detail..."
                            size="large"
                        />
                    </Form.Item>

                    {/* Show Assign To only if not self-task */}
                    {!isSelfTask && (
                        <Form.Item
                            name="assignedToEmail"
                            label={<span className="font-medium text-gray-700">Assign To</span>}
                            rules={[{ required: true, message: 'Please select a user' }]}
                        >
                            <Select
                                placeholder="Select a user"
                                size="large"
                                showSearch
                                optionFilterProp="children"
                            >
                                {users.map(u => (
                                    <Select.Option key={u._id} value={u._id}>
                                        {u.name} ({u.designation || u.role?.displayName})
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    )}

                    {/* Show creator info for self-tasks */}
                    {isSelfTask && (
                        <div className="space-y-4 mb-6">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 text-blue-700">
                                    <ListTodo className="w-5 h-5" />
                                    <span className="font-medium">Self-Assigned Task</span>
                                </div>
                                <p className="text-sm text-blue-600 mt-2">
                                    Assigned to: <span className="font-semibold">{user.name}</span> ({user.designation || user.role?.displayName})
                                </p>
                                {/* Hidden field to hold the value for form submission */}
                                <Form.Item name="assignedToEmail" hidden>
                                    <Input />
                                </Form.Item>
                            </div>

                            {/* Task Given By field */}
                            <Form.Item
                                name="taskGivenBy"
                                label={<span className="font-medium text-gray-700">Task Given By (Optional)</span>}
                                help="Select the person who originally requested or assigned this task to you"
                            >
                                <Select
                                    placeholder="Select who gave you this task"
                                    size="large"
                                    showSearch
                                    optionFilterProp="children"
                                    allowClear
                                >
                                    {users
                                        .filter(u => u.email !== user.email)
                                        .map(u => (
                                            <Select.Option key={u._id} value={u._id}>
                                                {u.name} ({u.designation || u.role?.displayName})
                                            </Select.Option>
                                        ))}
                                </Select>
                            </Form.Item>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Form.Item
                            name="priority"
                            label={<span className="font-medium text-gray-700">Priority</span>}
                        >
                            <Select size="large">
                                <Select.Option value="Low">Low</Select.Option>
                                <Select.Option value="Medium">Medium</Select.Option>
                                <Select.Option value="High">High</Select.Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="targetDate"
                            label={<span className="font-medium text-gray-700">Target Date</span>}
                            rules={[{ required: true, message: 'Please select a date' }]}
                        >
                            <DatePicker
                                className="w-full"
                                size="large"
                                disabledDate={(current) => current && current < dayjs().startOf('day')}
                            />
                        </Form.Item>

                        <Form.Item
                            name="targetTime"
                            label={<span className="font-medium text-gray-700">Target Time</span>}
                            rules={[{ required: true, message: 'Please select a time' }]}
                        >
                            <TimePicker
                                className="w-full"
                                size="large"
                                format="HH:mm"
                            />
                        </Form.Item>
                    </div>

                    <Form.Item
                        name="notes"
                        label={<span className="font-medium text-gray-700">Notes (Optional)</span>}
                    >
                        <Input.TextArea
                            rows={3}
                            placeholder="Add any additional notes..."
                            size="large"
                        />
                    </Form.Item>

                    <div className="mb-6">
                        <Checkbox
                            checked={isSelfTask}
                            onChange={handleSelfTaskChange}
                        >
                            This is a self-assigned task
                        </Checkbox>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button
                            size="large"
                            onClick={() => navigate(-1)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            loading={loading}
                            className="flex-1 bg-primary hover:bg-primary-600"
                            icon={<Plus className="w-4 h-4" />}
                        >
                            Create Task
                        </Button>
                    </div>
                </Form>
            </Card>
        </div>
    );
}
