import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/modules/base-ui/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/modules/base-ui/components/ui/drawer";
import type { PropsWithChildren, ReactNode } from "react";
import { useApp } from "../providers/AppProvider";

type ResponsiveDialogProps = PropsWithChildren<{
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: ReactNode;
    title?: ReactNode;
    description?: ReactNode;
    footer?: ReactNode;
}>;

const ResponsiveDialog: React.FC<ResponsiveDialogProps> = ({ open, onOpenChange, trigger, title, description, children, footer }) => {

    const { isMobile } = useApp();

    if (isMobile) {
        return <Drawer open={open} onOpenChange={onOpenChange}>
            {trigger && <DrawerTrigger>{trigger}</DrawerTrigger>}
            <DrawerContent className="px-4 pb-4">
                <DrawerHeader>
                    {title && <DrawerTitle>{title}</DrawerTitle>}
                    {description && <DrawerDescription>{description}</DrawerDescription>}
                </DrawerHeader>
                {children}
                {footer && <DrawerFooter>{footer}</DrawerFooter>}
            </DrawerContent>
        </Drawer>;
    } else {
        return <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger>{trigger}</DialogTrigger>}
            <DialogContent>
                <DialogHeader>
                    {title && <DialogTitle>{title}</DialogTitle>}
                    {description && <DialogDescription>{description}</DialogDescription>}
                </DialogHeader>
                {children}
                {footer && <DialogFooter>{footer}</DialogFooter>}
            </DialogContent>
        </Dialog>;
    }
}

export default ResponsiveDialog;