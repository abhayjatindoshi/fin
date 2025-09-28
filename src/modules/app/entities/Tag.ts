import type { Entity } from "@/modules/data-sync/interfaces/Entity";

export interface Tag extends Entity {
    name: string;
    icon: string;
}