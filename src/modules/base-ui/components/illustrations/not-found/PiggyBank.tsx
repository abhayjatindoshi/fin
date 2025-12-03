import { useId } from 'react';
import type { IllustrationProps } from './types.ts';

export default function PiggyBank({ className, title = 'Piggy Bank With Missing Coin' }: IllustrationProps) {
    const id = useId();
    return (
        <svg role="img" aria-labelledby={`${id}-title`} viewBox="0 0 640 360" className={className} xmlns="http://www.w3.org/2000/svg">
            <title id={`${id}-title`}>{title}</title>
            <defs>
                <radialGradient id={`${id}-body`} cx="50%" cy="40%" r="70%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.06)" />
                </radialGradient>
            </defs>
            <rect width="640" height="360" fill="none" />
            {/* Coin trail */}
            <circle cx="150" cy="270" r="12" fill="oklch(0.769 0.188 70.08 / 0.9)" />
            <circle cx="190" cy="280" r="9" fill="oklch(0.828 0.189 84.429 / 0.8)" />
            <circle cx="230" cy="292" r="6" fill="oklch(0.828 0.189 84.429 / 0.6)" />
            {/* Piggy */}
            <g transform="translate(360,170)">
                <ellipse cx="0" cy="0" rx="120" ry="80" fill={`url(#${id}-body)`} stroke="rgba(255,255,255,0.12)" />
                <ellipse cx="-95" cy="20" rx="25" ry="18" fill={`url(#${id}-body)`} stroke="rgba(255,255,255,0.12)" />
                <circle cx="-40" cy="-40" r="6" fill="rgba(255,255,255,0.9)" />
                <rect x="-20" y="-80" width="40" height="10" rx="3" fill="rgba(255,255,255,0.28)" />
                {/* legs */}
                <rect x="-60" y="60" width="12" height="20" rx="3" fill="rgba(255,255,255,0.2)" />
                <rect x="10" y="60" width="12" height="20" rx="3" fill="rgba(255,255,255,0.2)" />
            </g>
        </svg>
    );
}
