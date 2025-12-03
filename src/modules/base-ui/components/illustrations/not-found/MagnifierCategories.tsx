import { useId } from 'react';
import type { IllustrationProps } from './types';

export default function MagnifierCategories({ className, title = 'Magnifying Glass Over Categories' }: IllustrationProps) {
    const id = useId();
    return (
        <svg role="img" aria-labelledby={`${id}-title`} viewBox="0 0 640 360" className={className} xmlns="http://www.w3.org/2000/svg">
            <title id={`${id}-title`}>{title}</title>
            <rect width="640" height="360" fill="none" />
            {/* categories icons as dots */}
            {Array.from({ length: 36 }).map((_, i) => (
                <circle key={i} cx={70 + (i * 18) % 520} cy={86 + Math.floor(i / 12) * 30} r="3" fill="rgba(255,255,255,0.24)" />
            ))}
            {/* magnifier */}
            <g transform="translate(360,160)">
                <circle r="54" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.2)" />
                <circle r="50" fill="rgba(255,255,255,0.04)" />
                <rect x="44" y="44" width="90" height="12" rx="6" transform="rotate(45 44 44)" fill="rgba(255,255,255,0.14)" />
                {/* missing center */}
                <circle r="22" fill="rgba(0,0,0,0.08)" />
            </g>
        </svg>
    );
}
