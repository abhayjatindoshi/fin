import { useId } from 'react';
import type { IllustrationProps } from './types';

export default function RubberStamp({ className, title = 'Rubber Stamp VOID' }: IllustrationProps) {
    const id = useId();
    return (
        <svg role="img" aria-labelledby={`${id}-title`} viewBox="0 0 640 360" className={className} xmlns="http://www.w3.org/2000/svg">
            <title id={`${id}-title`}>{title}</title>
            <defs>
                <linearGradient id={`${id}-wood`} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#b27a3a" />
                    <stop offset="100%" stopColor="#6b4320" />
                </linearGradient>
                <linearGradient id={`${id}-rubber`} x1="0" x2="1">
                    <stop offset="0%" stopColor="#3a0b0b" />
                    <stop offset="100%" stopColor="#8a1c1c" />
                </linearGradient>
                <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="rgba(0,0,0,0.35)" />
                </filter>
            </defs>
            <rect width="640" height="360" fill="none" />
            {/* stamp */}
            <g transform="translate(270,70)" filter={`url(#${id}-shadow)`}>
                {/* handle */}
                <ellipse cx="40" cy="8" rx="22" ry="8" fill={`url(#${id}-wood)`} />
                <rect x="18" y="8" width="44" height="36" rx="12" fill={`url(#${id}-wood)`} stroke="#60401f" />
                {/* base */}
                <rect x="0" y="44" width="80" height="22" rx="6" fill={`url(#${id}-rubber)`} />
            </g>
            {/* ink on paper */}
            <g transform="translate(246,206) rotate(-6)">
                <rect x="0" y="0" width="168" height="42" rx="6" fill="#7b1313" opacity="0.1" />
                <text x="12" y="26" fill="#b62525" fontWeight="800" fontFamily="system-ui, sans-serif" fontSize="22" letterSpacing="1">404 VOID</text>
            </g>
        </svg>
    );
}
