import { useId } from 'react';
import type { IllustrationProps } from './types';

export default function TornReceipt({ className, title = 'Torn Receipt' }: IllustrationProps) {
    const id = useId();
    return (
        <svg role="img" aria-labelledby={`${id}-title`} viewBox="0 0 640 360" className={className} xmlns="http://www.w3.org/2000/svg">
            <title id={`${id}-title`}>{title}</title>
            <defs>
                <linearGradient id={`${id}-paper`} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#eef3f7" stopOpacity="0.9" />
                </linearGradient>
                <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="rgba(0,0,0,0.35)" />
                </filter>
                <linearGradient id={`${id}-ink`} x1="0" x2="1">
                    <stop offset="0%" stopColor="#93a1ad" />
                    <stop offset="100%" stopColor="#7b8a96" />
                </linearGradient>
            </defs>
            <rect width="640" height="360" fill="none" />
            {/* three torn receipts with serrated tops and barcode/total */}
            <g transform="translate(150,80)" filter={`url(#${id}-shadow)`}>
                <path d="M0 0 h160 v200 h-160 z" fill={`url(#${id}-paper)`} stroke="#d5dde5" />
                {/* serrated top */}
                {Array.from({ length: 16 }).map((_, i) => (
                    <path key={i} d={`M${4 + i * 10} 0 l5 6 l5 -6`} fill="#fff" stroke="#d5dde5" />
                ))}
                {/* content */}
                {Array.from({ length: 6 }).map((_, i) => (
                    <rect key={i} x={16} y={28 + i * 26} width={120 - (i % 3) * 22} height={6} rx={3} fill="url(#${id}-ink)" opacity="0.7" />
                ))}
                <rect x="16" y="188" width="60" height="6" rx="3" fill="url(#${id}-ink)" opacity="0.9" />
                <rect x="84" y="188" width="40" height="6" rx="3" fill="url(#${id}-ink)" opacity="0.9" />
                <rect x="124" y="188" width="20" height="6" rx="3" fill="url(#${id}-ink)" opacity="0.9" />
                {/* torn edge */}
                <path d="M158 20 q8 10 0 22 q-8 10 0 22 q8 10 0 22 q-8 10 0 22" fill="#fff" stroke="#d5dde5" />
            </g>
            <g transform="translate(280,88) rotate(6)" filter={`url(#${id}-shadow)`}>
                <path d="M0 0 h160 v200 h-160 z" fill={`url(#${id}-paper)`} stroke="#d5dde5" />
                {Array.from({ length: 16 }).map((_, i) => (
                    <path key={i} d={`M${4 + i * 10} 0 l5 6 l5 -6`} fill="#fff" stroke="#d5dde5" />
                ))}
                {Array.from({ length: 5 }).map((_, i) => (
                    <rect key={i} x={20} y={34 + i * 28} width={110 - (i % 2) * 26} height={6} rx={3} fill="url(#${id}-ink)" opacity="0.65" />
                ))}
                {/* barcode */}
                {Array.from({ length: 20 }).map((_, i) => (
                    <rect key={i} x={20 + i * 4} y={172} width={i % 3 === 0 ? 3 : 1} height="14" fill="#3f4b56" opacity="0.7" />
                ))}
                <rect x="20" y="190" width="70" height="6" rx="3" fill="url(#${id}-ink)" opacity="0.9" />
            </g>
            <g transform="translate(210,96) rotate(-8)" filter={`url(#${id}-shadow)`}>
                <path d="M0 0 h160 v200 h-160 z" fill={`url(#${id}-paper)`} stroke="#d5dde5" />
                {Array.from({ length: 16 }).map((_, i) => (
                    <path key={i} d={`M${4 + i * 10} 0 l5 6 l5 -6`} fill="#fff" stroke="#d5dde5" />
                ))}
                {Array.from({ length: 4 }).map((_, i) => (
                    <rect key={i} x={18} y={34 + i * 32} width={120 - (i % 2) * 30} height={6} rx={3} fill="url(#${id}-ink)" opacity="0.6" />
                ))}
                <rect x="18" y="170" width="60" height="6" rx="3" fill="url(#${id}-ink)" opacity="0.9" />
                {/* torn edge */}
                <path d="M158 20 q8 10 0 22 q-8 10 0 22 q8 10 0 22 q-8 10 0 22" fill="#fff" stroke="#d5dde5" />
            </g>
        </svg>
    );
}
