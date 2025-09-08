import { Link } from "react-router-dom";

interface LogoProps {
    size?: 'small' | 'medium' | 'large';
}

const Logo: React.FC<LogoProps> = ({ size = "small" }: LogoProps) => {

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

    return (
        <Link to="/" className={`m-1 font-bold cursor-pointer ${sizeClasses[size]}`}>
            <span>Fin</span>
            <span className={`text-accent ${dotSizeClasses[size]}`}>.</span>
        </Link>
    );
};

export default Logo;