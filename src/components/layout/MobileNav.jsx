import { Home, CheckSquare, PlusCircle, ClipboardCheck, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function MobileNav() {
    const location = useLocation();

    const navItems = [
        {
            path: '/dashboard',
            icon: Home,
            label: 'Home',
        },
        {
            path: '/tasks',
            icon: CheckSquare,
            label: 'My Tasks',
        },
        {
            path: '/create-task',
            icon: PlusCircle,
            label: 'Create',
        },
        {
            path: '/approvals',
            icon: ClipboardCheck,
            label: 'Approvals',
        },
        {
            path: '/profile',
            icon: User,
            label: 'Profile',
        },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${active
                                    ? 'text-primary'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <Icon className={`w-6 h-6 mb-1 ${active ? 'stroke-2' : 'stroke-1.5'}`} />
                            <span className={`text-xs ${active ? 'font-semibold' : 'font-normal'}`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
