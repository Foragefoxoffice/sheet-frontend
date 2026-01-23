import { useRef, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function DeleteConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title = "Remove Item",
    message = "Are you sure you want to remove this item?",
    itemName = "",
    confirmText = "Remove",
    cancelText = "Cancel"
}) {
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
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] overflow-y-auto overflow-x-hidden">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4 text-center">
                <div
                    ref={modalRef}
                    className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all w-full max-w-sm p-6 animate-scaleIn"
                >

                    {/* Icon */}
                    <div className="flex justify-center mb-4">
                        <div className="bg-red-50 p-3 rounded-full">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="text-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            {message}
                        </p>
                        {itemName && (
                            <p className="text-gray-700 font-medium mt-1">"{itemName}"</p>
                        )}
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold rounded-xl transition-colors border border-gray-100"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 py-2.5 px-4 bg-[#FF0000] hover:bg-red-700 text-white font-semibold rounded-xl shadow-lg shadow-red-500/30 transition-all hover:scale-[1.02]"
                        >
                            {confirmText}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
