import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Alert } from 'antd';
import { Lock, ArrowRight, Smartphone, CheckCircle2, Sparkles } from 'lucide-react';
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
    const showcaseTask = {
        _id: 'showcase-task',
        sno: 101,
        task: 'Review Q4 Strategic Goals',
        priority: 'High',
        status: TASK_STATUS.IN_PROGRESS,
        assignedToName: 'Sarah Wilson',
        createdBy: {
            name: 'David Miller',
            designation: 'Senior Manager'
        },
        dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
        approvalStatus: 'Pending',
        notes: 'Finalize the project roadmap for the next quarter.',
        isSelfTask: false,
        comments: [
            { createdByName: 'David', text: 'Looking ahead to a great quarter!', createdAt: new Date().toISOString() }
        ]
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row overflow-hidden bg-white selection:bg-primary-100 selection:text-primary-700">
            {/* Left Column - Premium Showcase */}
            <div className="hidden lg:flex lg:w-7/12 relative bg-[#0B0F19] overflow-hidden items-center justify-center p-12 lg:p-20">
                {/* Dynamic Background Elements */}
                <div className="absolute inset-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary-600/30 rounded-full blur-[120px] animate-pulse-slow"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[100px] animate-pulse-slow delay-1000"></div>
                </div>

                {/* Animated Grid Overlay */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-150 brightness-100"></div>
                <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)`,
                    backgroundSize: '40px 40px'
                }}></div>

                {/* Showcase Content */}
                <div className="relative z-10 w-full max-w-2xl flex flex-col gap-8">
                    <div className="space-y-8">
                        <div className="flex flex-col mb-2 sm:flex-row sm:items-center gap-3 pt-4">
                            <div className="mb-3 inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-inner">
                                <Sparkles className="w-4 h-4 text-primary-400" />
                                <span className="text-xs font-bold text-primary-200 uppercase tracking-[0.2em]">Efficiency Redefined</span>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                                <div className="flex -space-x-4">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="w-9 h-9 rounded-full border-4 border-[#0B0F19] bg-slate-800 shadow-xl overflow-hidden active:scale-95 transition-transform cursor-pointer">
                                            <img
                                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`}
                                                alt="user"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ))}
                                    <div className="w-10 h-10 rounded-full border-4 border-[#0B0F19] bg-primary-600 flex items-center justify-center text-xs font-bold text-white shadow-xl">
                                        +12
                                    </div>
                                </div>
                            </div>
                        </div>

                        <h1 style={{ marginBottom: "13px" }} className="text-5xl lg:text-6xl font-extrabold text-white leading-[1.05] tracking-tight">
                            Master your tasks <br />
                            with precision.
                        </h1>
                        <p className="text-lg text-slate-400 max-w-lg leading-relaxed font-medium">
                            A high-performance command center for teams who demand excellence and streamlined operations.
                        </p>
                    </div>

                    {/* Floating Showcase Card */}
                    <div className="relative group perspective-1000">
                        <div className="absolute -inset-4 bg-gradient-to-tr from-primary-500/30 to-purple-600/30 rounded-[32px] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                        <div className="relative bg-white/5 backdrop-blur-2xl rounded-[28px] border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-700 hover:scale-[1.02] hover:-rotate-y-3">
                            <div className="p-2">
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

                        {/* Decorative Badges */}
                        <div className="absolute -right-12 -top-12 animate-float pointer-events-none hidden xl:block">
                            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-5 flex items-center gap-4 border border-white/20">
                                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-600">
                                    <CheckCircle2 className="w-7 h-7" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Efficiency</div>
                                    <div className="text-lg font-extrabold text-slate-900">+42% Growth</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column - Login Form */}
            <div className="w-full sticky top-0 lg:w-5/12 flex items-center justify-center p-8 bg-slate-50 relative min-h-screen">
                {/* Background Shapes */}
                <div className="absolute top-0 right-0 p-12 overflow-hidden pointer-events-none opacity-20 lg:opacity-40 scale-150 transform translate-x-1/4 -translate-y-1/4">
                    <svg width="400" height="400" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="200" cy="200" r="150" stroke="currentColor" strokeWidth="0.5" className="text-primary-200" />
                        <circle cx="200" cy="200" r="100" stroke="currentColor" strokeWidth="1" className="text-primary-300" />
                        <circle cx="200" cy="200" r="50" stroke="currentColor" strokeWidth="2" className="text-primary-400" />
                    </svg>
                </div>

                <div className="w-full max-w-[460px] relative z-10">
                    {/* Header */}
                    <div className="mb-4 md:mb-8 text-center lg:text-left space-y-6">
                        <div className="flex justify-center lg:justify-start">
                            <div className="relative group cursor-pointer inline-block">
                                <div className="absolute -inset-4 bg-primary-500/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <img src="/logo.png" alt="Logo" className="h-16 w-auto object-contain relative" />
                                <div className="absolute -right-1 -top-1 w-3 h-3 bg-primary-500 rounded-full border-2 border-slate-50 animate-bounce"></div>
                            </div>
                        </div>
                        <div className='text-center'>
                            <h2 style={{ marginBottom: "10px" }} className="text-3xl lg:text-5xl font-black text-slate-900 mb-0 tracking-tight">Welcome Back</h2>
                            <p className="text-slate-500 text-lg font-medium">Enter your credentials to manage your workflow</p>
                        </div>
                    </div>

                    {/* Login Card */}
                    <div className="bg-white rounded-[40px] shadow-[0_32px_80px_-16px_rgba(37,48,148,0.12)] p-8 lg:p-12 border border-slate-100">
                        {error && (
                            <Alert
                                message={error}
                                type="error"
                                showIcon
                                className="mb-10 rounded-2xl border-red-100 bg-red-50/50 text-red-700 animate-shake py-4"
                            />
                        )}

                        <Form
                            name="login"
                            onFinish={onFinish}
                            layout="vertical"
                            size="large"
                            requiredMark={false}
                            className="space-y-6"
                        >
                            <Form.Item
                                label={<span className="text-md font-black text-[#2a2a2a] ml-1 uppercase tracking-widest">WhatsApp Number</span>}
                                name="whatsapp"
                                rules={[
                                    { required: true, message: 'Please enter your WhatsApp number' },
                                    { len: 10, message: 'Must be a 10-digit number' },
                                    { pattern: /^\d+$/, message: 'Digits only' }
                                ]}
                                className="mb-6"
                            >
                                <Input
                                    prefix={<Smartphone className="w-5 h-5 text-slate-400 mr-2" />}
                                    addonBefore={<span className="font-extrabold text-primary-600 px-2">+91</span>}
                                    placeholder="98765 43210"
                                    maxLength={10}
                                    className="h-16 rounded-[20px] border-slate-200 hover:border-primary-400 focus:border-primary-500 transition-all text-xl font-bold px-4"
                                />
                            </Form.Item>

                            <Form.Item
                                label={<span className="text-md font-black text-[#2a2a2a] ml-1 uppercase tracking-widest">Secure Password</span>}
                                name="password"
                                rules={[{ required: true, message: 'Please enter your password' }]}
                            >
                                <Input.Password
                                    placeholder="••••••••"
                                    prefix={<Lock className="w-5 h-5 text-slate-400 mr-2" />}
                                    className="h-12 rounded-[20px] border-slate-200 hover:border-primary-400 focus:border-primary-500 transition-all text-xl px-4"
                                />
                            </Form.Item>

                            <div className="pt-6">
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={loading}
                                    className="w-full h-16 bg-primary-700 hover:bg-primary-800 border-none shadow-[0_20px_40px_rgba(37,48,148,0.25)] hover:shadow-[0_25px_50px_rgba(37,48,148,0.35)] transition-all duration-500 transform hover:-translate-y-1.5 rounded-[20px] font-black text-xl flex items-center justify-center gap-4 group"
                                >
                                    Login to Dashboard
                                    <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
                                </Button>
                            </div>
                        </Form>
                    </div>

                    {/* Footer Links */}
                    <div className="mt-12 text-center">
                        <p className="text-slate-500 font-bold">
                            Restricted access? <a href="#" className="text-primary-600 hover:text-primary-700 underline decoration-primary-200 underline-offset-4 transition-all hover:decoration-primary-600">Contact IT Support</a>
                        </p>
                    </div>
                </div>

                {/* Mobile Tablet Footer Branding */}
                <div className="lg:hidden absolute bottom-0 left-0 right-0 text-center">
                    <p className="text-slate-400 text-[10px] font-black tracking-[0.3em] uppercase opacity-50">Enterprise Resource Management</p>
                </div>
            </div>

            {/* Custom Styles */}
            <style>{`
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.3; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.1); }
                }

                @keyframes float {
                    0%, 100% { transform: translateY(0) rotate(0); }
                    50% { transform: translateY(-15px) rotate(2deg); }
                }

                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    20%, 60% { transform: translateX(-5px); }
                    40%, 80% { transform: translateX(5px); }
                }

                .animate-pulse-slow {
                    animation: pulse-slow 8s infinite ease-in-out;
                }

                .animate-float {
                    animation: float 6s infinite ease-in-out;
                }

                .animate-shake {
                    animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
                }

                .perspective-1000 {
                    perspective: 1000px;
                }

                .rotate-x-2 {
                    transform: rotateX(2deg);
                }

                .rotate-y-2 {
                    transform: rotateY(2deg);
                }

                /* Ant Design Overrides specifically for this page */
                .ant-input-group-addon {
                    background: transparent !important;
                    border-right: none !important;
                    padding-right: 0 !important;
                    border-radius: 16px 0 0 16px !important;
                    border-color: #e2e8f0 !important;
                }

                .ant-form-large .ant-form-item .ant-form-item-control-input{
                    height: 20px !important;
                }
                
                .ant-input-affix-wrapper {
                     border-radius: 16px !important;
                }

                .ant-input-group > .ant-input:last-child {
                    border-left: none !important;
                    border-radius: 0 16px 16px 0 !important;
                }

                .ant-form-item-label label {
                    padding-bottom: 8px !important;
                }
            `}</style>
        </div>
    );
}
