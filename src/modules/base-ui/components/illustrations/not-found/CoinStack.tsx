import { useId } from 'react';
import type { IllustrationProps } from './types';

export default function CoinStack({ className, title = 'Misplaced Coin Stack' }: IllustrationProps) {
    const id = useId();
    return (
        <svg role="img" aria-labelledby={`${id}-title`} viewBox="0 0 640 360" className={className} xmlns="http://www.w3.org/2000/svg">
            <title id={`${id}-title`}>{title}</title>
            <rect width="640" height="360" fill="none" />
            {/* stacks */}
            {([160, 280] as const).map((x, i) => (
                <g key={x} transform={`translate(${x}, 264)`}>
                    {Array.from({ length: 5 + i }).map((_, k) => (
                        <g key={k} transform={`translate(0, ${-k * 10})`}>
                            {/* shadow/edge */}
                            <ellipse cx="0" cy="0" rx="44" ry="9" fill="#5c4a1c" opacity="0.25" />
                            {/* rim (milled) */}
                            <ellipse cx="0" cy="-1" rx="42" ry="8" fill="#d6b556" />
                            {Array.from({ length: 22 }).map((__, r) => (
                                <rect key={r} x={-40 + r * 4} y={-5} width="2" height="6" fill="#c39b3c" opacity={r % 2 ? 0.7 : 0.4} />
                            ))}
                            {/* face */}
                            <ellipse cx="0" cy="-3" rx="36" ry="5" fill="#f0d37b" />
                            <ellipse cx="0" cy="-3.6" rx="18" ry="2.4" fill="#e8c866" opacity="0.6" />
                        </g>
                    ))}
                </g>
            ))}
            {/* sliding coin */}
            <g transform="translate(410, 248)">
                <ellipse cx="0" cy="16" rx="44" ry="9" fill="#5c4a1c" opacity="0.25" />
                <ellipse cx="0" cy="15" rx="42" ry="8" fill="#d6b556" />
                {Array.from({ length: 22 }).map((__, r) => (
                    <rect key={r} x={-40 + r * 4} y={11} width="2" height="6" fill="#c39b3c" opacity={r % 2 ? 0.7 : 0.4} />
                ))}
                <ellipse cx="0" cy="13" rx="36" ry="5" fill="#f0d37b" />
                <ellipse cx="0" cy="12" rx="18" ry="2.4" fill="#e8c866" opacity="0.6" />
            </g>
            {/* negative 404 */}
            <g fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="10">
                <path d="M520 248 v-60 h30 v60" />
                <circle cx="580" cy="218" r="30" />
                <path d="M640 248 v-60 h30 v60" />
            </g>
        </svg>
    );
}
