import { type BudgetBlock, BudgetService } from "@/modules/app/services/BudgetService";
import { useCallback, useEffect, useRef, useState } from "react";
import EditBudgetDialog from "../components/spends/EditBudgetDialog";
import SpendData from "../components/spends/SpendData";
import SpendsFilter, { type SpendFilterOptions } from "../components/spends/SpendsFilter";
import { useApp } from "../providers/AppProvider";
import { useEntity } from "../providers/EntityProvider";

const SpendsPage: React.FC = () => {

    const { tagMap } = useEntity();
    const { isMobile } = useApp();

    const budgetService = useRef(new BudgetService()).current;

    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<SpendFilterOptions>();
    const [data, setData] = useState<BudgetBlock[] | null>(null)
    const selectedBlock = useRef<BudgetBlock | null>(null);
    const [showEditBudgetDialog, setShowEditBudgetDialog] = useState(false);

    const fetchData = useCallback(async () => {
        if (!filter || !tagMap) return;
        const blocks = await budgetService.getBudgetForYear(filter.year, tagMap)
        const sortedBlocks = blocks
            .filter(block => block.totalSum !== 0)
            .sort((a, b) => a.totalSum - b.totalSum);
        setData([
            ...sortedBlocks.filter(b => b.budgetLine !== undefined),
            ...sortedBlocks.filter(b => b.budgetLine === undefined)
        ]);
    }, [filter, tagMap]);

    // populate data
    useEffect(() => {
        setLoading(true);
        fetchData().finally(() => setLoading(false));
    }, [fetchData]);

    const openBudgetEditor = (block: BudgetBlock) => {
        selectedBlock.current = block;
        setShowEditBudgetDialog(true);
    }

    return <div className="flex flex-col items-center">
        <SpendsFilter filter={filter} setFilter={setFilter} />
        {loading && <div>Loading...</div>}
        {data && <div className={`flex w-full ${isMobile ? 'flex-col gap-4' : 'flex-row flex-wrap gap-2 mt-4'} items-stretch justify-center mb-4`}>
            {data.map(block => (
                <SpendData
                    block={block}
                    key={block.tag.id ?? 'untagged'}
                    className={`${isMobile ? 'mx-4' : 'w-96'} border rounded-2xl`}
                    showEditBudgetDialog={() => openBudgetEditor(block)} />
            ))}
        </div>}
        {selectedBlock.current && filter && <EditBudgetDialog
            block={selectedBlock.current}
            filter={filter}
            open={showEditBudgetDialog}
            setOpen={setShowEditBudgetDialog}
            syncData={fetchData}
        />}
    </div>;
}

export default SpendsPage;