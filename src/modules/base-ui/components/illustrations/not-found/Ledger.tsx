import { useId } from 'react';
import type { IllustrationProps } from './types.ts';

export default function Ledger({ className, title = 'Off-The-Books Ledger' }: IllustrationProps) {
    const id = useId();
    return (
        <svg role="img" aria-labelledby={`${id}-title`} viewBox="0 0 640 360" className={className} xmlns="http://www.w3.org/2000/svg">
            <title id={`${id}-title`}>{title}</title>
            <defs>
                <linearGradient id={`${id}-page`} x1="0" x2="1">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.06)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
                </linearGradient>
            </defs>
            <rect width="640" height="360" fill="none" />
            <g transform="translate(200,80)">
                <rect x="0" y="0" rx="12" width="280" height="200" fill={`url(#${id}-page)`} stroke="rgba(255,255,255,0.12)" />
                <line x1="140" y1="0" x2="140" y2="200" stroke="rgba(255,255,255,0.12)" />
                {[...Array(7)].map((_, i) => (
                    <rect key={i} x={20} y={30 + i * 22} width={100} height={6} rx={3} fill="rgba(255,255,255,0.14)" />
                ))}
                {[...Array(7)].map((_, i) => (
                    <rect key={i} x={160} y={30 + i * 22} width={100 - (i % 2) * 20} height={6} rx={3} fill="rgba(255,255,255,0.1)" />
                ))}
                {/* 404 tabs */}
                <g transform="translate(120,-16)" fill="rgba(255,255,255,0.28)">
                    <rect x="0" y="0" width="20" height="12" rx="3" />
                    <rect x="24" y="0" width="20" height="12" rx="3" />
                    <rect x="48" y="0" width="20" height="12" rx="3" />
                </g>
            </g>
        </svg>
    );
}
