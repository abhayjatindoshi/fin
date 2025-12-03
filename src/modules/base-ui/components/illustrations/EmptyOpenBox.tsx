import * as React from 'react'

export interface EmptyOpenBoxProps extends React.SVGProps<SVGSVGElement> {
    size?: number
    tone?: 'neutral' | 'accent'
    animated?: boolean
    title?: string
    desc?: string
    glow?: boolean
    sparkles?: boolean | number
    sheen?: boolean
}

const W = 220, H = 180
export const EmptyOpenBox: React.FC<EmptyOpenBoxProps> = ({
    size = 220,
    tone = 'neutral',
    animated = true,
    title,
    desc,
    glow = true,
    sparkles = true,
    sheen = true,
    ...rest
}) => {
    const id = React.useId();
    const h = (size / W) * H
    const primary = tone === 'accent' ? 'var(--primary,#6366f1)' : 'var(--accent,#94a3b8)'
    const stroke = 'var(--border,#d0d5dd)'
    const sparkleCount = typeof sparkles === 'number' ? sparkles : (sparkles ? 3 : 0)
    return <svg xmlns='http://www.w3.org/2000/svg' viewBox={`0 0 ${W} ${H}`} width={size} height={h}
        role={title ? 'img' : 'presentation'} aria-hidden={title ? undefined : true} aria-labelledby={title ? `${id}-t` : undefined} aria-describedby={desc ? `${id}-d` : undefined} {...rest}>
        {title && <title id={`${id}-t`}>{title}</title>}
        {desc && <desc id={`${id}-d`}>{desc}</desc>}
        {animated && <style>{`@media (prefers-reduced-motion:no-preference){
            .float-up{animation:floatUp 7s ease-in-out infinite;will-change:transform,opacity}
            .float-up:nth-child(2){animation-delay:1.4s}
            .float-up:nth-child(3){animation-delay:2.8s}
            .float-up:nth-child(4){animation-delay:4.2s}
            .float-up:nth-child(5){animation-delay:5.6s}
            .sparkle{animation:sparklePulse 7s ease-in-out infinite;transform-origin:center center}
            .sparkle:nth-child(2){animation-delay:2s}
            .sparkle:nth-child(3){animation-delay:3.5s}
            .sheen{animation:sheenSlide 7.5s linear infinite}
            @keyframes floatUp{0%,100%{transform:translateY(0) translateX(0);opacity:.9}25%{transform:translateY(-10px) translateX(-2px)}50%{transform:translateY(-20px) translateX(2px);opacity:.3}75%{transform:translateY(-10px) translateX(-1px)}}
            @keyframes sparklePulse{0%,100%{transform:scale(.2) rotate(0deg);opacity:0}10%{opacity:1}40%{transform:scale(1) rotate(45deg);opacity:.95}60%{opacity:0}}
            @keyframes sheenSlide{0%{transform:translateX(-130%)}55%{transform:translateX(130%)}56%,100%{transform:translateX(160%)}}
        }`}</style>}
        <defs>
            <linearGradient id={`grad-lid-${id}`} x1='0%' y1='0%' x2='100%' y2='100%'>
                <stop offset='0%' stopColor={primary} stopOpacity={0.25} />
                <stop offset='100%' stopColor={primary} stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id={`grad-left-${id}`} x1='0%' y1='0%' x2='0%' y2='100%'>
                <stop offset='0%' stopColor={primary} stopOpacity={0.22} />
                <stop offset='100%' stopColor={primary} stopOpacity={0.06} />
            </linearGradient>
            <linearGradient id={`grad-right-${id}`} x1='0%' y1='0%' x2='0%' y2='100%'>
                <stop offset='0%' stopColor={primary} stopOpacity={0.18} />
                <stop offset='100%' stopColor={primary} stopOpacity={0.04} />
            </linearGradient>
            <radialGradient id={`rad-floor-${id}`} cx='50%' cy='55%' r='65%'>
                <stop offset='0%' stopColor={primary} stopOpacity={0.15} />
                <stop offset='100%' stopColor={primary} stopOpacity={0} />
            </radialGradient>
            <linearGradient id={`grad-sheen-${id}`} x1='0%' y1='0%' x2='100%' y2='0%'>
                <stop offset='0%' stopColor='#fff' stopOpacity={0} />
                <stop offset='45%' stopColor='#fff' stopOpacity={0.45} />
                <stop offset='60%' stopColor='#fff' stopOpacity={0} />
                <stop offset='100%' stopColor='#fff' stopOpacity={0} />
            </linearGradient>
            <radialGradient id={`rad-glow-${id}`} cx='50%' cy='55%' r='60%'>
                <stop offset='0%' stopColor={primary} stopOpacity={0.12} />
                <stop offset='100%' stopColor={primary} stopOpacity={0} />
            </radialGradient>
            <radialGradient id={`shadow-${id}`} cx='50%' cy='50%' r='50%'>
                <stop offset='0%' stopColor='rgba(0,0,0,0.38)' />
                <stop offset='55%' stopColor='rgba(0,0,0,0.25)' />
                <stop offset='100%' stopColor='rgba(0,0,0,0)' />
            </radialGradient>
        </defs>
        {glow && <rect x={0} y={0} width={W} height={H} fill={`url(#rad-glow-${id})`} opacity={0.3} />}
        {/* Soft shadow */}
        <ellipse cx={110} cy={150} rx={78} ry={16} fill={`url(#shadow-${id})`} />
        {/* Box group with separated faces */}
        <g strokeLinecap='round' strokeLinejoin='round'>
            {/* Lid */}
            <path d='M60 70 110 50 160 70 110 90Z' fill={`url(#grad-lid-${id})`} stroke={stroke} strokeWidth={1.6} />
            {/* Interior floor highlight (smaller diamond) */}
            <path d='M72 70 110 56 148 70 110 84Z' fill={`url(#rad-floor-${id})`} opacity={0.55} stroke='none' />
            {/* Left face */}
            <path d='M60 70 60 120 110 140 110 90Z' fill={`url(#grad-left-${id})`} stroke={stroke} strokeWidth={2.1} />
            {/* Right face */}
            <path d='M160 70 160 120 110 140 110 90Z' fill={`url(#grad-right-${id})`} stroke={stroke} strokeWidth={1.7} />
            {/* Front edge (top opening) */}
            <path d='M60 70 110 90 160 70' stroke={stroke} strokeWidth={1.4} fill='none' opacity={0.9} />
            {/* Center vertical separator */}
            <path d='M110 50 110 140' stroke={stroke} strokeWidth={1.4} opacity={0.45} />
            {/* Front lower ridge */}
            <path d='M60 120 110 140 160 120' stroke={stroke} strokeWidth={1.6} fill='none' />
            {sheen && <g className={animated ? 'sheen' : undefined} clipPath={`url(#clip-sheen-${id})`}>
                <path d='M60 120 110 140 160 120' stroke={`url(#grad-sheen-${id})`} strokeWidth={4} />
            </g>}
            <clipPath id={`clip-sheen-${id}`}><path d='M60 120 110 140 160 120 160 118 110 138 60 118Z' /></clipPath>
        </g>
        {/* Floating items (original + new receipt & tag) */}
        <g className='float-container'>
            <g fill={primary} stroke='none'>
                {/* Adjusted items start slightly higher for depth */}
                <rect className='float-up' x={52} y={112} width={18} height={14} rx={3} />
                <rect className='float-up' x={164} y={114} width={16} height={16} rx={4} />
                <circle className='float-up' cx={122} cy={112} r={8} />
                {/* receipt */}
                <g className='float-up' transform='translate(88 108) rotate(-6)'>
                    <rect x={0} y={0} width={18} height={24} rx={3} fill={primary} opacity={0.55} />
                    <line x1={4} x2={14} y1={7} y2={7} stroke='white' strokeWidth={2} strokeLinecap='round' />
                    <line x1={4} x2={12} y1={13} y2={13} stroke='white' strokeWidth={2} strokeLinecap='round' opacity={0.75} />
                </g>
                {/* tag */}
                <g className='float-up' transform='translate(142 104) rotate(10)'>
                    <rect x={0} y={0} width={16} height={22} rx={4} fill={primary} opacity={0.5} />
                    <circle cx={8} cy={7} r={2.2} fill='white' opacity={0.85} />
                </g>
            </g>
            <g fill='none' stroke={primary} opacity={0.32} strokeWidth={2}>
                <rect x={52} y={112} width={18} height={14} rx={3} />
                <rect x={164} y={114} width={16} height={16} rx={4} />
                <circle cx={122} cy={112} r={8} />
                <rect x={88} y={108} width={18} height={24} rx={3} />
                <rect x={142} y={104} width={16} height={22} rx={4} />
            </g>
        </g>
        {/* Sparkles */}
        {sparkleCount > 0 && (
            <g>
                {Array.from({ length: sparkleCount }).map((_, i) => {
                    const angle = (i / sparkleCount) * Math.PI * 2
                    const radius = 38 + (i % 2) * 8
                    const cx = 110 + Math.cos(angle) * radius
                    const cy = 70 + Math.sin(angle) * (radius * 0.55)
                    return (
                        <g key={i} className={animated ? 'sparkle' : undefined} transform={`translate(${cx} ${cy})`} opacity={0.9}>
                            <path d='M0 -5 L1.6 -1.6 5 0 1.6 1.6 0 5 -1.6 1.6 -5 0 -1.6 -1.6Z' fill={primary} />
                            <circle cx={0} cy={0} r={1.6} fill='#fff' opacity={0.9} />
                        </g>
                    )
                })}
            </g>
        )}
    </svg>
}
export default EmptyOpenBox
