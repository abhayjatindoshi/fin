import { useTheme, type Theme } from "@/modules/base-ui/components/theme-provider";
import { Button } from "@/modules/base-ui/components/ui/button";
import { ButtonGroup } from "@/modules/base-ui/components/ui/button-group";
import { Moon, Sun, SunMoon } from "lucide-react";
import { createElement } from "react";

interface ThemeSwitcherProps {
    variant?: 'icon' | 'icons' | 'active-text' | 'borderless'
    className?: string
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ variant = 'icons', className }: ThemeSwitcherProps) => {
    const { theme, setTheme } = useTheme();

    const themeMap: Record<Theme, { label: string, icon: React.ElementType }> = {
        dark: { label: "Dark", icon: Moon },
        system: { label: "Auto", icon: SunMoon },
        light: { label: "Light", icon: Sun },
    };

    const toggleTheme = () => {
        switch (theme) {
            case 'dark': setTheme('system'); break;
            case 'light': setTheme('dark'); break;
            case 'system': setTheme('light'); break;
        }
    }

    if (variant === 'icon') {
        const { icon: Icon } = themeMap[theme];
        return <Button variant="outline" size="icon-sm" className={className} onClick={toggleTheme}>
            <Icon />
        </Button>;
    }

    return <ButtonGroup className={className}>
        {Object.entries(themeMap).map(([key, { label, icon }]) => (
            <Button size="icon-sm" key={key} variant={theme === key ? "default" : (variant === 'borderless' ? 'ghost' : 'outline')} onClick={() => setTheme(key as Theme)}>
                {createElement(icon)}
                {variant === 'active-text' && theme === key && <span>{label}</span>}
            </Button>
        ))}
    </ButtonGroup>;
}