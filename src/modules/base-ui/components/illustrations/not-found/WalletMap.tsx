import { useId } from 'react';
import type { IllustrationProps } from './types.ts';

export default function WalletMap({ className, title = 'Empty Wallet With A Map' }: IllustrationProps) {
    const id = useId();
    return (
        <svg role="img" aria-labelledby={`${id}-title`} viewBox="0 0 640 360" className={className} xmlns="http://www.w3.org/2000/svg">
            <title id={`${id}-title`}>{title}</title>
            <rect width="640" height="360" fill="none" />
            {/* Wallet */}
            <g transform="translate(210,170)">
                <rect x="0" y="0" rx="12" width="220" height="90" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" />
                <circle cx="200" cy="45" r="6" fill="rgba(255,255,255,0.2)" />
            </g>
            {/* Map */}
            <path d="M260 110 q30 -20 60 0 t60 0 t60 0" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="3" strokeDasharray="6 8" />
            <circle cx="480" cy="110" r="6" fill="oklch(0.704 0.191 22.216 / 0.9)" />
        </svg>
    );
}
