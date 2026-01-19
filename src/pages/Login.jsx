import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Alert, Space } from 'antd';
import { Lock, Phone, Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import TaskCard from '../components/common/TaskCard';
import { TASK_STATUS } from '../utils/taskHelpers';

export default function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const onFinish = async (values) => {
        setError('');
        setLoading(true);

        try {
            const formattedWhatsapp = '91' + values.whatsapp;
            const result = await login(formattedWhatsapp, values.password);

            if (result.success) {
                navigate('/dashboard');
            } else {
                setError(result.error || 'Invalid credentials. Please try again.');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Dummy task for showcase
    // Dummy task for showcase
    const showcaseTask = {
        _id: 'showcase-task',
        sno: 101,
        task: 'Review Q4 Financial Reports',
        priority: 'High',
        status: TASK_STATUS.IN_PROGRESS,
        assignedToName: 'Sarah Wilson',
        createdBy: {
            name: 'David Miller',
            designation: 'Senior Manager'
        },
        dueDate: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
        approvalStatus: 'Pending',
        notes: 'Please ensure all department numbers are consolidated.',
        isSelfTask: false
    };

    return (
        <div className="min-h-screen flex overflow-hidden">
            {/* Left Column - Task Showcase */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-linear-to-br from-primary-600 via-primary-700 to-purple-900 overflow-hidden items-center justify-center p-12">
                {/* Animated Background Elements */}
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-blob"></div>
                    <div className="absolute top-40 right-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000"></div>
                    <div className="absolute bottom-20 left-40 w-72 h-72 bg-primary-300 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-4000"></div>
                </div>

                {/* Grid Pattern Overlay */}
                <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>

                {/* Showcase Card */}
                <div className="relative z-10 w-full max-w-md transform rotate-3 hover:rotate-0 transition-transform duration-500">
                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20 shadow-2xl">
                        <TaskCard
                            task={showcaseTask}
                            showActions={true}
                            canEdit={true}
                            onStatusChange={() => { }}
                            onView={() => { }}
                            onEdit={() => { }}
                            onDelete={() => { }}
                        />
                    </div>
                </div>
            </div>

            {/* Right Column - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-linear-to-br from-gray-50 to-white relative">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

                <div className="w-full max-w-md relative z-10">

                    {/* Login Card */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 lg:p-10 border border-white/20">
                        {/* Header */}
                        <div className="mb-8 text-center">
                            <img src="/logo.png" alt="Logo" className="pb-6" />
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome </h2>
                            <p className="text-gray-600">Sign in to continue to your account</p>
                        </div>

                        {error && (
                            <Alert
                                message={error}
                                type="error"
                                showIcon
                                className="mb-6 animate-shake"
                            />
                        )}

                        <Form
                            name="login"
                            onFinish={onFinish}
                            layout="vertical"
                            size="large"
                            requiredMark={false}
                        >
                            <Form.Item
                                label={<span className="font-semibold text-gray-700">WhatsApp Number</span>}
                                name="whatsapp"
                                rules={[
                                    { required: true, message: 'Please enter your WhatsApp number' },
                                    { len: 10, message: 'Must be a valid 10-digit number' },
                                    { pattern: /^\d+$/, message: 'Must contain only digits' }
                                ]}
                            >
                                <Space.Compact style={{ width: '100%' }}>
                                    <Input
                                        style={{ width: '60px' }}
                                        value="+91"
                                        disabled
                                        className="text-center"
                                    />
                                    <Input
                                        placeholder="98765 43210"
                                        maxLength={10}
                                        className="py-2.5 rounded-lg"
                                        onChange={(e) => {
                                            // Ensure only digits 
                                            const value = e.target.value.replace(/\D/g, '');
                                            // Logic to update if needed, but Form handles value. 
                                            // To enforce digits only in input display, we might need controlled component or formatter.
                                            // Simplest is let pattern rule handle validation or use type="tel"
                                        }}
                                    />
                                </Space.Compact>
                            </Form.Item>

                            <Form.Item
                                label={<span className="font-semibold text-gray-700">Password</span>}
                                name="password"
                                rules={[{ required: true, message: 'Please enter your password' }]}
                            >
                                <Input.Password
                                    placeholder="Enter your password"
                                    prefix={<Lock className="w-4 h-4 text-gray-400" />}
                                    className="py-2.5 rounded-lg"
                                />
                            </Form.Item>

                            {/* <div className="text-right mb-4">
                                <Button
                                    type="link"
                                    onClick={() => navigate('/forgot-password')}
                                    className="text-primary-600 hover:text-primary-700 p-0 h-auto font-medium"
                                >
                                    Forgot Password?
                                </Button>
                            </div> */}

                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={loading}
                                    className="w-full h-12 bg-linear-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 border-none shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 rounded-xl font-semibold text-lg flex items-center justify-center gap-2"
                                >
                                    Sign In <ArrowRight className="w-5 h-5" />
                                </Button>
                            </Form.Item>
                        </Form>


                    </div>

                </div>
            </div>

            {/* Custom Styles */}
            <style>{`
                @keyframes blob {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    25% { transform: translate(20px, -20px) scale(1.1); }
                    50% { transform: translate(-20px, 20px) scale(0.9); }
                    75% { transform: translate(20px, 20px) scale(1.05); }
                }

                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }

                .animate-blob {
                    animation: blob 7s infinite;
                }

                .animation-delay-2000 {
                    animation-delay: 2s;
                }

                .animation-delay-4000 {
                    animation-delay: 4s;
                }

                .animate-shake {
                    animation: shake 0.3s ease-in-out;
                }

                .bg-grid-pattern {
                    background-image: 
                        linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
                    background-size: 50px 50px;
                }
            `}</style>
        </div>
    );
}
