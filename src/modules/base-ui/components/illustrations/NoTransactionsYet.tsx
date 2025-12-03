type Props = {
    className?: string;
};

// "No Transactions Yet" illustration inspired by Ideas.md #1
// Frosted acrylic wallet with gently floating coins, soft bokeh background, shimmer and slow parallax.
export default function NoTransactionsYet({ className }: Props) {
    return (
        <div className={className}>
            <svg
                viewBox="0 0 1600 900"
                role="img"
                aria-labelledby="title desc"
                width="100%"
                height="100%"
                style={{ display: 'block' }}
            >
                <title id="title">No transactions yet</title>
                <desc id="desc">A frosted glass wallet with softly glowing coins floating nearby on a mint to lilac gradient with bokeh lights.</desc>

                <defs>
                    {/* Background gradient */}
                    <radialGradient id="bg" cx="50%" cy="50%" r="75%">
                        <stop offset="0%" stopColor="#b8ffe8" stopOpacity="0.9" />
                        <stop offset="50%" stopColor="#c9d5ff" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#b8a9ff" stopOpacity="0.5" />
                    </radialGradient>

                    {/* Bokeh blur */}
                    <filter id="bokeh-blur" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="8" />
                    </filter>

                    {/* Soft shadow */}
                    <filter id="soft-shadow" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="0" dy="6" stdDeviation="20" floodColor="#000" floodOpacity="0.15" />
                    </filter>

                    {/* Frosted glass filter (subtle noise + blur) */}
                    <filter id="frost" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
                        <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.6 0" />
                    </filter>

                    {/* Wallet shimmer mask */}
                    <linearGradient id="shimmer" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                        <stop offset="50%" stopColor="#ffffff" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                    </linearGradient>

                    {/* Coin gradient */}
                    <radialGradient id="coin" cx="50%" cy="40%" r="60%">
                        <stop offset="0%" stopColor="#ffd27d" />
                        <stop offset="50%" stopColor="#ffb3a6" />
                        <stop offset="100%" stopColor="#ff8c7d" />
                    </radialGradient>
                </defs>

                {/* Background */}
                <rect x="0" y="0" width="1600" height="900" fill="url(#bg)" />

                {/* Subtle grain overlay via low-opacity noise - approximated with tiny bokeh */}
                <g opacity="0.3" filter="url(#bokeh-blur)" className="bokeh-parallax">
                    {Array.from({ length: 10 }).map((_, i) => {
                        const cx = 200 + i * 130;
                        const cy = 150 + ((i * 97) % 500);
                        const r = 16 + (i % 5) * 6;
                        const o = 0.12 + (i % 3) * 0.06;
                        return <circle key={i} cx={cx} cy={cy} r={r} fill="#ffffff" opacity={o} />;
                    })}
                </g>

                {/* Wallet group */}
                <g transform="translate(550, 280)" filter="url(#soft-shadow)">
                    {/* Wallet body */}
                    <g className="wallet">
                        <rect x="0" y="60" rx="28" ry="28" width="500" height="260"
                            fill="#ffffff" opacity="0.18" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="2"
                            filter="url(#frost)" />

                        {/* Wallet flap */}
                        <path d="M40,60 h300 a28,28 0 0 1 28,28 v40 h-368 v-40 a28,28 0 0 1 28,-28 z"
                            fill="#ffffff" opacity="0.20" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="2" />

                        {/* Inner refraction edge */}
                        <rect x="10" y="70" rx="22" ry="22" width="480" height="240"
                            fill="none" stroke="#b1f1ff" strokeOpacity="0.25" strokeWidth="2" />

                        {/* Catchlight rim bottom-right */}
                        <rect x="330" y="220" width="150" height="80" rx="18" ry="18"
                            fill="#7acbff" opacity="0.10" />

                        {/* Shimmer overlay */}
                        <g className="wallet-shimmer" style={{ mixBlendMode: 'screen' }}>
                            <rect x="-200" y="40" width="220" height="300" fill="url(#shimmer)" transform="rotate(20 0 0)" />
                        </g>
                    </g>

                    {/* Coins inside/near wallet */}
                    <g className="coins">
                        <g className="coin coin-a" transform="translate(110,180)">
                            <circle r="26" fill="url(#coin)" opacity="0.9" />
                            <circle r="26" fill="#fff" opacity="0.15" />
                        </g>
                        <g className="coin coin-b" transform="translate(210,150)">
                            <circle r="22" fill="url(#coin)" opacity="0.85" />
                            <circle r="22" fill="#fff" opacity="0.14" />
                        </g>
                        <g className="coin coin-c" transform="translate(320,195)">
                            <circle r="18" fill="url(#coin)" opacity="0.9" />
                            <circle r="18" fill="#fff" opacity="0.12" />
                        </g>
                    </g>
                </g>

                {/* Ground soft reflection */}
                <ellipse cx="800" cy="600" rx="260" ry="40" fill="#000" opacity="0.06" />

                <style>{`
          /* Parallax drift for bokeh */
          @keyframes parallaxDrift { 0% { transform: translate3d(0,0,0); } 100% { transform: translate3d(-20px, 10px, 0); } }
          .bokeh-parallax { animation: parallaxDrift 60s linear infinite alternate; }

          /* Wallet shimmer sweep */
          @keyframes shimmerSweep {
            0% { transform: translateX(-240px) rotate(20deg); opacity: 0; }
            30% { opacity: 0.35; }
            60% { opacity: 0.15; }
            100% { transform: translateX(620px) rotate(20deg); opacity: 0; }
          }
          .wallet-shimmer rect { animation: shimmerSweep 5s ease-in-out infinite; }

          /* Gentle vertical float for coins (underwater motion) */
          @keyframes floatY {
            0% { transform: translateY(-6px) rotate(0deg); }
            50% { transform: translateY(6px) rotate(6deg); }
            100% { transform: translateY(-6px) rotate(0deg); }
          }
          .coin { filter: drop-shadow(0 4px 10px rgba(0,0,0,0.15)); }
          .coin-a { animation: floatY 4.2s ease-in-out infinite; animation-delay: 0s; }
          .coin-b { animation: floatY 4.2s ease-in-out infinite; animation-delay: 0.3s; }
          .coin-c { animation: floatY 4.2s ease-in-out infinite; animation-delay: 0.6s; }
        `}</style>
            </svg>
        </div>
    );
}
