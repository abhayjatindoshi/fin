import HdfcBank from './icons/hdfc.svg?react';

type ImportIconComponentProps = React.SVGProps<SVGSVGElement> & {
    name: string;
};

export const ImportIconComponent: React.FC<ImportIconComponentProps> = ({ name, ...props }) => {
    const Icon = ImportIcon[name];
    return Icon ? <Icon {...props} /> : null;
};

const ImportIcon: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
    hdfc: HdfcBank,
};

export default ImportIcon;