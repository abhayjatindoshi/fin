import AccountNumber from "@/modules/app-ui/common/AccountNumber";
import { ImportIconComponent } from "@/modules/app-ui/icons/import/ImportIcon";
import { useEntity } from "@/modules/app-ui/providers/EntityProvider";
import type { MoneyAccount } from "@/modules/app/entities/MoneyAccount";
import { ImportMatrix } from "@/modules/app/import/ImportMatrix";
import type { IBank } from "@/modules/app/import/interfaces/IBank";
import { Button } from "@/modules/base-ui/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/modules/base-ui/components/ui/dropdown-menu";
import { Landmark } from "lucide-react";

type AccountFilterProps = {
    accountId?: string | null;
    setAccountId: (accountId: string | null) => void;
    className?: string;
    dropdownClassName?: string;
};

type AccountMeta = {
    account: MoneyAccount;
    bank: IBank | undefined;
}

const AccountFilter: React.FC<AccountFilterProps> = ({ accountId = null, setAccountId, className, dropdownClassName }) => {

    const { accountMap } = useEntity();

    const accountsMetaMap = Object.values(accountMap ?? {}).map(account => {
        const bank = ImportMatrix.Banks[account.bankId];
        const offering = bank?.offerings?.find(o => o.id === account.offeringId);
        return { account, bank, offering };
    }).reduce((acc, curr) => {
        if (!curr.account.id) return acc;
        acc[curr.account.id] = curr;
        return acc;
    }, {} as Record<string, AccountMeta>);

    return <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="outline" className={className}>
                {accountId ?
                    <>
                        <ImportIconComponent name={accountsMetaMap[accountId]?.bank?.display?.icon ?? ''} />
                        <AccountNumber accountNumber={accountsMetaMap[accountId]?.account.accountNumber} />
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
            {Object.values(accountsMetaMap).map(({ account, bank }) => (
                <DropdownMenuItem key={account.id} onClick={() => setAccountId(account.id ?? null)}>
                    <div className="flex flex-row gap-4 items-center">
                        <ImportIconComponent name={bank?.display?.icon ?? ''} className="size-6" />
                        <div className="flex flex-col gap-1">
                            <span className="uppercase">{bank?.display?.name ?? ''}</span>
                            <span className="text-sm text-muted-foreground"><AccountNumber accountNumber={account.accountNumber} /></span>
                        </div>
                    </div>
                </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
    </DropdownMenu>
}

export default AccountFilter;