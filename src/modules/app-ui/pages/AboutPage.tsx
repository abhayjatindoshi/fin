import { ImportMatrix } from "@/modules/app/import/ImportMatrix";
import { Item, ItemContent, ItemMedia } from "@/modules/base-ui/components/ui/item";
import { ImportIconComponent } from "../icons/import/ImportIcon";

const AboutPage: React.FC = () => {

    return <div className="p-4 flex flex-col">
        <h1 className="text-2xl font-semibold">About this app</h1>
        <span>We currently support only the below bank statements.</span>
        <div className="flex flex-row flex-wrap gap-4 p-4">
            {Object.values(ImportMatrix.Banks).sort((a, b) => a.id.localeCompare(b.id)).map(bank => (
                <Item key={bank.id} variant="outline">
                    <ItemMedia>
                        <ImportIconComponent name={bank.display.icon} className="size-10" />
                    </ItemMedia>
                    <ItemContent>
                        <div>
                            <h2 className="text-lg uppercase font-semibold">{bank.display.name}</h2>
                            {bank.offerings.map(offering => (
                                <div key={offering.id} className="text-muted-foreground">
                                    <h3 className="text-sm font-medium">{offering.display.name}</h3>
                                </div>
                            ))}
                        </div>
                    </ItemContent>
                </Item>
            ))}
        </div>
        <span>To import, simply drag and drop your bank statement file into the app on desktop.</span>
        <div className="text-muted-foreground flex flex-col text-justify mt-20">
            <span className="uppercase">Disclaimer</span>
            <span>All third-party trademarks, logos, and brand names displayed here are the property of their respective owners.</span>
            <span>"Fin." claims no ownership rights over, nor any affiliation with, the trademarks and intellectual property of these third-party entities.</span>
            <span>The use of these icons does not imply any official endorsement, sponsorship, or affiliation between "Fin." and the respective trademark owners, unless explicitly stated otherwise.</span>
        </div>
    </div>;
}
export default AboutPage;