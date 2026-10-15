import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  children,
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded transition-all focus:outline-none select-none disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeClasses: Record<ButtonSize, string> = {
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3 py-1.5 text-xs gap-2',
    lg: 'px-4 py-2 text-sm gap-2',
  };

  const variantClasses: Record<ButtonVariant, string> = {
    primary:
      'bg-[#FF3B4E] hover:bg-[#e6354a] text-white shadow-sm shadow-red-500/20 active:translate-y-px',
    secondary:
      'bg-[#171C26] hover:bg-[#202735] text-[#F3F5F8] border border-[#293140] hover:border-[#3d4a5c]',
    ghost: 'bg-transparent hover:bg-[#171C26] text-[#9BA5B5] hover:text-[#F3F5F8]',
    danger:
      'bg-red-950/40 hover:bg-red-900/60 text-[#FF3B4E] border border-[#FF3B4E]/30',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
      {children}
    </button>
  );
}
