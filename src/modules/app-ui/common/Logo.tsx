import { Link, useInRouterContext, useParams } from "react-router-dom";

interface LogoProps {
    size?: 'small' | 'medium' | 'large';
    className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = "small", className = '' }: LogoProps) => {

    const sizeClasses = {
        'small': "text-xl",
        'medium': "text-3xl",
        'large': "text-5xl",
    };

    const dotSizeClasses = {
        'small': "text-3xl",
        'medium': "text-5xl",
        'large': "text-7xl",
    };

    const inRouter = useInRouterContext();
    const { householdId } = useParams();

    if (inRouter) {
        return (
            <Link to={`/${householdId ?? ''}`} className={`m-1 -mt-1 font-bold cursor-pointer ${sizeClasses[size]} ${className}`}>
                <span>Fin</span>
                <span className={`text-accent ${dotSizeClasses[size]}`}>.</span>
            </Link>
        );
    }

    // Fallback when not inside a Router (e.g., portals rendered before Router mounts)
    return (
        <div className={`m-1 -mt-1 font-bold ${sizeClasses[size]} ${className}`}>
            <span>Fin</span>
            <span className={`text-accent ${dotSizeClasses[size]}`}>.</span>
        </div>
    );
};

export default Logo;