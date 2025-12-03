import { Button } from "@/modules/base-ui/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/modules/base-ui/components/ui/dialog";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { createElement, useRef, useState } from "react";
import type { Tenant } from "../entities/Tenant";
import type { TenantFormSettings, TenantFormValidateRef } from "../interfaces/IPersistence";

interface TenantStepDialogProps<T extends Tenant> {
    settings: TenantFormSettings<T>,
    open: boolean,
    onOpenChange: (open: boolean) => void,
    fallbackTitle: string;
    fallbackDescription?: string;
    opName: string;
    opNameVerb: string;
    op: (tenant: Partial<T>) => Promise<void>;
}

const TenantStepDialog = <T extends Tenant>({
    settings, open, onOpenChange, fallbackTitle, fallbackDescription, opName, opNameVerb, op
}: TenantStepDialogProps<T>) => {


    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [tenant, setTenant] = useState<Partial<T>>({});
    const [loading, setLoading] = useState(false);
    const [doing, setDoing] = useState(false);
    const validateRef = useRef<TenantFormValidateRef>({ validate: async () => true });
    const currentStep = settings.steps[currentStepIndex];
    const nextEnabledStepIndex = settings.steps
        .findIndex((step, index) => index > currentStepIndex &&
            (step.enabled ? step.enabled(tenant) !== false : true));

    const validateAndNext = async () => {
        setLoading(true);
        try {
            const valid = await validateRef.current.validate();
            if (!valid) return;

            if (nextEnabledStepIndex !== -1) {
                setCurrentStepIndex(nextEnabledStepIndex);
            }
        } finally {
            setLoading(false);
        }
    }

    const previous = async () => {
        setCurrentStepIndex(currentStepIndex - 1);
    }

    const cancel = async () => {
        onOpenChange(false);
        setCurrentStepIndex(0);
    }

    const create = async () => {
        setDoing(true);

        try {
            const valid = await validateRef.current.validate();
            if (!valid) return;
            await op(tenant);
        } finally {
            setDoing(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{settings.title || fallbackTitle}</DialogTitle>
                    <DialogDescription>{settings.description || fallbackDescription}</DialogDescription>
                </DialogHeader>

                {settings.steps && settings.steps.length > 0 && <>
                    <div className="flex flex-row justify-center gap-4 m-4">
                        {settings.steps.map((step, index) => (
                            <Button key={index} className="rounded-full"
                                disabled={step.enabled && step.enabled(tenant) == false}
                                size={index === currentStepIndex ? "default" : "icon"}
                                variant={index === currentStepIndex ? "default" : "outline"}>
                                {index === currentStepIndex ? step.name || `Step ${index + 1}` : index + 1}
                            </Button>
                        ))}
                    </div>

                    {createElement(currentStep.component, { tenant, setTenant, validateRef })}
                </>}

                <DialogFooter>
                    <Button variant="outline" onClick={cancel}>Cancel</Button>
                    {currentStepIndex !== 0 && <Button variant="outline" disabled={loading} onClick={previous}><ChevronsLeft /> Previous</Button>}
                    {nextEnabledStepIndex !== -1 && <Button disabled={loading} onClick={validateAndNext}>Next <ChevronsRight /></Button>}
                    {nextEnabledStepIndex === -1 && <Button disabled={loading} onClick={create}>{doing ? opNameVerb : opName}</Button>}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default TenantStepDialog;