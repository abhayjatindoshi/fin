export const Google: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 48 48">

            {/* <path d="M 18.232 5.5 A9 9 0 0 0 12 2.999" stroke="#EA4335" />
            <path d="M 12 2.999 A9 9 0 0 0 3 12" stroke="url(#g-seg1)" />
            <path d="M 2.985 12 A9 9 0 0 0 12 21" stroke="url(#g-seg3)" />
            <path d="M 12 21 A9 9 0 0 0 21 12" stroke="url(#g-seg4)" />
            <path d="M 14 12 L 21 12" stroke="url(#g-cross)" /> */}

            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
            <path fill="none" d="M0 0h48v48H0z"></path>
            {/* <path d="M17.785 5.106A9 9 0 0 0 3.542 8.922" stroke="url(#g-seg1)" />
            <path d="M3.542 8.922A9 9 0 0 0 5.776 18.5" stroke="url(#g-seg2)" />
            <path d="M5.776 18.5A9 9 0 0 0 10.438 20.863" stroke="url(#g-seg3)" />
            <path d="M10.438 20.863A9 9 0 0 0 21 12" stroke="url(#g-seg4)" />
            <path d="M13 12h8" stroke="url(#g-cross)" /> */}
            <defs>
                <linearGradient id="g-seg1" >
                    <stop offset="0%" stopColor="#FBBC04" />
                    <stop offset="70%" stopColor="#EA4335" />
                    <stop offset="100%" stopColor="#EA4335" />
                </linearGradient>
                <linearGradient id="g-seg2">
                    <stop offset="20%" stopColor="#FBBC04" />
                    <stop offset="70%" stopColor="#FBBC04" />
                    {/* <stop offset="40%" stopColor="#FBBC04" /> */}
                    {/* <stop offset="90%" stopColor="#34A853" /> */}
                    <stop offset="100%" stopColor="#34A853" />
                </linearGradient>
                <linearGradient id="g-seg3">
                    <stop offset="0%" stopColor="#FBBC04" />
                    <stop offset="100%" stopColor="#34A853" />
                </linearGradient>
                <linearGradient id="g-seg4" x1="10.438" y1="20.863" x2="21" y2="12" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#34A853" />
                    <stop offset="100%" stopColor="#4285F4" />
                </linearGradient>
                <linearGradient id="g-cross" x1="12" y1="12" x2="21" y2="12" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#4285F4" />
                    <stop offset="100%" stopColor="#4285F4" />
                </linearGradient>
            </defs>
        </svg>

    )
}