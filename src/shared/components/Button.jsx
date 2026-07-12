import { motion } from 'framer-motion';

/**
 * Base Button — used across all features.
 * Respects accessibility profile: min touch target 48px, scalable text.
 *
 * Props:
 * - variant: 'primary' | 'secondary' | 'ghost' | 'danger'
 * - size: 'md' | 'lg' (lg = accessibility-friendly default)
 * - icon: optional Lucide icon component
 * - onClick, disabled, children
 */
const variants = {
    primary: 'bg-primary text-white hover:bg-primary-dark',
    secondary: 'bg-white text-primary border-2 border-primary hover:bg-primary/5',
    ghost: 'bg-transparent text-primary hover:bg-primary/10',
    danger: 'bg-red-500 text-white hover:bg-red-600',
};

const sizes = {
    md: 'px-4 py-2 text-base-sm min-h-touch',
    lg: 'px-6 py-3 text-base-md min-h-touch',
};

export default function Button({
    children,
    variant = 'primary',
    size = 'lg',
    icon: Icon,
    onClick,
    disabled = false,
    className = '',
    ...props
}) {
    return (
        <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onClick}
            disabled={disabled}
            className={`
        rounded-card font-semibold flex items-center justify-center gap-2
        transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
            {...props}
        >
            {Icon && <Icon size={20} />}
            {children}
        </motion.button>
    );
}