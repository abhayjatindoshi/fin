import { useState } from "react";
import TransactionsFilter, { type TransactionFilterProps } from "../components/transactions/TransactionsFilter";
import TransactionsTable from "../components/transactions/TransactionsTable";

const TransactionsPage: React.FC = () => {

    const [filterProps, setFilterProps] = useState<TransactionFilterProps>({ sort: 'desc', });

    return (
        <div className="flex flex-col">
            <TransactionsFilter filterProps={filterProps} setFilterProps={setFilterProps} />
            <TransactionsTable filterProps={filterProps} />
        </div>
    );
};
export default TransactionsPage;