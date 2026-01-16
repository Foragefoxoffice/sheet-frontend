import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
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

    const handleSelfTaskChange = (e) => {
        setIsSelfTask(e.target.checked);
        if (e.target.checked) {
            form.setFieldsValue({ assignedToEmail: user.email });
        } else {
            form.setFieldsValue({ assignedToEmail: '' });
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

            const requestData = {
                task: values.task,
                assignedToEmail: values.assignedToEmail,
                priority: values.priority,
                durationType: 'hours',
                durationValue: diffHours,
                notes: values.notes,
                isSelfTask: isSelfTask,
            };

            const response = await api.post('/tasks', requestData);

            if (response.data.success) {
                showToast('Task created successfully!', 'success');

                // Reset form
                form.resetFields();
                setIsSelfTask(false);

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
            <Card className="max-w-3xl shadow-card border-none">
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{
                        priority: 'Medium',
                        isSelfTask: false
                    }}
                    size="large"
                >
                    {/* Task Description */}
                    <Form.Item
                        label={<span className="font-medium text-gray-700">Task Description</span>}
                        name="task"
                        rules={[{ required: true, message: 'Please describe the task' }]}
                    >
                        <Input.TextArea
                            rows={4}
                            placeholder="Describe the task in detail..."
                            className="rounded-lg"
                        />
                    </Form.Item>

                    {/* Self Task Checkbox */}
                    <Form.Item name="isSelfTask" valuePropName="checked">
                        <Checkbox onChange={handleSelfTaskChange}>
                            This is a self-assigned task
                        </Checkbox>
                    </Form.Item>

                    {/* Assign To */}
                    {!isSelfTask && (
                        <Form.Item
                            label={<span className="font-medium text-gray-700">Assign To</span>}
                            name="assignedToEmail"
                            rules={[{ required: true, message: 'Please select a user' }]}
                        >
                            <Select
                                placeholder="Select a user"
                                showSearch
                                optionFilterProp="children"
                            >
                                {users.map(u => (
                                    <Select.Option key={u._id} value={u.email}>
                                        {u.name} ({u.role?.displayName || u.role}) - {u.email}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    )}

                    {/* Hidden field for assignedToEmail when self task is checked */}
                    <Form.Item name="assignedToEmail" hidden>
                        <Input />
                    </Form.Item>

                    {/* Priority, Date, and Time Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Priority */}
                        <Form.Item
                            label={<span className="font-medium text-gray-700">Priority</span>}
                            name="priority"
                        >
                            <Select>
                                <Select.Option value="Low">Low</Select.Option>
                                <Select.Option value="Medium">Medium</Select.Option>
                                <Select.Option value="High">High</Select.Option>
                            </Select>
                        </Form.Item>

                        {/* Target Date */}
                        <Form.Item
                            label={<span className="font-medium text-gray-700">Target Date</span>}
                            name="targetDate"
                            rules={[{ required: true, message: 'Please select date' }]}
                        >
                            <DatePicker
                                className="w-full"
                                disabledDate={(current) => current && current < dayjs().startOf('day')}
                            />
                        </Form.Item>

                        {/* Target Time */}
                        <Form.Item
                            label={<span className="font-medium text-gray-700">Target Time</span>}
                            name="targetTime"
                            rules={[{ required: true, message: 'Please select time' }]}
                        >
                            <TimePicker
                                className="w-full"
                                format="HH:mm"
                                minuteStep={15}
                            />
                        </Form.Item>
                    </div>

                    {/* Notes */}
                    <Form.Item
                        label={<span className="font-medium text-gray-700">Notes (Optional)</span>}
                        name="notes"
                    >
                        <Input.TextArea
                            rows={3}
                            placeholder="Add any additional notes or instructions..."
                        />
                    </Form.Item>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            size="large"
                            className="flex-1"
                            onClick={() => navigate(-1)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            size="large"
                            className="flex-1 bg-black text-white hover:bg-gray-800 border-black"
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
