import Logo from "../../common/Logo";
import SyncStatus from "../../common/SyncStatus";

interface NavbarLogoProps {
    className?: string;
}

const NavbarLogo: React.FC<NavbarLogoProps> = ({ className }: NavbarLogoProps) => {
    return (
        <div className={`flex flex-row items-center ${className}`}>
            <Logo size="small" />
            <SyncStatus />
        </div>
    );
};

export default NavbarLogo;