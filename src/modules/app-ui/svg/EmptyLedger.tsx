import * as React from 'react'

export interface EmptyLedgerProps extends React.SVGProps<SVGSVGElement> {
    size?: number
    tone?: 'neutral' | 'accent'
    animated?: boolean
    title?: string
    desc?: string
}

const W = 200
const H = 160

export const EmptyLedger: React.FC<EmptyLedgerProps> = ({
    size = 200,
    tone = 'neutral',
    animated = true,
    title,
    desc,
    ...rest
}) => {
    const id = React.useId()
    const h = (size / W) * H
    const primary = tone === 'accent' ? 'var(--primary,#6366f1)' : 'var(--accent,#94a3b8)'
    const stroke = 'var(--border,#d0d5dd)'
    const muted = 'var(--muted,#f5f7fa)'

    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox={`0 0 ${W} ${H}`}
            width={size}
            height={h}
            role={title ? 'img' : 'presentation'}
            aria-hidden={title ? undefined : true}
            aria-labelledby={title ? id + '-t' : undefined}
            aria-describedby={desc ? id + '-d' : undefined}
            {...rest}
        >
            {title && <title id={id + '-t'}>{title}</title>}
            {desc && <desc id={id + '-d'}>{desc}</desc>}
            {animated && (
                <style>{`@media (prefers-reduced-motion:no-preference){.ledger-fade line{animation:fadeRow 5s ease-in-out infinite;} .ledger-fade line:nth-child(2){animation-delay:1s}.ledger-fade line:nth-child(3){animation-delay:2s}@keyframes fadeRow{0%,100%{opacity:.15}50%{opacity:.55}}}`}</style>
            )}
            <rect x={20} y={18} width={W - 40} height={H - 36} rx={16} fill={muted} stroke={stroke} />
            <rect x={20} y={18} width={W - 40} height={40} rx={16} fill={`url(#grad-${id})`} stroke={stroke} />
            <defs>
                <linearGradient id={`grad-${id}`} x1='0%' y1='0%' x2='0%' y2='100%'>
                    <stop offset='0%' stopColor={primary} stopOpacity={0.18} />
                    <stop offset='100%' stopColor={primary} stopOpacity={0.04} />
                </linearGradient>
            </defs>
            <g className='ledger-fade' stroke={stroke} strokeWidth={2} strokeLinecap='round'>
                <line x1={50} x2={W - 60} y1={80} y2={80} />
                <line x1={50} x2={W - 60} y1={104} y2={104} />
                <line x1={50} x2={W - 120} y1={128} y2={128} />
            </g>
            <circle cx={50} cy={40} r={10} fill={primary} opacity={0.5} />
            <rect x={70} y={32} rx={4} width={70} height={16} fill='white' opacity={0.6} />
            <rect x={145} y={32} rx={4} width={30} height={16} fill='white' opacity={0.4} />
            <text x={W / 2} y={150} fontFamily='system-ui' fontSize={12} fill={primary} textAnchor='middle' opacity={0.6}>Nothing here yet</text>
        </svg>
    )
}

export default EmptyLedger
