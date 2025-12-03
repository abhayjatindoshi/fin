import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface RedirectToProps {
    to: string;
}

export const RedirectTo: React.FC<RedirectToProps> = ({ to }: RedirectToProps) => {

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!to.startsWith('/')) to = location.pathname + '/' + to;
        navigate(to);
    }, [to]);

    return <></>;
}