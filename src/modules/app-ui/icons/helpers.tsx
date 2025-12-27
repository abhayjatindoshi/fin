import { memo } from "react";
import type { SimpleIcon } from "simple-icons";

export const createSimpleIcon = (icon: SimpleIcon, fill: string = `#${icon.hex}`) => {
    const IconComponent: React.FC<React.SVGProps<SVGSVGElement>> = memo(({ ...props }) => {
        return (
            <svg role="img" viewBox="0 0 24 24" width={24} height={24}
                fill={fill} aria-label={icon.title} {...props}>
                <title>{icon.title}</title>
                <path d={icon.path} />
            </svg>
        );
    });

    IconComponent.displayName = `${icon.title}Icon`;
    return IconComponent;
};