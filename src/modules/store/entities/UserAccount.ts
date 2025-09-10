import type { Entity } from "../interfaces/Entity";

export interface UserAccount extends Entity {
    name: string;
    email: string;
}