import { useApp } from "../providers/AppProvider";

const BudgetPage: React.FC = () => {

    const { isMobile } = useApp();

    return <div className={`fixed text-right text-muted-foreground font-black opacity-30 ${isMobile ? 'text-8xl top-10 right-10' : 'w-1/2 text-9xl bottom-0 right-2'}`}>
        Budget coming soon...
    </div>;
}

export default BudgetPage;