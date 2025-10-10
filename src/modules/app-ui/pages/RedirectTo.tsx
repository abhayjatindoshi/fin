import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface RedirectToProps {
    to: string;
}

export const RedirectTo: React.FC<RedirectToProps> = ({ to }: RedirectToProps) => {

    const navigate = useNavigate();

    useEffect(() => {
        if (!to.startsWith('/')) to = window.location.pathname + '/' + to;
        navigate(to);
    }, [to]);

    return <></>;
}