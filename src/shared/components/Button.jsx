/**
 * Button — adaptive base component.
 *
 * Automatically responds to accessibility profile changes via CSS vars:
 *   --a11y-min-touch    controls minimum height/width
 *   --a11y-border-radius controls shape
 *   --a11y-primary       controls primary colour
 *   --a11y-transition    controls animation (disabled for autism mode)
 *   --a11y-font-body     controls font (OpenDyslexic in dyslexia mode)
 *   --a11y-font-size-base controls size (larger in low-vision mode)
 *
 * Teammates: always use this instead of raw <button>
 *
 * Props:
 *   variant: 'primary' | 'secondary' | 'ghost' | 'danger'
 *   size: 'sm' | 'md' | 'lg'
 *   icon: Lucide icon component (optional)
 *   iconOnly: true — renders icon with screen-reader label only
 *   label: aria-label for icon-only buttons
 *   onClick, disabled, className, children
 */
export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    icon: Icon,
    iconOnly = false,
    label,
    onClick,
    disabled = false,
    className = '',
    type = 'button',
    ...props
}) {
    const baseStyle = {
        fontFamily:    'var(--a11y-font-body)',
        fontSize:      size === 'lg' ? 'var(--a11y-font-size-md)' : 'var(--a11y-font-size-base)',
        borderRadius:  'var(--a11y-border-radius)',
        minHeight:     'var(--a11y-min-touch)',
        minWidth:      iconOnly ? 'var(--a11y-min-touch)' : undefined,
        transition:    'var(--a11y-transition)',
        letterSpacing: 'var(--a11y-letter-spacing)',
    };

    const variantClasses = {
        primary:   'bg-primary text-white hover:brightness-110 active:brightness-90',
        secondary: 'bg-transparent text-primary border-2 border-primary/40 hover:border-primary hover:bg-primary/5',
        ghost:     'bg-transparent hover:bg-primary/10',
        danger:    'bg-red-500 text-white hover:bg-red-600',
    };

    const sizeClasses = {
        sm: 'px-3 py-1 text-sm',
        md: 'px-5 py-2 font-semibold',
        lg: 'px-6 py-3 font-bold w-full',
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            aria-label={iconOnly ? (label || children) : label}
            style={baseStyle}
            className={`
                saha-btn inline-flex items-center justify-center gap-2 cursor-pointer
                disabled:opacity-50 disabled:cursor-not-allowed
                ${variantClasses[variant]}
                ${sizeClasses[size]}
                ${className}
            `}
            {...props}
        >
            {Icon && <Icon style={{ width: 'var(--a11y-icon-size)', height: 'var(--a11y-icon-size)' }} />}
            {!iconOnly && children}
        </button>
    );
}