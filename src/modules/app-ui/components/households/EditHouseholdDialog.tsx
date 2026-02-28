import IconPicker from "@/modules/app-ui/components/IconPicker";
import type { Household } from "@/modules/app/entities/Household";
import { Button } from "@/modules/base-ui/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/modules/base-ui/components/ui/dialog";
import { Input } from "@/modules/base-ui/components/ui/input";
import { Label } from "@/modules/base-ui/components/ui/label";
import { Spinner } from "@/modules/base-ui/components/ui/spinner";
import { useState } from "react";

export interface EditHouseholdDialogProps {
    household: Household;
    onSave: (name: string, icon: string | undefined) => Promise<void>;
    onClose: () => void;
}

const EditHouseholdDialog: React.FC<EditHouseholdDialogProps> = ({ household, onSave, onClose }) => {
    const [name, setName] = useState(household.name ?? '');
    const [icon, setIcon] = useState<string | undefined>(household.icon);
    const [saving, setSaving] = useState(false);
    const [nameError, setNameError] = useState<string | undefined>();

    const handleSave = async () => {
        const trimmed = name.trim();
        if (!trimmed) { setNameError('Name is required'); return; }
        setSaving(true);
        try { await onSave(trimmed, icon); }
        finally { setSaving(false); }
    };

    return (
        <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Household</DialogTitle>
                    <DialogDescription>Update the name and icon for this household.</DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="hh-name">Name</Label>
                        <Input
                            id="hh-name"
                            value={name}
                            onChange={e => { setName(e.target.value); setNameError(undefined); }}
                            placeholder="Enter name…"
                            aria-invalid={!!nameError}
                        />
                        {nameError && <p className="text-sm text-destructive">{nameError}</p>}
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label>Icon</Label>
                        <IconPicker value={icon} onChange={setIcon} />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? <Spinner className="mr-2 h-4 w-4" /> : null}
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default EditHouseholdDialog;
