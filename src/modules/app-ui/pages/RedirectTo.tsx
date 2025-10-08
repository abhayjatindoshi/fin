import { useEffect } from "react";

interface RedirectToProps {
    to: string;
}

export const RedirectTo: React.FC<RedirectToProps> = ({ to }: RedirectToProps) => {
    useEffect(() => {
        if (!to.startsWith('/')) to = window.location.pathname + '/' + to;
        window.location.href = to;
    }, [to]);

    return <></>;
}