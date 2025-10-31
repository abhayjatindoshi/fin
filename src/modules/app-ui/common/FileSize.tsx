type FileSizeProps = {
    file: File;
    className?: string;
}

const FileSize: React.FC<FileSizeProps> = ({ file, className }: FileSizeProps) => {
    const size = file.size;
    const units = ['bytes', 'kb', 'mb', 'gb', 'tb'];
    let unitIndex = 0;
    let displaySize = size;
    while (displaySize >= 1024 && unitIndex < units.length - 1) {
        displaySize /= 1024;
        unitIndex++;
    }
    return <span className={className}>{displaySize.toFixed(0)} {units[unitIndex]}</span>;
}

export default FileSize;