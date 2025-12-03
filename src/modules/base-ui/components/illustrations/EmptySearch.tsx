import * as React from 'react'

/**
 * EmptyIllustration – Concept B: magnifying glass over minimal coin stack.
 *
 * Props:
 *  - variant: stylistic/use-case variations (search, initial, date, graph)
 *  - size: pixel width (height auto from aspect ratio 160:140)
 *  - tone: color accent usage (neutral | accent)
 *  - animated: enable subtle motion (respects prefers-reduced-motion)
 *  - title / desc: accessibility (if omitted => decorative)
 */
export interface EmptyIllustrationProps extends React.SVGProps<SVGSVGElement> {
    variant?: 'search' | 'initial' | 'date' | 'graph'
    size?: number
    tone?: 'neutral' | 'accent'
    animated?: boolean
    title?: string
    desc?: string
    /** layout: compact keeps original proportions; wide introduces a panoramic scene */
    layout?: 'compact' | 'wide'
    /** show decorative background shapes (only in wide) */
    decorativeBackground?: boolean
}

const COMPACT_WIDTH = 160
const COMPACT_HEIGHT = 140
const WIDE_WIDTH = 400
const WIDE_HEIGHT = 220

export const EmptySearch: React.FC<EmptyIllustrationProps> = ({
    variant = 'initial',
    size = 600,
    tone = 'accent',
    animated = true,
    layout = 'wide',
    decorativeBackground = true,
    title,
    desc,
    style,
    className,
    ...rest
}) => {
    const id = React.useId()
    const titleId = title ? `${id}-title` : undefined
    const descId = desc ? `${id}-desc` : undefined

    // Derived colors using CSS variables (fallbacks provided)
    const stroke = 'var(--border, #d0d5dd)'
    const muted = 'var(--muted, #f5f7fa)'
    const mutedFg = 'var(--muted-foreground, #667085)'
    const primary = tone === 'accent' ? 'var(--primary, #6366f1)' : 'var(--accent, #94a3b8)'

    const aspectW = layout === 'wide' ? WIDE_WIDTH : COMPACT_WIDTH
    const aspectH = layout === 'wide' ? WIDE_HEIGHT : COMPACT_HEIGHT
    const h = (size / aspectW) * aspectH

    // Variant-specific accent tweak positions (can expand later)
    const accentDot = (() => {
        switch (variant) {
            case 'date':
                return { cx: 42, cy: 30 }
            case 'graph':
                return { cx: 122, cy: 92 }
            case 'initial':
                return { cx: 118, cy: 30 }
            case 'search':
            default:
                return { cx: 118, cy: 30 }
        }
    })()

    const animationClass = animated ? 'empty-illustration-anim' : undefined

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox={`0 0 ${aspectW} ${aspectH}`}
            width={size}
            height={h}
            role={title ? 'img' : 'presentation'}
            aria-hidden={title ? undefined : true}
            aria-labelledby={titleId}
            aria-describedby={descId}
            className={className}
            style={style}
            {...rest}
        >
            {title && <title id={titleId}>{title}</title>}
            {desc && <desc id={descId}>{desc}</desc>}
            {animated && (
                <style>
                    {`
                    @media (prefers-reduced-motion: no-preference) {
                        .empty-illustration-anim .lens-scale { animation: lensPulse 8s ease-in-out infinite; transform-origin: 80px 70px; }
                        .empty-illustration-anim .coin-float { animation: coinFloat 6s ease-in-out infinite; }
                    }
                    @keyframes lensPulse { 0%, 60%, 100% { transform: scale(1); } 30% { transform: scale(1.03); } }
                    @keyframes coinFloat { 0%, 100% { transform: translateY(0); opacity: .9; } 50% { transform: translateY(-6px); opacity: .4; } }
                `}
                </style>
            )}
            <defs>
                <radialGradient id={`${id}-rad`} cx="50%" cy="50%" r="65%">
                    <stop offset="0%" stopColor={tone === 'accent' ? primary : 'var(--background, #ffffff)'} stopOpacity={tone === 'accent' ? 0.15 : 0.08} />
                    <stop offset="100%" stopColor="var(--background, #ffffff)" stopOpacity={0} />
                </radialGradient>
                <linearGradient id={`${id}-lens`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={primary} stopOpacity={tone === 'accent' ? 0.35 : 0.25} />
                    <stop offset="100%" stopColor={primary} stopOpacity={tone === 'accent' ? 0.05 : 0.02} />
                </linearGradient>
                <filter id={`${id}-soft`} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
                    <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.25 0" />
                </filter>
                <pattern id={`${id}-dots`} width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(25)">
                    <circle cx="2" cy="2" r="1" fill={primary} opacity={0.18} />
                </pattern>
            </defs>

            {layout === 'wide' && decorativeBackground && (
                <g opacity={0.7}>
                    <rect x={0} y={0} width={aspectW} height={aspectH} fill={`url(#${id}-rad)`} />
                    {/* layered soft blobs */}
                    <g fill={primary} opacity={tone === 'accent' ? 0.12 : 0.07} filter={`url(#${id}-soft)`}>
                        <circle cx={aspectW * 0.18} cy={aspectH * 0.65} r={48} />
                        <circle cx={aspectW * 0.72} cy={aspectH * 0.42} r={54} />
                        <circle cx={aspectW * 0.52} cy={aspectH * 0.78} r={36} />
                    </g>
                    <rect x={aspectW * 0.05} y={aspectH * 0.12} width={aspectW * 0.9} height={aspectH * 0.76} rx={28} fill={`url(#${id}-dots)`} opacity={0.07} />
                </g>
            )}

            {/* Background subtle dashed circle / reposition for wide */}
            <circle
                cx={layout === 'wide' ? aspectW / 2 : 80}
                cy={layout === 'wide' ? aspectH / 2 - 10 : 70}
                r={layout === 'wide' ? 90 : 56}
                fill="none"
                stroke={stroke}
                strokeWidth={layout === 'wide' ? 2.5 : 2}
                strokeDasharray={layout === 'wide' ? '8 14' : '5 8'}
                strokeLinecap="round"
                opacity={0.25}
            />

            {/* Coin stack (enhanced) */}
            <g
                transform={layout === 'wide' ? `translate(${aspectW / 2 - 80} ${aspectH / 2 + 4})` : 'translate(38 46)'}
                stroke={stroke}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <ellipse cx={30} cy={34} rx={22} ry={8} fill={muted} />
                <path d="M8 34v10c0 4.4 10 8 22 8s22-3.6 22-8V34" fill="url(#${id}-lens)" />
                <path d="M8 44c0 4.4 10 8 22 8s22-3.6 22-8" opacity={0.4} />
                <path d="M8 38c0 4.4 10 8 22 8s22-3.6 22-8" opacity={0.7} />
                {/* mini floating coin placeholder */}
                <g transform="translate(64 -10)" opacity={0.65}>
                    <circle cx={10} cy={10} r={10} fill={muted} stroke={stroke} />
                    <path d="M4 10h12" stroke={primary} strokeWidth={2} />
                </g>
            </g>

            {/* Magnifying glass */}
            <g
                className={`lens-scale ${animationClass ? 'lens-scale' : ''}`.trim()}
                transform={layout === 'wide' ? `translate(${aspectW / 2 - 0} ${aspectH / 2 - 10})` : undefined}
            >
                {layout === 'wide' && (
                    <circle
                        cx={0}
                        cy={0}
                        r={48}
                        fill={`url(#${id}-lens)`}
                        stroke={mutedFg}
                        strokeWidth={3}
                        opacity={0.55}
                    />
                )}
                <circle
                    cx={layout === 'wide' ? 0 : 80}
                    cy={layout === 'wide' ? 0 : 70}
                    r={30}
                    fill="none"
                    stroke={mutedFg}
                    strokeWidth={3}
                />
                <circle cx={layout === 'wide' ? 0 : 80} cy={layout === 'wide' ? 0 : 70} r={18} fill="none" stroke={mutedFg} strokeWidth={2} opacity={0.4} />
                <path
                    d={layout === 'wide' ? 'M21 21l24 24' : 'M101 91l18 18'}
                    stroke={mutedFg}
                    strokeWidth={5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                {/* highlight arc */}
                <path
                    d={layout === 'wide' ? 'M-14 -10c8-14 30-16 40-4' : 'M66 60c6-10 22-12 30-4'}
                    stroke={primary}
                    strokeWidth={2}
                    strokeLinecap="round"
                    fill="none"
                    opacity={tone === 'accent' ? 0.9 : 0.5}
                />
            </g>

            {/* Floating sparkle/coin accent */}
            <g className={animated ? 'coin-float' : undefined}>
                <circle
                    cx={layout === 'wide' ? aspectW / 2 + 90 : accentDot.cx}
                    cy={layout === 'wide' ? aspectH / 2 - 60 : accentDot.cy}
                    r={6}
                    fill={primary}
                    opacity={tone === 'accent' ? 0.9 : 0.5}
                />
                <circle
                    cx={layout === 'wide' ? aspectW / 2 + 90 : accentDot.cx}
                    cy={layout === 'wide' ? aspectH / 2 - 60 : accentDot.cy}
                    r={10}
                    fill="none"
                    stroke={primary}
                    strokeWidth={2}
                    opacity={0.25}
                />
            </g>

            {/* Optional variant-specific minimal overlays */}
            {variant === 'date' && (
                <g stroke={stroke} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" opacity={0.55} transform="translate(18 14)">
                    <rect x={0} y={0} width={44} height={38} rx={4} fill={muted} />
                    <path d="M0 10h44" />
                    <path d="M8 4v8M20 4v8M32 4v8" opacity={0.5} />
                    <rect x={10} y={18} width={8} height={8} rx={2} fill={primary} opacity={0.4} />
                </g>
            )}
            {variant === 'graph' && (
                <g
                    stroke={stroke}
                    strokeWidth={2}
                    fill="none"
                    strokeLinecap="round"
                    opacity={0.6}
                    transform={layout === 'wide' ? `translate(${aspectW / 2 - 120} ${aspectH / 2 - 90})` : 'translate(20 18)'}
                >
                    <path d="M0 60h180" opacity={0.25} />
                    <path
                        d="M4 52l18-32 24 20 16-28 20 14 22-18 24 30"
                        stroke={primary}
                        strokeWidth={2}
                        strokeLinejoin="round"
                        opacity={0.7}
                    />
                    <circle cx={148} cy={24} r={5} fill={primary} stroke="none" />
                </g>
            )}
            {layout === 'wide' && (
                <g
                    fontFamily="system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,sans-serif"
                    fontSize={14}
                    fill={mutedFg}
                    textAnchor="start"
                    opacity={0.7}
                >
                    <text x={aspectW / 2 + 60} y={aspectH / 2 + 20} fontWeight={500} opacity={0.9}>
                        No Data Yet
                    </text>
                    <text x={aspectW / 2 + 60} y={aspectH / 2 + 42} fontSize={12} opacity={0.7}>
                        Start adding transactions
                    </text>
                    <text x={aspectW / 2 + 60} y={aspectH / 2 + 58} fontSize={12} opacity={0.55}>
                        or adjust your filters
                    </text>
                </g>
            )}
        </svg>
    )
}

// Backward compatible export (previous component name)
export const Empty = EmptySearch

export default EmptySearch;