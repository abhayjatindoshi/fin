import NavbarHouseholdPicker from "./NavbarHouseholdPicker";
import NavbarLogo from "./NavbarLogo";
import NavbarMenu from "./NavbarMenu";
import NavbarProfileMenu from "./NavbarProfileMenu";

type NavbarProps = {
    className?: string;
    isMobile?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ className, isMobile = false }: NavbarProps) => {
    const themeClasses = 'border h-12 px-3 py-1 rounded-3xl bg-secondary/50 backdrop-blur';

    return (
        <div className={`flex flex-row items-center gap-2 ${className} z-20`}>
            <NavbarLogo className={themeClasses} />
            <div className="flex-grow" />
            {!isMobile && <NavbarHouseholdPicker className={themeClasses} />}
            <NavbarMenu className={themeClasses} variant={isMobile ? 'compact' : 'default'} />
            <NavbarProfileMenu />
        </div>
    )
}

export default Navbar;