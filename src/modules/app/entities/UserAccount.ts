import type { Entity } from "@/modules/data-sync/interfaces/Entity";

export interface UserAccount extends Entity {
    name: string;
    email: string;
}