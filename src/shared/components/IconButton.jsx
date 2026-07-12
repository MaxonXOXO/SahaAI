import { motion } from 'framer-motion';

/**
 * IconButton — small circular icon-only button.
 * Used for: mic, listen, translate, OCR, floating AI assistant button
 * (seen bottom-right on nearly every screen), header actions.
 *
 * Props:
 * - icon: Lucide icon component (required)
 * - onClick
 * - variant: 'default' | 'primary' | 'floating'
 * - size: pixel size of the icon itself (button is always min-touch)
 * - label: aria-label (required for accessibility)
 */
const variants = {
    default: 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200',
    primary: 'bg-primary text-white hover:bg-primary-dark',
    floating: 'bg-primary text-white shadow-lg hover:bg-primary-dark',
};

export default function IconButton({
    icon: Icon,
    onClick,
    variant = 'default',
    size = 20,
    label,
    className = '',
    ...props
}) {
    return (
        <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onClick}
            aria-label={label}
            className={`
        min-h-touch min-w-touch flex items-center justify-center rounded-full
        transition-colors duration-150
        ${variants[variant]}
        ${variant === 'floating' ? 'fixed bottom-20 right-4 z-30' : ''}
        ${className}
      `}
            {...props}
        >
            <Icon size={size} />
        </motion.button>
    );
}