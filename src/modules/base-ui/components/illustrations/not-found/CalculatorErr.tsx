import { useId } from 'react';
import type { IllustrationProps } from './types';

export default function CalculatorErr({ className, title = 'Calculator Typo' }: IllustrationProps) {
    const id = useId();
    return (
        <svg role="img" aria-labelledby={`${id}-title`} viewBox="0 0 640 360" className={className} xmlns="http://www.w3.org/2000/svg">
            <title id={`${id}-title`}>{title}</title>
            <rect width="640" height="360" fill="none" />
            <g transform="translate(250,86)">
                {/* body */}
                <rect x="0" y="0" rx="18" width="150" height="208" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.16)" />
                {/* inner bevel */}
                <rect x="2" y="2" rx="16" width="146" height="204" fill="none" stroke="rgba(255,255,255,0.08)" />
                {/* display */}
                <rect x="18" y="16" rx="8" width="114" height="36" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.18)" />
                <rect x="18" y="16" rx="8" width="114" height="18" fill="rgba(255,255,255,0.08)" />
                <text x="30" y="40" fill="rgba(255,255,255,0.95)" fontFamily="system-ui, sans-serif" fontSize="18">404</text>
                {/* keys */}
                {Array.from({ length: 3 }).map((_, r) => Array.from({ length: 3 }).map((__, c) => (
                    <g key={`${r}-${c}`} transform={`translate(${18 + c * 36}, ${64 + r * 40})`}>
                        <rect width="26" height="26" rx="7" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.16)" />
                        <rect width="26" height="12" rx="7" fill="rgba(255,255,255,0.08)" />
                    </g>
                )))}
                {/* enter key */}
                <g transform="translate(18, 64)">
                    <rect x="112" y="0" width="26" height="106" rx="7" fill="oklch(0.62 0.19 260 / 0.35)" stroke="oklch(0.62 0.19 260 / 0.6)" />
                </g>
            </g>
        </svg>
    );
}
