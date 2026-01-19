import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { Form, Input, Select, Button } from 'antd';
import { useAuth } from '../../../hooks/useAuth';
import api from '../../../utils/api';
import { showToast } from '../../../utils/helpers';

export default function CreateDepartmentForm({ onSuccess, onCancel, managers = [] }) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    const handleSubmit = async (values) => {
        setLoading(true);

        try {
            const response = await api.post('/departments', {
                name: values.name,
                description: values.description,
                manager: values.manager || null,
            });

            if (response.data.success) {
                showToast(`Department "${values.name}" created successfully!`, 'success');
                onSuccess(response.data.department);
                form.resetFields();
            }
        } catch (error) {
            const errorMessage = error.response?.data?.error || 'Failed to create department';
            showToast(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className="space-y-4"
        >
            <Form.Item
                label={<span className="font-medium text-gray-700">Department Name</span>}
                name="name"
                rules={[{ required: true, message: 'Please enter department name' }]}
            >
                <Input placeholder="e.g., Engineering, Sales, Marketing" size="large" />
            </Form.Item>

            <Form.Item
                label={<span className="font-medium text-gray-700">Description</span>}
                name="description"
            >
                <Input.TextArea
                    rows={4}
                    placeholder="Brief description of the department"
                    size="large"
                />
            </Form.Item>


            <div className="flex gap-3 pt-2">
                <Button size="large" onClick={onCancel} className="flex-1">
                    Cancel
                </Button>
                <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    size="large"
                    className="flex-1 bg-primary hover:bg-primary-600"
                    icon={<Building2 className="w-4 h-4" />}
                >
                    Create Department
                </Button>
            </div>
        </Form>
    );
}
