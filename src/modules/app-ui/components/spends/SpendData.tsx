import { UNTAGGED_TAG, type BudgetBlock } from "@/modules/app/services/BudgetService";
import { Button } from "@/modules/base-ui/components/ui/button";
import { ArrowRightLeft, Pencil } from "lucide-react";
import FinAreaChart from "../../common/FinAreaChart";
import FinRadialProgressChart from "../../common/FinRadialProgressChart";
import Money from "../../common/Money";
import { SemanticProgress } from "../../common/SemanticProgress";
import { TagIconComponent } from "../../icons/tags/TagIcons";

type SpendDataProps = {
    block: BudgetBlock;
    className?: string;
    onClick?: () => void;
    showEditBudgetDialog: () => void;
}

const calculateBudget = (block: BudgetBlock): number => {
    const monthlyLimit = block.budgetLine?.monthlyLimit ?? 0;
    const yearlyLimit = block.budgetLine?.yearlyLimit ?? 0;
    return monthlyLimit * 12 + yearlyLimit;
}

const SpendData: React.FC<SpendDataProps> = ({ block, className, onClick, showEditBudgetDialog }) => {

    const budgetLimit = calculateBudget(block);
    const hasBudget = budgetLimit > 0;
    const positive = block.totalSum >= 0;

    return <div className={`flex flex-col gap-4 p-4 relative group ${className}`} onClick={onClick}>

        <div className="flex flex-row gap-2 items-center text-lg font-semibold">
            <TagIconComponent name={block.tag.icon} />
            <span className="flex-1 truncate">{block.tag.name}</span>
            {block.tag !== UNTAGGED_TAG && <Button
                className="flex flex-row gap-1 items-center -m-2
                opacity-0 group-hover:opacity-100 transition-all delay-500"
                size="sm" variant="secondary" onClick={showEditBudgetDialog}>
                <Pencil />
                {block.budgetLine ? 'Edit Budget' : 'Set Budget'}
            </Button>}
        </div>

        {hasBudget && <SemanticProgress value={-block.totalSum / budgetLimit * 100} />}

        <div className="flex flex-row gap-2 items-center">
            <span>{positive ? "Recieved" : "Spent"}</span>
            <Money
                amount={Math.abs(block.totalSum)} sign={false}
                className={positive ? "text-accent" : "text-destructive"} />

            {hasBudget && <>
                <span>of</span>
                <Money amount={budgetLimit} sign={false} />
            </>}

            <div className="flex-1" />
            {block.transactions.length > 0 && <>
                <ArrowRightLeft className="size-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{block.transactions.length}</span>
            </>}
        </div>

        <div className="flex flex-row gap-2 items-center overflow-auto">
            {block.children.map(childBlock => (
                <MiniSpendData
                    key={childBlock.tag.id ?? 'untagged'}
                    block={childBlock}
                    showEditBudgetDialog={showEditBudgetDialog} />
            ))}
        </div>

        <FinAreaChart className="absolute inset-0 -z-10" chartClassName="[&_svg]:rounded-2xl" values={block.chartPoints.map(p => p.amount)} gradient />
    </div>;
}

const MiniSpendData: React.FC<SpendDataProps> = ({ block, className, onClick }) => {
    if (block.totalSum === 0) return null;
    const budgetLimit = calculateBudget(block);
    const hasBudget = budgetLimit > 0;

    return <div className={`flex flex-col items-center gap-1 ${className}`} onClick={onClick}>
        {hasBudget ?
            <FinRadialProgressChart
                color={budgetLimit + block.totalSum >= 0 ? 'var(--color-accent)' : 'var(--color-destructive)'}
                value={Math.abs(block.totalSum)}
                maxValue={budgetLimit}
                progressWidth={4}
            >
                <TagIconComponent className="size-5 m-3" name={block.tag.icon} />
            </FinRadialProgressChart> :
            <TagIconComponent className="size-8" name={block.tag.icon} />
        }
        <Money amount={Math.abs(block.totalSum)} sign={false} />
        <span className="text-nowrap">{block.tag.name}</span>
    </div>;
}
export default SpendData;