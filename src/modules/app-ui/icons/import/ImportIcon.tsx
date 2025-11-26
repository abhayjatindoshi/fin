import HdfcBank from './icons/hdfc.svg?react';
import Jupiter from './icons/jupiter.svg?react';

type ImportIconComponentProps = React.SVGProps<SVGSVGElement> & {
    name: string;
};

export const ImportIconComponent: React.FC<ImportIconComponentProps> = ({ name, ...props }) => {
    const Icon = ImportIcon[name];
    return Icon ? <Icon {...props} /> : null;
};

const ImportIcon: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
    hdfc: HdfcBank,
    jupiter: Jupiter,
};

export default ImportIcon;