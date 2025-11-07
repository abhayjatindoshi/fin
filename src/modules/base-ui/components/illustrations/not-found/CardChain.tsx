import { useId } from 'react';
import type { IllustrationProps } from './types.ts';

export default function CardChain({ className, title = 'Broken Link in Card Chain' }: IllustrationProps) {
    const id = useId();
    return (
        <svg role="img" aria-labelledby={`${id}-title`} viewBox="0 0 640 360" className={className} xmlns="http://www.w3.org/2000/svg">
            <title id={`${id}-title`}>{title}</title>
            <rect width="640" height="360" fill="none" />
            {([0, 1, 2] as const).map((i) => (
                <g key={i} transform={`translate(${120 + i * 170},120)`} opacity={i === 1 ? 0.6 : 1}>
                    <rect x="0" y="0" rx="12" width="140" height="90" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" />
                    <rect x="12" y="16" width="50" height="10" rx="5" fill="rgba(255,255,255,0.14)" />
                    <rect x="12" y="34" width="100" height="8" rx="4" fill="rgba(255,255,255,0.1)" />
                    <rect x="12" y="50" width="80" height="8" rx="4" fill="rgba(255,255,255,0.1)" />
                </g>
            ))}
            {/* break */}
            <path d="M290 160 h60" stroke="oklch(0.62 0.19 260 / 0.8)" strokeWidth="3" strokeDasharray="6 8" />
        </svg>
    );
}
