import TagIcons, { TagIconComponent } from "@/modules/app-ui/icons/tags/TagIcons";
import { Input } from "@/modules/base-ui/components/ui/input";
import { useMemo, useState } from "react";

const ICON_KEYS = Object.keys(TagIcons).filter(k => !k.startsWith('account-'));

export interface IconPickerProps {
    value: string | undefined;
    onChange: (key: string) => void;
}

const IconPicker: React.FC<IconPickerProps> = ({ value, onChange }) => {
    const [search, setSearch] = useState('');
    const filtered = useMemo(
        () => ICON_KEYS.filter(k => k.includes(search.toLowerCase())),
        [search]
    );

    return (
        <div className="flex flex-col gap-2">
            <Input
                placeholder="Search icons…"
                value={search}
                onChange={e => setSearch(e.target.value)}
            />
            <div className="grid grid-cols-6 gap-1 max-h-56 overflow-y-auto pr-1">
                {filtered.map(key => (
                    <button
                        key={key}
                        type="button"
                        title={key}
                        onClick={() => onChange(key)}
                        className={`flex flex-col items-center justify-center gap-1 rounded-md p-2 text-xs hover:bg-accent transition-colors ${value === key ? 'bg-accent ring-2 ring-primary' : ''}`}
                    >
                        <TagIconComponent name={key} className="h-5 w-5" />
                    </button>
                ))}
                {filtered.length === 0 && (
                    <p className="col-span-6 text-center text-muted-foreground text-sm py-4">No icons found.</p>
                )}
            </div>
        </div>
    );
};

export default IconPicker;
