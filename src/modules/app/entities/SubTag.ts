import type { Entity } from "@/modules/data-sync/interfaces/Entity";

export interface SubTag extends Entity {
    tagId: string;
    name: string;
    icon: string;
}