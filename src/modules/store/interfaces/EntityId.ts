import { nanoid } from "nanoid";
import { type EntityName, type EntityType } from "./Entity";
import { EntityConfigs, type EntityScope } from "./EntityConfig";

/**
 * Entity ID Format:
 *  global:   <nanoid>
 *  yearly:   <year>.<nanoid>
 *  monthly:  <year>.<month>.<nanoid>
 */
export class EntityId {

    private id: string;
    public scope: EntityScope;
    public year?: number;
    public month?: number;

    private constructor(id: string) {
        this.id = id;
        const parts = id.split('.');
        if (parts.length === 1) {
            this.scope = 'global';
        } else if (parts.length === 2) {
            this.scope = 'yearly';
            this.year = parseInt(parts[0], 10);
        } else if (parts.length === 3) {
            this.scope = 'monthly';
            this.year = parseInt(parts[0], 10);
            this.month = parseInt(parts[1], 10);
        } else {
            throw new Error(`Invalid EntityId format: ${id}`);
        }
    }

    static new<Name extends EntityName>(entityName: Name, entity: EntityType<Name>): EntityId {
        const config = EntityConfigs[entityName];
        const scope = config.scope;
        const nanoId = nanoid(8);
        switch (scope) {
            case 'global': return new EntityId(nanoId);
            case 'yearly': {
                const year = config.getKeyDate(entity).getFullYear();
                return new EntityId(`${year}.${nanoId}`);
            }
            case 'monthly': {
                const date = config.getKeyDate(entity);
                const year = date.getFullYear();
                const month = date.getMonth() + 1;
                return new EntityId(`${year}.${month}.${nanoId}`);
            }
            default: throw new Error(`Unsupported EntityConfig scope: ${scope}`);
        }
    }

    static from(id: string): EntityId {
        return new EntityId(id);
    }

    toString(): string {
        return this.id;
    }
}