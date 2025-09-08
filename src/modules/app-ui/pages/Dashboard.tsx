import { useTheme } from "@/modules/base-ui/components/theme-provider";
import { Button } from "@/modules/base-ui/components/ui/button";
import { useState } from "react";
import Logo from "../common/Logo";

const Dashboard: React.FC = () => {

    const { theme, setTheme } = useTheme();
    const [isDarkTheme, setIsDarkTheme] = useState(theme === 'dark');

    const toggleTheme = () => {
        setTheme(isDarkTheme ? 'light' : 'dark');
        setIsDarkTheme(!isDarkTheme);
    }

    return (
        <div>
            <Logo size="small" />
            <h1>Welcome to the Dashboard</h1>
            <p>This is a stub for the dashboard page.</p>
            <Button onClick={() => toggleTheme()}>
                {isDarkTheme ? 'Light Mode' : 'Dark Mode'}
            </Button>
        </div>
    );
};

export default Dashboard;