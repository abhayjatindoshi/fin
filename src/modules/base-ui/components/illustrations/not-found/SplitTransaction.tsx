import { useId } from 'react';
import type { IllustrationProps } from './types.ts';

export default function SplitTransaction({ className, title = 'Split Transaction' }: IllustrationProps) {
    const id = useId();
    return (
        <svg role="img" aria-labelledby={`${id}-title`} viewBox="0 0 640 360" className={className} xmlns="http://www.w3.org/2000/svg">
            <title id={`${id}-title`}>{title}</title>
            <rect width="640" height="360" fill="none" />
            <g transform="translate(160,160)">
                <rect x="0" y="0" rx="10" width="320" height="60" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" />
                <line x1="110" y1="0" x2="110" y2="60" stroke="oklch(0.62 0.19 260 / 0.8)" strokeDasharray="6 6" />
                <line x1="220" y1="0" x2="220" y2="60" stroke="oklch(0.62 0.19 260 / 0.8)" strokeDasharray="6 6" />
            </g>
        </svg>
    );
}
