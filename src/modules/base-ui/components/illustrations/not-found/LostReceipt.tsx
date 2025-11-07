import { useId } from 'react';
import type { IllustrationProps } from './types';

export function LostReceipt({ className, title = 'Lost Receipt' }: IllustrationProps) {
    const id = useId();
    return (
        <svg
            role="img"
            aria-labelledby={`${id}-title`}
            viewBox="0 0 640 360"
            className={className}
            xmlns="http://www.w3.org/2000/svg"
        >
            <title id={`${id}-title`}>{title}</title>
            <defs>
                <linearGradient id={`${id}-paper`} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
                    <stop offset="60%" stopColor="rgba(255,255,255,0.10)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.06)" />
                </linearGradient>
                <linearGradient id={`${id}-edge`} x1="0" x2="1">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.0)" />
                </linearGradient>
                <filter id={`${id}-soft`} x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="0.8" />
                </filter>
                <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="rgba(0,0,0,0.35)" />
                </filter>
                <pattern id={`${id}-rule`} width="1" height="22" patternUnits="userSpaceOnUse">
                    <rect width="160" height="6" rx="3" fill="rgba(255,255,255,0.12)" />
                </pattern>
            </defs>
            <rect width="640" height="360" fill="none" />
            {/* Dotted route */}
            <path
                d="M30 300 C 160 260, 120 200, 240 180 S 430 150, 520 120"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="2.5"
                strokeDasharray="0 14"
                strokeLinecap="round"
                filter={`url(#${id}-soft)`}
            />
            {/* Receipt sheet */}
            <g transform="translate(360,88) rotate(-6)" filter={`url(#${id}-shadow)`}>
                <rect x="0" y="0" rx="12" ry="12" width="200" height="240" fill={`url(#${id}-paper)`} stroke="rgba(255,255,255,0.16)" />
                {/* top edge gleam */}
                <rect x="0" y="0" width="200" height="10" fill={`url(#${id}-edge)`} opacity="0.4" />
                {/* Perforation holes forming 404 */}
                <g fill="rgba(255,255,255,0.28)">
                    <circle cx="24" cy="22" r="2.2" />
                    <circle cx="38" cy="22" r="2.2" />
                    <circle cx="52" cy="22" r="2.2" />
                    <circle cx="66" cy="22" r="2.2" />
                    <circle cx="80" cy="22" r="2.2" />
                    <circle cx="94" cy="22" r="2.2" />
                    <circle cx="108" cy="22" r="2.2" />
                    <circle cx="122" cy="22" r="2.2" />
                    <circle cx="136" cy="22" r="2.2" />
                    <circle cx="150" cy="22" r="2.2" />
                </g>
                {/* Rules */}
                {Array.from({ length: 8 }).map((_, i) => (
                    <rect key={i} x={20} y={50 + i * 22} width={160 - (i % 3) * 24} height={6} rx={3} fill="rgba(255,255,255,0.12)" />
                ))}
                {/* Folded corner with shading */}
                <path d="M200 44 L160 0 H200 Z" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)" />
                <path d="M182 22 L200 40 L200 0" fill="rgba(0,0,0,0.08)" />
            </g>
            {/* Compass */}
            <g transform="translate(110,120)">
                <circle cx="0" cy="0" r="34" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.20)" />
                <circle cx="0" cy="0" r="18" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.16)" />
                <path d="M0 -22 L6 10 L0 6 L-6 10 Z" fill="oklch(0.62 0.19 260 / 0.9)" />
            </g>
        </svg>
    );
}

export default LostReceipt;
