import { BudgetLineSchema } from "@/modules/app/entities/BudgetLine";
import { BudgetService, type BudgetBlock } from "@/modules/app/services/BudgetService";
import { Button } from "@/modules/base-ui/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/modules/base-ui/components/ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/modules/base-ui/components/ui/input-group";
import { ChevronDownIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Currency from "../../common/Currency";
import ResponsiveDialog from "../../common/ResponsiveDialog";
import { TagIconComponent } from "../../icons/tags/TagIcons";
import { useApp } from "../../providers/AppProvider";
import type { SpendFilterOptions } from "./SpendsFilter";

type EditBudgetDialogProps = {
    block: BudgetBlock;
    filter: SpendFilterOptions;
    open: boolean;
    setOpen: (open: boolean) => void;
    syncData: () => void;
}

type CurrentBlockBudget = {
    tagId: string;
    monthlyLimit: number;
    yearlyLimit: number;
    childBudgets: Record<string, CurrentBlockBudget> | null;
}

const EditBudgetDialog: React.FC<EditBudgetDialogProps> = ({ block, filter, open, setOpen, syncData }) => {

    const toCurrentBudget = (block: BudgetBlock): CurrentBlockBudget => {
        if (block.tag.id === undefined) throw new Error("Block tag ID is undefined");
        return {
            tagId: block.tag.id,
            monthlyLimit: block.budgetLine ? block.budgetLine.monthlyLimit ?? 0 : 0,
            yearlyLimit: block.budgetLine ? block.budgetLine.yearlyLimit ?? 0 : 0,
            childBudgets: block.children && block.children.length > 0 ? block.children.reduce((acc, child) => {
                if (child.tag.id === undefined) throw new Error("Child block tag ID is undefined");
                acc[child.tag.id] = toCurrentBudget(child);
                return acc;
            }, {} as Record<string, CurrentBlockBudget>) : null,
        }
    }

    const [currentBudget, setCurrentBudget] = useState<CurrentBlockBudget>(toCurrentBudget(block));
    const [saving, setSaving] = useState<boolean>(false);
    const budgetService = useRef(new BudgetService()).current;

    const save = async () => {
        if (filter.year === null) return;
        setSaving(true);
        try {

            if (currentBudget.monthlyLimit > 0 || currentBudget.yearlyLimit > 0) {
                await budgetService.saveBudgetLine(BudgetLineSchema.parse({
                    tagId: currentBudget.tagId,
                    monthlyLimit: currentBudget.monthlyLimit,
                    yearlyLimit: currentBudget.yearlyLimit,
                    year: new Date(filter.year, 0, 1),
                }));
            } else {
                await budgetService.deleteBudgetLine(filter.year, currentBudget.tagId);
            }

            if (currentBudget.childBudgets) {
                for (const childBudget of Object.values(currentBudget.childBudgets)) {
                    if (childBudget.monthlyLimit > 0 || childBudget.yearlyLimit > 0) {
                        await budgetService.saveBudgetLine(BudgetLineSchema.parse({
                            tagId: childBudget.tagId,
                            monthlyLimit: childBudget.monthlyLimit,
                            yearlyLimit: childBudget.yearlyLimit,
                            year: new Date(filter.year, 0, 1),
                        }));
                    } else {
                        await budgetService.deleteBudgetLine(filter.year, childBudget.tagId);
                    }
                }
            }

        } finally {
            setSaving(false);
            setOpen(false);
            syncData();
        }
    }

    const setChildValue = (tagId: string, value: { monthlyLimit: number, yearlyLimit: number }) => {
        const childBudgets = currentBudget.childBudgets ? { ...currentBudget.childBudgets } : {};
        const childBudget = childBudgets[tagId] ? { ...childBudgets[tagId] } : { tagId: tagId, monthlyLimit: 0, yearlyLimit: 0, childBudgets: null };
        childBudget.monthlyLimit = value.monthlyLimit;
        childBudget.yearlyLimit = value.yearlyLimit;
        childBudgets[tagId] = childBudget;
        setCurrentBudget({ ...currentBudget, childBudgets: childBudgets });
    }

    return <ResponsiveDialog open={open} onOpenChange={setOpen}
        title={<div className="flex flex-row gap-2 items-center">
            {block && <TagIconComponent name={block.tag.icon} />}
            {`Edit Budget - ${block.tag.name}`}
        </div>}>
        <div className="flex flex-col gap-2 p-2">
            <BudgetInput
                disabled={saving}
                value={{ monthlyLimit: currentBudget.monthlyLimit, yearlyLimit: currentBudget.yearlyLimit }}
                onChange={value => setCurrentBudget({ ...currentBudget, ...value })} />

            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-2">
                {block.children.map(childBlock => (
                    <div key={childBlock.tag.id} className="flex flex-row items-center gap-2">
                        <TagIconComponent className="size-7" name={childBlock.tag.icon} />
                        <span className="w-32 truncate">{childBlock.tag.name}</span>
                        <BudgetInput
                            disabled={saving}
                            value={currentBudget.childBudgets?.[childBlock.tag.id!]}
                            onChange={value => setChildValue(childBlock.tag.id!, value)} />
                    </div>
                ))}
            </div>

            <Button disabled={saving} onClick={save}>Save</Button>
        </div>
    </ResponsiveDialog>
}

type BudgetInputProps = {
    disabled?: boolean;
    value?: { monthlyLimit: number, yearlyLimit: number };
    onChange?: (value: { monthlyLimit: number, yearlyLimit: number }) => void;
    placeholder?: string;
    className?: string;
}

const BudgetInput: React.FC<BudgetInputProps> = ({ disabled, value, onChange, placeholder, className }) => {

    const getLimit = (value: { monthlyLimit: number, yearlyLimit: number } | undefined): number => {
        if (!value) return 0;
        return value.monthlyLimit > 0 ? value.monthlyLimit : value.yearlyLimit;
    }

    const getPeriod = (value: { monthlyLimit: number, yearlyLimit: number } | undefined): 'Monthly' | 'Yearly' => {
        if (!value) return 'Monthly';
        return value.monthlyLimit > 0 ? 'Monthly' : 'Yearly';
    }

    const { settings } = useApp();
    const [limit, setLimit] = useState<number>(getLimit(value));
    const [period, setPeriod] = useState<'Monthly' | 'Yearly'>(getPeriod(value));

    useEffect(() => {
        if (!onChange) return;
        if (period === 'Monthly') {
            if (value?.monthlyLimit === limit) return;
            onChange({ monthlyLimit: limit, yearlyLimit: 0 });
        } else {
            if (value?.yearlyLimit === limit) return;
            onChange({ monthlyLimit: 0, yearlyLimit: limit });
        }
    }, [onChange, limit, period]);

    return <InputGroup className={className}>
        {settings && <InputGroupAddon><Currency code={settings["transaction.defaultCurrencyCode"]} /></InputGroupAddon>}

        <InputGroupInput
            type="number"
            disabled={disabled}
            placeholder={placeholder}
            value={limit}
            onChange={e => setLimit(Number(e.target.value))}
        />

        <InputGroupAddon align="inline-end">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <InputGroupButton variant="ghost" className="!pr-1.5 text-xs">
                        {period} <ChevronDownIcon className="size-3" />
                    </InputGroupButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="[--radius:0.95rem]">
                    <DropdownMenuItem onClick={() => setPeriod('Monthly')}>Monthly</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setPeriod('Yearly')}>Yearly</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </InputGroupAddon>
    </InputGroup>
}
export default EditBudgetDialog;