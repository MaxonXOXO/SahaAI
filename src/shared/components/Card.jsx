/**
 * Base Card — generic container for grouped content.
 * Used in: Dashboard (Quick Access, Profile), Progress Dashboard,
 * Social Story, Routine Builder, etc.
 *
 * Props:
 * - title: optional heading text
 * - icon: optional Lucide icon component
 * - iconColor: tailwind class for icon background (e.g. 'bg-accent-dyslexia')
 * - onClick: makes the card tappable (adds hover/focus states)
 * - children: card body content
 * - className: extra styling hook
 */
export default function Card({
    title,
    icon: Icon,
    iconColor = 'bg-primary',
    onClick,
    children,
    className = '',
}) {
    const isInteractive = typeof onClick === 'function';

    return (
        <div
            onClick={onClick}
            role={isInteractive ? 'button' : undefined}
            tabIndex={isInteractive ? 0 : undefined}
            className={`
        bg-surface dark:bg-surface-dark rounded-card p-4 shadow-sm
        border border-gray-100 dark:border-gray-700
        ${isInteractive ? 'cursor-pointer hover:shadow-md active:scale-[0.98] transition-all' : ''}
        ${className}
      `}
        >
            {(title || Icon) && (
                <div className="flex items-center gap-3 mb-2">
                    {Icon && (
                        <div className={`${iconColor} rounded-full p-2 flex items-center justify-center`}>
                            <Icon size={18} className="text-white" />
                        </div>
                    )}
                    {title && (
                        <h3 className="text-base-sm font-semibold text-gray-800 dark:text-gray-100">
                            {title}
                        </h3>
                    )}
                </div>
            )}
            {children}
        </div>
    );
}