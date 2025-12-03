import { useId } from 'react';
import type { IllustrationProps } from './types.ts';

export default function CloudSyncDrift({ className, title = 'Cloud Sync Drift' }: IllustrationProps) {
    const id = useId();
    return (
        <svg role="img" aria-labelledby={`${id}-title`} viewBox="0 0 640 360" className={className} xmlns="http://www.w3.org/2000/svg">
            <title id={`${id}-title`}>{title}</title>
            <rect width="640" height="360" fill="none" />
            {/* nodes */}
            <circle cx="260" cy="160" r="10" fill="rgba(255,255,255,0.8)" />
            <circle cx="380" cy="140" r="10" fill="rgba(255,255,255,0.8)" />
            <circle cx="340" cy="230" r="10" fill="rgba(255,255,255,0.8)" />
            {/* cloud */}
            <g transform="translate(200,120)">
                <ellipse cx="50" cy="30" rx="40" ry="24" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" />
                <ellipse cx="80" cy="26" rx="30" ry="20" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" />
                <ellipse cx="30" cy="36" rx="26" ry="16" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" />
            </g>
            {/* arrow */}
            <path d="M260 150 C 300 120, 340 120, 370 130" stroke="oklch(0.62 0.19 260 / 0.9)" strokeWidth="3" fill="none" markerEnd={`url(#${id}-arrow)`} />
            <defs>
                <marker id={`${id}-arrow`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0 0 L6 3 L0 6 Z" fill="oklch(0.62 0.19 260 / 0.9)" />
                </marker>
            </defs>
        </svg>
    );
}
