import { Link, useInRouterContext, useParams } from "react-router-dom";
import LogoSvg from "../icons/logo.svg?react";

interface LogoProps {
    size?: "sm" | "md" | "lg" | "xl";
    className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = '', size = "md" }: LogoProps) => {

    const inRouter = useInRouterContext();
    const { householdId } = useParams();

    const sizeMap = {
        sm: 'w-8 h-4',
        md: 'w-12 h-6',
        lg: 'w-20 h-10',
        xl: 'w-32 h-16',
    }

    if (inRouter) {
        return (
            <Link to={`/${householdId ?? ''}`}>
                <LogoSvg className={`m-1 font-bold cursor-pointer ${sizeMap[size]} ${className}`} />
            </Link>
        );
    }

    // Fallback when not inside a Router (e.g., portals rendered before Router mounts)
    return <LogoSvg className={`m-1 font-bold cursor-pointer ${sizeMap[size]} ${className}`} />;
};

export default Logo;