import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Alert } from 'antd';
import { Lock, Phone, Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

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

    return (
        <div className="min-h-screen flex overflow-hidden">
            {/* Left Column - Illustration */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-linear-to-br from-primary-600 via-primary-700 to-purple-900 overflow-hidden">
                {/* Animated Background Elements */}
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-blob"></div>
                    <div className="absolute top-40 right-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000"></div>
                    <div className="absolute bottom-20 left-40 w-72 h-72 bg-primary-300 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-4000"></div>
                </div>

                {/* Grid Pattern Overlay */}
                <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>

                {/* Centered Illustration */}
                <div className="relative z-10 flex items-center justify-center w-full p-12">
                    <div className="w-full max-w-2xl">
                        {/* Illustration placeholder */}
                    </div>
                </div>
            </div>

            {/* Right Column - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-linear-to-br from-gray-50 to-white relative">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

                <div className="w-full max-w-md relative z-10">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-primary-500 to-primary-700 rounded-2xl mb-4 shadow-lg">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Task Manager</h1>
                    </div>

                    {/* Login Card */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 lg:p-10 border border-white/20">
                        {/* Header */}
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
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
                                <Input
                                    addonBefore="+91"
                                    placeholder="98765 43210"
                                    maxLength={10}
                                    prefix={<Phone className="w-4 h-4 text-gray-400" />}
                                    className="py-2.5 rounded-lg"
                                    onChange={(e) => {
                                        // Ensure only digits 
                                        const value = e.target.value.replace(/\D/g, '');
                                        // Logic to update if needed, but Form handles value. 
                                        // To enforce digits only in input display, we might need controlled component or formatter.
                                        // Simplest is let pattern rule handle validation or use type="tel"
                                    }}
                                />
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

                        {/* Footer */}
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <p className="text-center text-sm text-gray-600">
                                Protected by enterprise-grade security
                                <Shield className="inline-block w-4 h-4 ml-1 text-primary-600" />
                            </p>
                        </div>
                    </div>

                    {/* Bottom Text */}
                    <p className="text-center text-sm text-gray-500 mt-6">
                        © 2025 VCGreen Task Manager. All rights reserved.
                    </p>
                </div>
            </div>

            {/* Custom Styles */}
            <style jsx>{`
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
