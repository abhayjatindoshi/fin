import { useId } from 'react';
import type { IllustrationProps } from './types';

export default function WalletZipper({ className, title = 'Bi‑fold Wallet (Empty)' }: IllustrationProps) {
    const id = useId();
    return (
        <svg role="img" aria-labelledby={`${id}-title`} viewBox="0 0 640 360" className={className} xmlns="http://www.w3.org/2000/svg">
            <title id={`${id}-title`}>{title}</title>
            <defs>
                {/* leather */}
                <linearGradient id={`${id}-leather`} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#6b4a2b" />
                    <stop offset="100%" stopColor="#3b2416" />
                </linearGradient>
                <pattern id={`${id}-grain`} width="6" height="6" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="0.5" fill="rgba(255,255,255,0.06)" />
                    <circle cx="4" cy="4" r="0.5" fill="rgba(0,0,0,0.08)" />
                </pattern>
                <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="rgba(0,0,0,0.35)" />
                </filter>
            </defs>
            <rect width="640" height="360" fill="none" />
            {/* wallet body: open bi-fold */}
            <g transform="translate(140,96)" filter={`url(#${id}-shadow)`}>
                {/* left flap */}
                <rect x="0" y="0" rx="16" width="180" height="180" fill={`url(#${id}-leather)`} />
                <rect x="0" y="0" rx="16" width="180" height="180" fill={`url(#${id}-grain)`} opacity="0.12" />
                {/* card slots */}
                {Array.from({ length: 3 }).map((_, i) => (
                    <g key={i} transform={`translate(18, ${26 + i * 38})`}>
                        <rect width="144" height="26" rx="6" fill="#2a1910" opacity="0.7" />
                        <rect x="10" y="6" width="84" height="14" rx="3" fill="#cfd4da" />
                    </g>
                ))}
                {/* right flap */}
                <rect x="180" y="10" rx="16" width="200" height="170" fill={`url(#${id}-leather)`} />
                <rect x="180" y="10" rx="16" width="200" height="170" fill={`url(#${id}-grain)`} opacity="0.12" />
                <rect x="196" y="26" width="168" height="60" rx="8" fill="#2a1910" opacity="0.65" />
                {/* seam and stitching */}
                <rect x="178" y="0" width="4" height="180" fill="#2a1910" opacity="0.6" />
                {Array.from({ length: 24 }).map((_, i) => (
                    <rect key={i} x={6 + i * 14} y="8" width="3" height="6" rx="1" fill="#e6d2b3" opacity="0.7" />
                ))}
            </g>
        </svg>
    );
}
