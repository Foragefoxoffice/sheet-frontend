import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { Form, Input, Button } from 'antd';
import { useAuth } from '../../../hooks/useAuth';
import api from '../../../utils/api';
import { showToast } from '../../../utils/helpers';

export default function EditDepartmentForm({ department, onSuccess, onCancel }) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        if (department) {
            form.setFieldsValue({
                name: department.name,
                description: department.description,
            });
        }
    }, [department, form]);

    const handleSubmit = async (values) => {
        setLoading(true);

        try {
            const response = await api.put(`/departments/${department._id}`, {
                name: values.name,
                description: values.description || '',
            });

            if (response.data.success) {
                showToast(`Department "${values.name}" updated successfully!`, 'success');
                onSuccess(response.data.department);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.error || 'Failed to update department';
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
                <Button size="large" onClick={onCancel} className="flex-1 cancel-btn">
                    Cancel
                </Button>
                <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    size="large"
                    className="flex-1 bg-primary hover:bg-primary-600"
                    icon={<Save className="w-4 h-4" />}
                >
                    Save Changes
                </Button>
            </div>
        </Form>
    );
}
