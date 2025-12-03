import { useId } from 'react';
import type { IllustrationProps } from './types';

export default function VaultDoor({ className, title = 'Vault Door With Wrong Combo' }: IllustrationProps) {
    const id = useId();
    return (
        <svg role="img" aria-labelledby={`${id}-title`} viewBox="0 0 640 360" className={className} xmlns="http://www.w3.org/2000/svg">
            <title id={`${id}-title`}>{title}</title>
            <rect width="640" height="360" fill="none" />
            {/* door */}
            <defs>
                <radialGradient id={`${id}-steel`} cx="50%" cy="40%" r="70%">
                    <stop offset="0%" stopColor="#9aa4ad" />
                    <stop offset="100%" stopColor="#5c6670" />
                </radialGradient>
            </defs>
            <circle cx="320" cy="180" r="110" fill="url(#${id}-steel)" stroke="rgba(255,255,255,0.15)" />
            {/* bolts */}
            {Array.from({ length: 12 }).map((_, i) => {
                const a = (i / 12) * Math.PI * 2; const x = 320 + Math.cos(a) * 90; const y = 180 + Math.sin(a) * 90; return (
                    <g key={i} transform={`translate(${x},${y})`}>
                        <circle r="6" fill="#4a545e" stroke="#c6cdd4" strokeWidth="0.5" />
                    </g>
                );
            })}
            {/* 3-spoke handle */}
            <g transform="translate(320,180)">
                <circle r="14" fill="#e7edf2" />
                {Array.from({ length: 3 }).map((_, i) => {
                    const a = (i / 3) * Math.PI * 2; const x = Math.cos(a) * 52; const y = Math.sin(a) * 52; return (
                        <g key={i}>
                            <line x1={0} y1={0} x2={x} y2={y} stroke="#c6cdd4" strokeWidth="4" />
                            <circle cx={x} cy={y} r="8" fill="#e7edf2" stroke="#c6cdd4" />
                        </g>
                    );
                })}
            </g>
            {/* keypad */}
            <g transform="translate(480,126)">
                <rect x="0" y="0" width="72" height="38" rx="6" fill="#38414a" stroke="#97a2ad" />
                <rect x="8" y="8" width="56" height="14" rx="3" fill="#1a2128" />
                <text x="12" y="19" fill="#70e1a8" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="12">ERR</text>
                {/* keypad grid under */}
                {Array.from({ length: 3 }).map((_, r) => Array.from({ length: 3 }).map((__, c) => (
                    <rect key={`${r}-${c}`} x={c * 22} y={46 + r * 22} width="16" height="16" rx="3" fill="#59626c" />
                )))}
            </g>
        </svg>
    );
}
