import { useTheme, type Theme } from "@/modules/base-ui/components/theme-provider";
import { Button } from "@/modules/base-ui/components/ui/Button";
import { Laptop, Moon, Sun } from "lucide-react";
import { createElement } from "react";

export const ThemeSwitcher: React.FC = () => {
    const { theme, setTheme } = useTheme();

    const allThemes: Theme[] = ["dark", "system", "light"];
    const allThemeIcons = [Moon, Laptop, Sun];

    return <div className="flex outline rounded-md">
        {allThemes.map((t, index) => (
            <Button key={t} variant={theme === t ? "default" : "ghost"} onClick={() => setTheme(t)}>
                {createElement(allThemeIcons[index])}
            </Button>
        ))}
    </div>;
}