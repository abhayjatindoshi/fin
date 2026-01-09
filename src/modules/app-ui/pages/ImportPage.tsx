import type { AuthAccount } from "@/modules/app/entities/AuthAccount";
import type { EmailImportSetting } from "@/modules/app/entities/EmailImportSetting";
import { EntityName } from "@/modules/app/entities/entities";
import { AuthService } from "@/modules/app/services/AuthService";
import { AuthMatrix } from "@/modules/auth/AuthMatrix";
import { Avatar, AvatarFallback, AvatarImage } from "@/modules/base-ui/components/ui/avatar";
import { Button } from "@/modules/base-ui/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/modules/base-ui/components/ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/modules/base-ui/components/ui/input-group";
import { useDataSync } from "@/modules/data-sync/providers/DataSyncProvider";
import { ChevronDownIcon, Plus, TimerIcon } from "lucide-react";
import moment from "moment";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { unsubscribeAll } from "../common/ComponentUtils";
import ResponsiveDialog from "../common/ResponsiveDialog";

const IntervalPeriods = ['hours', 'days', 'weeks', 'months'] as const;
type IntervalPeriod = typeof IntervalPeriods[number];

const ImportPage: React.FC = () => {

    const { orchestrator } = useDataSync();
    const { householdId } = useParams();
    const service = useRef(new AuthService()).current;
    // const importService = useRef(new EmailImportService()).current;
    const [accountMap, setAccountMap] = useState<Record<string, AuthAccount[]>>({});
    const [syncSettingsMap, setSyncSettingsMap] = useState<Record<string, EmailImportSetting>>({});
    const [selectedAccount, setSelectedAccount] = useState<AuthAccount | null>(null);
    const [interval, setInterval] = useState<number>(1);
    const [period, setPeriod] = useState<IntervalPeriod>('months');
    const [savingSettings, setSavingSettings] = useState<boolean>(false);
    const [blobs, setBlobs] = useState<Blob[]>([]);

    useEffect(() => {
        if (!orchestrator) return;
        const accountRepo = orchestrator.repo(EntityName.AuthAccount);
        const s1 = accountRepo.observeAll()
            .subscribe(result => {
                const accounts = result as AuthAccount[];
                const map: Record<string, AuthAccount[]> = {};
                accounts.forEach(account => {
                    map[account.token.handlerId] = map[account.token.handlerId] || [];
                    map[account.token.handlerId].push(account);
                });
                setAccountMap(map);
            });

        const syncSettingsRepo = orchestrator.repo(EntityName.EmailImportSetting);
        const s2 = syncSettingsRepo.observeAll()
            .subscribe(result => {
                const settings = result as EmailImportSetting[];
                const map: Record<string, EmailImportSetting> = {};
                settings.forEach(setting => {
                    map[setting.authAccountId] = setting;
                });
                setSyncSettingsMap(map);
            });
        return unsubscribeAll(s1, s2);
    }, [orchestrator]);

    const deleteAccount = async (account: AuthAccount) => {
        if (!orchestrator || !account.id) return;
        const accountRepo = orchestrator.repo(EntityName.AuthAccount);
        accountRepo.delete(account.id);
    }

    const openSettings = (account: AuthAccount) => {
        const settings = syncSettingsMap[account.id || ''];
        if (settings) {
            const intervalInMinutes = settings.importInterval;
            if (intervalInMinutes % 43200 === 0) { // months
                setPeriod('months');
                setInterval(intervalInMinutes / 43200);
            } else if (intervalInMinutes % 10080 === 0) { // weeks
                setPeriod('weeks');
                setInterval(intervalInMinutes / 10080);
            } else if (intervalInMinutes % 1440 === 0) { // days
                setPeriod('days');
                setInterval(intervalInMinutes / 1440);
            } else { // hours
                setPeriod('hours');
                setInterval(intervalInMinutes / 60);
            }
        } else {
            setPeriod('months');
            setInterval(1);
        }
        setSelectedAccount(account);
    }

    const saveSettings = async () => {
        if (!selectedAccount || !orchestrator || !selectedAccount.id) return;
        setSavingSettings(true);
        try {
            const intervalInMinutes =
                period === 'hours' ? interval * 60 :
                    period === 'days' ? interval * 1440 :
                        period === 'weeks' ? interval * 10080 :
                            interval * 43200; // months
            // await importService.setConfig({ syncInterval: intervalInMinutes, authAccountId: selectedAccount.id });
            setSelectedAccount(null);
        } finally {
            setSavingSettings(false);
        }
    }

    const doStuff = async (account: AuthAccount) => {
        // const handler = AuthMatrix.FeatureHandlers['mail'][account.token.handlerId] as IAuthMailHandler;
        // const token = await service.getValidToken(account.token, householdId);
        // const messages = await handler.fetchMessages(token, ['19adadd45c21ef71']);
        // const pdfAttachments = await Promise.all(messages.flatMap(m => m.attachments
        //     .filter(a => a.mimeType === 'application/pdf')
        //     .map(a => handler.fetchAttachment(token, m.id, a.id))));
        // setBlobs(pdfAttachments);
        if (!account.id) return;
        // await importService.syncNow(account.id);
    }

    const SyncStatus: React.FC<{ accountId: string }> = ({ accountId }) => {
        const settings = syncSettingsMap[accountId];
        if (!settings) return null;

        const status = settings.importState;
        if (!status) return null;

        return <>
            {status.lastImportAt && <div className="text-sm mt-2">Last synced {moment(status.lastImportAt).fromNow()}</div>}
        </>;
    }

    return <div className="flex flex-col gap-2 items-start w-full">
        <div className="text-2xl font-semibold">Email Accounts</div>
        {Object.keys(AuthMatrix.FeatureHandlers['mail']).map((providerId) => {
            const display = AuthMatrix.HandlerDisplay[providerId];
            return <div key={providerId}>
                <div key={`${providerId}-title`} className="flex flex-row gap-2 items-center w-full">
                    <display.icon className="size-6" />
                    <div className="text-xl">{display.name}</div>
                    <div className="w-32" />
                    <Button variant="outline" className="flex flex-row items-center" onClick={() => service.login(providerId, location.pathname, householdId)}>
                        <Plus />
                        Add New Account
                    </Button>
                </div>
                {accountMap[providerId] && <div key={`${providerId}-accounts`} className="flex flex-row flex-wrap gap-4 w-full mt-4">
                    {accountMap[providerId].map(account => (
                        <div key={account.id} className="flex flex-col items-center rounded-xl border p-4">
                            <Avatar className="size-11 cursor-pointer mb-3">
                                <AvatarImage src={account.user.picture} alt={account.user.name} />
                                <AvatarFallback>{account.user.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="text-lg">{account.user.name}</div>
                            <div className="text-muted-foreground text-sm">{account.user.email}</div>
                            <div className="text-sm mt-2">Added on {account.createdAt.toLocaleDateString()}</div>
                            {account.id && <SyncStatus accountId={account.id} />}
                            <div className="flex flex-col items-center mt-4 gap-2 w-full">
                                <Button variant="outline" onClick={() => doStuff(account)}>Sync Now </Button>
                                <Button variant="outline" onClick={() => openSettings(account)}>
                                    {(account.id && syncSettingsMap[account.id]) ? "Edit settings" : "Configure"}
                                </Button>
                                <Button variant="destructive" onClick={() => deleteAccount(account)}>
                                    Remove Account
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>}
            </div>
        })}

        {blobs.length > 0 && <div>
            <div className="text-2xl font-semibold mt-8">Fetched Attachments</div>
            <div className="flex flex-row flex-wrap gap-4 mt-4">
                {blobs.map((blob, index) => (
                    <a
                        key={index}
                        href={URL.createObjectURL(blob)}
                        download={`attachment_${index}.pdf`}
                        className="block border rounded p-2"
                    >
                        Attachment {index + 1}
                    </a>
                ))}
            </div>
        </div>}

        <ResponsiveDialog title="Settings" open={selectedAccount !== null} onOpenChange={() => setSelectedAccount(null)}>
            <div className="flex flex-col items-start gap-2">
                <div>Sync new emails at what interval ?</div>
                <div className="flex flex-row gap-2 w-full">
                    <InputGroup>
                        <InputGroupAddon><TimerIcon /></InputGroupAddon>
                        <InputGroupInput
                            type="number"
                            disabled={savingSettings}
                            value={interval}
                            onChange={e => setInterval(Number(e.target.value))}
                        />
                        <InputGroupAddon align="inline-end">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <InputGroupButton disabled={savingSettings} variant="ghost" className="!pr-1.5 text-xs">
                                        {period} <ChevronDownIcon className="size-3" />
                                    </InputGroupButton>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {IntervalPeriods.map(p => (
                                        <DropdownMenuItem key={p} onClick={() => setPeriod(p)}>
                                            {p.charAt(0).toUpperCase() + p.slice(1)}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </InputGroupAddon>
                    </InputGroup>
                    <Button variant="outline" disabled={savingSettings} onClick={() => saveSettings()}>Save</Button>
                </div>
            </div>
        </ResponsiveDialog>
    </div>
}

export default ImportPage;