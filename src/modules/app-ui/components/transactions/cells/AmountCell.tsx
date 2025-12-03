import Money from "@/modules/app-ui/common/Money";

type AmountCellProps = {
    amount: number;
};

const AmountCell: React.FC<AmountCellProps> = ({ amount }: AmountCellProps) => {
    return <Money amount={amount} />;
};
export default AmountCell;
