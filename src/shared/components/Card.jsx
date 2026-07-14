/**
 * Card — adaptive base container component.
 *
 * Automatically responds to accessibility profile via CSS vars:
 *   --a11y-surface        background colour (warm cream for dyslexia, dark for low vision)
 *   --a11y-border-radius  corner shape (round vs square for autism)
 *   --a11y-border-width   border thickness
 *   --a11y-shadow         decorative shadows (removed for low vision)
 *   --a11y-transition     animation (disabled for autism)
 *   --a11y-spacing-section internal padding
 *
 * Teammates: always use this as a section wrapper instead of raw <div>
 *
 * Props:
 *   title: optional section heading
 *   icon: Lucide icon component (optional)
 *   iconColor: Tailwind bg class for icon circle (default 'bg-primary')
 *   onClick: makes card tappable
 *   className: extra Tailwind overrides
 *   children: card body
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

    const cardStyle = {
        background:    'var(--a11y-surface)',
        borderRadius:  'var(--a11y-border-radius)',
        boxShadow:     'var(--a11y-shadow)',
        borderWidth:   'var(--a11y-border-width)',
        borderStyle:   'solid',
        borderColor:   'rgba(0,0,0,0.07)',
        padding:       'var(--a11y-spacing-section)',
        transition:    'var(--a11y-transition)',
    };

    return (
        <div
            onClick={onClick}
            role={isInteractive ? 'button' : undefined}
            tabIndex={isInteractive ? 0 : undefined}
            style={cardStyle}
            className={`
                saha-card
                ${isInteractive ? 'cursor-pointer hover:brightness-95 active:scale-[0.99]' : ''}
                ${className}
            `}
        >
            {(title || Icon) && (
                <div className="flex items-center gap-3 mb-2">
                    {Icon && (
                        <div
                            className={`${iconColor} rounded-full flex items-center justify-center`}
                            style={{ width: 'calc(var(--a11y-icon-size) + 16px)', height: 'calc(var(--a11y-icon-size) + 16px)' }}
                        >
                            <Icon
                                className="text-white"
                                style={{ width: 'var(--a11y-icon-size)', height: 'var(--a11y-icon-size)' }}
                            />
                        </div>
                    )}
                    {title && (
                        <h3
                            className="font-semibold text-gray-800 dark:text-gray-100"
                            style={{
                                fontFamily: 'var(--a11y-font-heading)',
                                fontSize:   'var(--a11y-font-size-base)',
                            }}
                        >
                            {title}
                        </h3>
                    )}
                </div>
            )}
            {children}
        </div>
    );
}