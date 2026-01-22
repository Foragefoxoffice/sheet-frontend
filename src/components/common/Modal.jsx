import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';

export default function Modal({ isOpen, onClose, title, children, size = 'medium' }) {
    const modalRef = useRef(null);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizeClasses = {
        small: 'max-w-md',
        medium: 'max-w-2xl',
        large: 'max-w-4xl',
        xl: 'max-w-6xl',
        full: 'max-w-[95vw]'
    };

    const maxWidthClass = sizeClasses[size] || sizeClasses.medium;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity animate-fadeIn"
                onClick={onClose}
                aria-hidden="true"
            ></div>

            {/* Modal Position Wrapper */}
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
                {/* Modal Content */}
                <div
                    ref={modalRef}
                    className={`
                        relative transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all 
                        w-full ${maxWidthClass} max-h-[90vh] flex flex-col animate-scaleIn
                        border border-white/50 ring-1 ring-black/5
                    `}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-title"
                >
                    {/* Header */}
                    <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-2 md:py-5 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
                        <div>
                            <h2
                                id="modal-title"
                                className="text-xl font-bold text-[#253094] tracking-tight"
                            >
                                {title}
                            </h2>
                            {/* Optional: We could add a subtitle prop later if needed, but for now we keep it simple */}
                        </div>

                        <button
                            onClick={onClose}
                            className="group rounded-full p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 outline-none focus:ring-2 focus:ring-primary-100"
                            aria-label="Close modal"
                        >
                            <X className="w-5 h-5 transition-transform group-hover:rotate-90 group-hover:scale-110" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="px-3 md:px-8 py-3 md:py-8 overflow-y-auto nice-scrollbar flex-1 bg-gradient-to-b from-white to-gray-50/30">
                        {children}
                    </div>

                    {/* Decorative bottom bar (optional, adds premium feel) */}
                    <div className="h-1.5 w-full bg-gradient-to-r from-primary-300 via-primary-500 to-primary-300 opacity-20"></div>
                </div>
            </div>
        </div>
    );
}
