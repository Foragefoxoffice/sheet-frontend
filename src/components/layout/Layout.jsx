import { useState, createContext, useContext } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import MobileMenu from './MobileMenu';

// Create context for sidebar state
const SidebarContext = createContext();

export const useSidebar = () => {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error('useSidebar must be used within SidebarProvider');
    }
    return context;
};

export default function Layout({ children }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

    return (
        <SidebarContext.Provider value={{ isSidebarExpanded, setIsSidebarExpanded }}>
            <div className="flex min-h-screen bg-gray-50">
                {/* Desktop Sidebar - Hidden on mobile */}
                <div className="hidden md:block">
                    <Sidebar />
                </div>

                {/* Mobile Menu */}
                <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

                {/* Main Content */}
                <main
                    className={`flex-1 transition-all duration-300 ${isSidebarExpanded ? 'md:ml-64' : 'md:ml-20'
                        }`}
                >
                    {/* Mobile Header */}
                    <div className="md:hidden sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-30">
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <Menu className="w-6 h-6 text-gray-700" />
                        </button>
                        <h1 className="text-lg font-semibold text-gray-900">Task Manager</h1>
                        <div className="w-10" /> {/* Spacer for centering */}
                    </div>

                    {/* Page Content */}
                    <div className="m-3 md:m-6 md:p-8 pb-20 md:pb-8">
                        {children}
                    </div>
                </main>

                {/* Mobile Bottom Navigation */}
                <MobileNav />
            </div>
        </SidebarContext.Provider>
    );
}
