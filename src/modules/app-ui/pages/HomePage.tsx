import BanksWidget from "../components/widgets/BanksWidget";
import ImportWidget from "../components/widgets/ImportWidget";
import MoneyFlowWidget from "../components/widgets/MoneyFlowWidget";
import { useApp } from "../providers/AppProvider";

const HomePage: React.FC = () => {

    const { isMobile } = useApp();

    return <>
        <div className={`flex gap-4 ${isMobile ? 'flex-col p-4' : 'items-center flex-row flex-wrap'}`}>
            <ImportWidget />
            <BanksWidget />
            <MoneyFlowWidget />
        </div>
        <div className={`-z-10 fixed text-right text-muted-foreground font-black opacity-30 ${isMobile ? 'text-8xl bottom-10 right-10' : 'w-1/2 text-9xl bottom-0 right-2'}`}>
            More widgets coming soon...
        </div>
    </>;
}

export default HomePage;