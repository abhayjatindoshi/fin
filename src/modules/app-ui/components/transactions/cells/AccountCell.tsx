import AccountNumber from "@/modules/app-ui/common/AccountNumber";
import { ImportIconComponent } from "@/modules/app-ui/icons/import/ImportIcon";
import type { MoneyAccount } from "@/modules/app/entities/MoneyAccount";
import { Button } from "@/modules/base-ui/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/modules/base-ui/components/ui/popover";
import { ImportMatrix } from "@/modules/import/ImportMatrix";

type AccountCellProps = {
    account: MoneyAccount;
    variant?: 'icon' | 'detailed';
}

const AccountCell: React.FC<AccountCellProps> = ({ account, variant = 'icon' }) => {

    const bank = ImportMatrix.Banks[account.bankId];
    const offering = bank?.offerings.find(o => o.id === account.offeringId);

    const icon = offering?.display?.icon ?? bank?.display?.icon ?? undefined;

    return <Popover>
        <PopoverTrigger asChild>
            <Button variant="ghost" className="flex flex-row items-center gap-2 p-0">
                <ImportIconComponent name={icon} className="size-5 text-muted-foreground" />
                {variant === 'detailed' && <div className="text-sm font-light"><AccountNumber accountNumber={account.accountNumber} /></div>}
            </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="flex flex-row items-center gap-4 py-2 px-3 justify-between w-fit">
            <ImportIconComponent name={icon} className="size-12" />
            <div className="flex flex-col items-end">
                <span className="text-xl"><AccountNumber accountNumber={account.accountNumber} /></span>
                {bank?.display?.name && <span className="uppercase text-sm text-muted-foreground truncate">{bank.display.name}</span>}
                {offering?.display?.name && <span className="text-xs text-muted-foreground truncate">{offering.display.name}</span>}
            </div>
        </PopoverContent>
    </Popover>
}

export default AccountCell;
