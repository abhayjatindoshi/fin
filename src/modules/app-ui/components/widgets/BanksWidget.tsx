import type { MoneyAccount } from "@/modules/app/entities/MoneyAccount";
import { Separator } from "@/modules/base-ui/components/ui/separator";
import { ImportMatrix } from "@/modules/import/ImportMatrix";
import { ImportIconComponent } from "../../icons/import/ImportIcon";
import { useEntity } from "../../providers/EntityProvider";
import BaseWidget from "./BaseWidget";

const METADATA_LABELS: Record<string, string> = {
    accountNumber: "Account No.",
    accountHolderName: "Holder",
    customerId: "Customer ID",
    ifscCode: "IFSC",
    swiftCode: "SWIFT",
    micrCode: "MICR",
};

const MetadataRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="flex flex-row items-baseline gap-2">
        <span className="text-xs text-muted-foreground w-24 shrink-0">{label}</span>
        <span className="text-xs font-mono truncate">{value}</span>
    </div>
);

const AccountCard: React.FC<{ account: MoneyAccount }> = ({ account }) => {
    const bank = ImportMatrix.Banks[account.bankId];
    const offering = bank?.offerings?.find(o => o.id === account.offeringId);

    const metadataEntries = Object.entries(account.metadata ?? {})
        .filter(([key]) => key !== 'accountHolderName')
        .flatMap(([key, values]) =>
            (values ?? []).map(v => ({ label: METADATA_LABELS[key] ?? key, value: v }))
        );

    const holderName = account.metadata?.['accountHolderName']?.[0];

    return (
        <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 w-full sm:w-auto sm:min-w-60 shadow-sm">
            {/* Header: icon + bank + offering */}
            <div className="flex flex-row items-center gap-3">
                <ImportIconComponent
                    name={bank?.display?.icon}
                    className="size-10 shrink-0"
                />
                <div className="flex flex-col min-w-0">
                    <span className="font-semibold leading-tight truncate">
                        {bank?.display?.name ?? account.bankId}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                        {offering?.display?.name ?? account.offeringId}
                    </span>
                </div>
            </div>

            <Separator />

            {/* Account number + holder */}
            <div className="flex flex-col gap-1">
                <MetadataRow
                    label={METADATA_LABELS['accountNumber']}
                    value={`****${account.accountNumber.slice(-4)}`}
                />
                {holderName && (
                    <MetadataRow
                        label={METADATA_LABELS['accountHolderName']}
                        value={holderName}
                    />
                )}
            </div>

            {/* Extra metadata */}
            {metadataEntries.length > 0 && <>
                <Separator />
                <div className="flex flex-col gap-1">
                    {metadataEntries.map(({ label, value }, i) => (
                        <MetadataRow key={i} label={label} value={value} />
                    ))}
                </div>
            </>}
        </div>
    );
};

const BanksComponent: React.FC = () => {
    const { accountMap } = useEntity();
    const accounts = Object.values(accountMap ?? {});

    if (accounts.length === 0) {
        return (
            <div className="text-sm text-muted-foreground py-4">
                No bank accounts found.
            </div>
        );
    }

    return (
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 w-full">
            {accounts.map(account => (
                <AccountCard key={account.id} account={account} />
            ))}
        </div>
    );
};

const BanksWidget: React.FC = () => {
    return <BaseWidget
        WidgetComponent={BanksComponent}
        resizeable={true}
        size={{
            default: { width: 20, height: 10 },
            min: { width: 20, height: 10 },
        }}
    />;
};

export default BanksWidget;