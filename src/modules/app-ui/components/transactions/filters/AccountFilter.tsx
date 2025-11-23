import AccountNumber from "@/modules/app-ui/common/AccountNumber";
import { ImportIconComponent } from "@/modules/app-ui/icons/import/ImportIcon";
import { useEntity } from "@/modules/app-ui/providers/EntityProvider";
import { Button } from "@/modules/base-ui/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/modules/base-ui/components/ui/dropdown-menu";
import { Landmark } from "lucide-react";

type AccountFilterProps = {
    accountId?: string | null;
    setAccountId: (accountId: string | null) => void;
    className?: string;
    dropdownClassName?: string;
};

type DisplayAccount = {
    id: string;
    accountNumber: string;
    bankName: string;
    bankIcon: string;
}

const AccountFilter: React.FC<AccountFilterProps> = ({ accountId = null, setAccountId, className, dropdownClassName }) => {

    const { accountMap, adapterMap } = useEntity();

    const displayAccountMap = !accountMap ? {} : Object.values(accountMap).reduce((obj, account) => {
        if (!account.id) return obj;
        const adapter = adapterMap?.[account.adapterName];
        if (!adapter) return obj;
        obj[account.id] = {
            id: account.id,
            accountNumber: account.accountNumber,
            bankName: adapter.display.bankName,
            bankIcon: adapter.display.icon,
        }
        return obj;
    }, {} as Record<string, DisplayAccount>);

    return <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="outline" className={className}>
                {accountId ?
                    <>
                        <ImportIconComponent name={displayAccountMap[accountId]?.bankIcon} />
                        <AccountNumber accountNumber={displayAccountMap[accountId]?.accountNumber} />
                    </> :
                    <><Landmark /> All accounts</>
                }
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className={`w-64 ${dropdownClassName}`}>
            <DropdownMenuItem key={'all-accounts'} onClick={() => setAccountId(null)}>
                <div className="flex flex-row gap-4 items-center">
                    <Landmark className="size-4 mx-1" /> All accounts
                </div>
            </DropdownMenuItem>
            {Object.values(displayAccountMap).map(account => (
                <DropdownMenuItem key={account.id} onClick={() => setAccountId(account.id ?? null)}>
                    <div className="flex flex-row gap-4 items-center">
                        <ImportIconComponent name={account.bankIcon ?? ''} className="size-6" />
                        <div className="flex flex-col gap-1">
                            <span className="uppercase">{account.bankName}</span>
                            <span className="text-sm text-muted-foreground"><AccountNumber accountNumber={account.accountNumber} /></span>
                        </div>
                    </div>
                </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
    </DropdownMenu>
}

export default AccountFilter;