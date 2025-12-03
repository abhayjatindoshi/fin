import { useId } from 'react';
import type { IllustrationProps } from './types.ts';

export default function CompassGrid({ className, title = 'Compass Over A City Grid' }: IllustrationProps) {
    const id = useId();
    return (
        <svg role="img" aria-labelledby={`${id}-title`} viewBox="0 0 640 360" className={className} xmlns="http://www.w3.org/2000/svg">
            <title id={`${id}-title`}>{title}</title>
            <rect width="640" height="360" fill="none" />
            {/* grid */}
            {Array.from({ length: 7 }).map((_, i) => (
                <line key={`v${i}`} x1={90 + i * 70} y1={70} x2={90 + i * 70} y2={290} stroke="rgba(255,255,255,0.06)" />
            ))}
            {Array.from({ length: 5 }).map((_, i) => (
                <line key={`h${i}`} x1={90} y1={90 + i * 40} x2={580} y2={90 + i * 40} stroke="rgba(255,255,255,0.06)" />
            ))}
            <g transform="translate(320,180)">
                <circle cx="0" cy="0" r="60" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.18)" />
                <path d="M0 -40 L8 16 L0 10 L-8 16 Z" fill="oklch(0.62 0.19 260 / 0.9)" />
            </g>
        </svg>
    );
}
