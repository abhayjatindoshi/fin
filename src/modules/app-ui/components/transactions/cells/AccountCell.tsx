import AccountNumber from "@/modules/app-ui/common/AccountNumber";
import { ImportIconComponent } from "@/modules/app-ui/icons/import/ImportIcon";
import type { MoneyAccount } from "@/modules/app/entities/MoneyAccount";
import type { IImportAdapter } from "@/modules/app/import/interfaces/IImportAdapter";
import { Popover, PopoverContent, PopoverTrigger } from "@/modules/base-ui/components/ui/popover";

type AccountCellProps = {
    account: MoneyAccount;
    adapter: IImportAdapter;
}

const AccountCell: React.FC<AccountCellProps> = ({ account, adapter }) => {
    return <Popover>
        <PopoverTrigger asChild>
            <ImportIconComponent name={adapter.display.icon} className="size-5 text-muted-foreground" />
        </PopoverTrigger>
        <PopoverContent align="end" className="flex flex-row items-center py-2 px-3 justify-between w-48">
            <ImportIconComponent name={adapter.display.icon} className="size-8" />
            <div className="flex flex-col items-end">
                <span className="uppercase font-semibold truncate">{adapter.display.bankName}</span>
                <span className="text-sm text-muted-foreground"><AccountNumber accountNumber={account.accountNumber} /></span>
            </div>
        </PopoverContent>
    </Popover>
}

export default AccountCell;
