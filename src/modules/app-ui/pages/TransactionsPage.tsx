import { useState } from "react";
import TransactionsFilter, { getDefaultOptions, type TransactionFilterOptions } from "../components/transactions/TransactionsFilter";
import TransactionsTable from "../components/transactions/TransactionsTable";
import { useApp } from "../providers/AppProvider";

const TransactionsPage: React.FC = () => {

    const { settings } = useApp();
    const [filter, setFilter] = useState<TransactionFilterOptions>(getDefaultOptions(settings));

    return (
        <div className="flex flex-col">
            <TransactionsFilter filter={filter} setFilter={setFilter} />
            <TransactionsTable filter={filter} />
        </div>
    );
};
export default TransactionsPage;