import { ImportMatrix } from "@/modules/import/ImportMatrix";
import AccountNumber from "../../common/AccountNumber";
import { ImportIconComponent } from "../../icons/import/ImportIcon";
import { useEntity } from "../../providers/EntityProvider";
import BaseWidget from "./BaseWidget";

const BanksComponent: React.FC = () => {

    const { accountMap } = useEntity();

    return <div className="rounded-lg flex flex-row items-center justify-center gap-4 overflow-auto">
        {accountMap && Object.values(accountMap).map(account => (
            <div key={account.id} className="flex flex-row gap-4 items-center">
                <ImportIconComponent name={ImportMatrix.Banks[account.bankId]?.display?.icon} className="size-12" />
                <div className="flex flex-col min-w-36">
                    <span className="uppercase">{ImportMatrix.Banks[account.bankId]?.display?.name}</span>
                    <span className="text-muted-foreground">{ImportMatrix.Banks[account.bankId].offerings.find(o => o.id == account.offeringId)?.display?.name}</span>
                    <AccountNumber accountNumber={account.accountNumber} />
                </div>
            </div>
        ))}
    </div>;
}

const BanksWidget: React.FC = () => {
    return <BaseWidget
        WidgetComponent={BanksComponent}
        resizeable={true} size={{
            default: { width: 20, height: 10 },
            min: { width: 20, height: 10 }
        }}
    />;
}

export default BanksWidget;