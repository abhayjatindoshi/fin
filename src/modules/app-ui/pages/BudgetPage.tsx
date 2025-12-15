import { BudgetService, type BudgetBlock } from "@/modules/app/services/BudgetService";
import { TransactionService } from "@/modules/app/services/TransactionService";
import { Button } from "@/modules/base-ui/components/ui/button";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/modules/base-ui/components/ui/dropdown-menu";
import { Input } from "@/modules/base-ui/components/ui/input";
import { Progress } from "@/modules/base-ui/components/ui/progress";
import { Spinner } from "@/modules/base-ui/components/ui/spinner";
import { useDataSync } from "@/modules/data-sync/providers/DataSyncProvider";
import { ChevronDown, Pencil } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import Money from "../common/Money";
import ResponsiveDialog from "../common/ResponsiveDialog";
import { TagIconComponent } from "../icons/tags/TagIcons";
import { useApp } from "../providers/AppProvider";
import { useEntity } from "../providers/EntityProvider";

const BudgetPage: React.FC = () => {

    const { isMobile } = useApp();
    const { tagMap } = useEntity();
    const { orchestrator } = useDataSync();
    const budgetService = useRef(new BudgetService());
    const transactionService = useRef(new TransactionService());
    const [year, setYear] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [budgetBlocks, setBudgetBlocks] = useState<BudgetBlock[] | null>();
    const [selectedBlock, setSelectedBlock] = useState<BudgetBlock | null>(null);
    const [showEditBudgetDialog, setShowEditBudgetDialog] = useState<boolean>(false);

    useEffect(() => {
        if (!orchestrator) return;
        transactionService.current.getCurrentYear().then(setYear);
    }, [orchestrator])

    const fetchData = useCallback(async () => {
        if (!year || !tagMap) return;
        const blocks = await budgetService.current.getBudgetForYear(year, tagMap);
        setBudgetBlocks(blocks);
    }, [year, tagMap]);

    useEffect(() => {
        setLoading(true);
        fetchData().finally(() => setLoading(false));
    }, [fetchData]);

    const budgetLimit = (block: BudgetBlock): number => {
        const monthlyLimit = block.budgetLine?.monthlyLimit ?? 0;
        const yearlyLimit = block.budgetLine?.yearlyLimit ?? 0;
        return monthlyLimit * 12 + yearlyLimit;
    }

    const ChildBudgetBlock: React.FC<{ block: BudgetBlock }> = ({ block }) => {
        if (block.totalReceived === 0 && block.totalGiven === 0) return null;
        return <div key={block.tag.id} className="w-full flex flex-row gap-4 items-center pl-4 py-2">
            <span className="flex flex-row gap-3 items-center">{block.tag && <TagIconComponent name={block.tag.icon} />} {block.tag.name}</span>
            <div className="flex flex-row gap-4">
                {block.totalReceived !== 0 && <span className={"text-green-500"}><Money amount={block.totalReceived} /></span>}
                {block.totalGiven !== 0 && <span className={"text-red-500"}><Money amount={block.totalGiven} /></span>}
            </div>
            {block.budgetLine && <div className="w-full">
                <Progress value={-block.totalGiven / budgetLimit(block) * 100} color="accent" />
            </div>}
        </div>
    }

    const ParentBudgetBlock: React.FC<{ block: BudgetBlock }> = ({ block }) => {
        if (block.totalReceived === 0 && block.totalGiven === 0) return null
        return <div key={block.tag.id} className="w-full max-w-3xl p-4 border-b border-border relative group">
            <div className="absolute top-2 right-2 hidden group-hover:block">
                <Button variant="secondary" size="sm" onClick={() => { setSelectedBlock(block); setShowEditBudgetDialog(true); }}>
                    {block.budgetLine ? <><Pencil /> Edit Budget</> : <><Pencil /> Set Budget</>}
                </Button>
            </div>
            <h2 className="text-lg font-semibold mb-2 flex flex-row gap-3">{block && <TagIconComponent name={block.tag.icon} />} {block.tag.name}</h2>
            {block.budgetLine && <div className="w-full my-4">
                <Progress value={-block.totalGiven / budgetLimit(block) * 100} color="accent" />
            </div>}
            <div className="flex flex-row gap-4">
                <span className="font-semibold">Total: </span>
                {block.totalReceived !== 0 && <span className={"text-green-500"}><Money amount={block.totalReceived} /></span>}
                {block.totalGiven !== 0 && <span className={"text-red-500"}><Money amount={block.totalGiven} /></span>}
            </div>
            <div className="mt-4 flex flex-col">
                {block.children.map(childBlock => <ChildBudgetBlock key={childBlock.tag.id} block={childBlock} />)}
            </div>
        </div>
    }

    type EditBudgetDialogProps = {
        block: BudgetBlock;
        open: boolean;
        setOpen: (open: boolean) => void;
    }
    const EditBudgetDialog: React.FC<EditBudgetDialogProps> = ({ block, open, setOpen }) => {
        return <ResponsiveDialog open={open} onOpenChange={setOpen}
            title={<div className="flex flex-row gap-2 items-center">
                {block && <TagIconComponent name={block.tag.icon} />}
                {`Edit Budget - ${block.tag.name}`}
            </div>}>
            <div className="flex flex-col gap-4">
                <div className="flex flex-row gap-2">
                    <Input type="number" placeholder="Monthly Limit" defaultValue={block.budgetLine ? block.budgetLine.monthlyLimit : undefined} />
                    <Input type="number" placeholder="Yearly Limit" defaultValue={block.budgetLine ? block.budgetLine.yearlyLimit : undefined} />
                </div>
                <table className="w-full">
                    {block.children.map(childBlock => (
                        <tr key={childBlock.tag.id}>
                            <td><TagIconComponent name={childBlock.tag.icon} /></td>
                            <td><span>{childBlock.tag.name}</span></td>
                            <td><Input className="w-36 m-1" type="number" placeholder="Monthly Limit" defaultValue={childBlock.budgetLine ? childBlock.budgetLine.monthlyLimit : undefined} /></td>
                            <td><Input className="w-36 m-1" type="number" placeholder="Yearly Limit" defaultValue={childBlock.budgetLine ? childBlock.budgetLine.yearlyLimit : undefined} /></td>
                        </tr>
                    ))}
                </table>
            </div>
        </ResponsiveDialog>
    }

    const budgetBlockSorter = (a: BudgetBlock, b: BudgetBlock): number => {
        let aScore = 0, bScore = 0;
        aScore += a.budgetLine ? 10000000000 : 0;
        bScore += b.budgetLine ? 10000000000 : 0;
        aScore += Math.abs(a.totalGiven + a.totalReceived);
        bScore += Math.abs(b.totalGiven + b.totalReceived);
        return bScore - aScore;
    }

    return <>
        <div className="flex flex-col items-center">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="self-end">
                        {year} <ChevronDown />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-secondary/50 backdrop-blur-xs">
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                        <DropdownMenuCheckboxItem key={y} checked={year === y} onSelect={() => setYear(y)}>{y}</DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
            {loading && <Spinner />}
            {budgetBlocks && budgetBlocks.sort(budgetBlockSorter).map(block =>
                <ParentBudgetBlock key={block.tag.id} block={block} />
            )}
        </div>
        {selectedBlock && <EditBudgetDialog
            block={selectedBlock}
            open={showEditBudgetDialog}
            setOpen={setShowEditBudgetDialog}
        />}
        <div className={`-z-10 fixed text-right text-muted-foreground font-black opacity-30 ${isMobile ? 'text-8xl top-10 right-10' : 'w-1/2 text-9xl bottom-0 right-2'}`}>
            Budget coming soon...
        </div>
    </>;
}

export default BudgetPage;