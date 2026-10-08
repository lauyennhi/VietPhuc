import React, { useEffect } from 'react';

export interface DialogProps {
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';
  bare?: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({
  title,
  description,
  size = '2xl',
  bare = false,
  onClose,
  children,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const sizeClasses: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    full: 'max-w-full',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Hộp thoại'}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#1F1B18]/50 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full ${sizeClasses[size] || 'max-w-2xl'} max-h-[90vh] overflow-y-auto animate-rise ${
          bare ? '' : 'rounded-3xl border border-[#E6DCCD] bg-[#FFFFFF] p-6 shadow-2xl'
        }`}
      >
        {!bare && (
          <div className="flex items-center justify-between pb-4 border-b border-[#E6DCCD] mb-4">
            {title && <h2 className="font-serif text-xl font-bold text-[#1F1B18]">{title}</h2>}
            <button
              type="button"
              onClick={onClose}
              className="press size-9 rounded-full border border-[#E6DCCD] hover:bg-[#F1EADF] text-[#736960] hover:text-[#1F1B18] flex items-center justify-center text-sm font-bold"
              aria-label="Đóng hộp thoại"
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};
