import ImportWidget from "../components/widgets/ImportWidget";
import { useApp } from "../providers/AppProvider";

const HomePage: React.FC = () => {

    const { isMobile } = useApp();

    return <>
        <div className="flex flex-row flex-wrap">
            <ImportWidget />
        </div>
        <div className={`-z-10 fixed text-right text-muted-foreground font-black opacity-30 ${isMobile ? 'text-8xl top-10 right-10' : 'w-1/2 text-9xl bottom-0 right-2'}`}>
            Widgets coming soon...
        </div>
    </>;
}

export default HomePage;