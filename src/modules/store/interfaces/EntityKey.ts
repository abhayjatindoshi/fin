import { type EntityScope } from "./EntityConfig";
import type { EntityId } from "./EntityId";

/**
 * Entity Key Format:
 *   global:   <prefix>.global
 *   yearly:   <prefix>.<year>
 *   monthly:  <prefix>.<year>.<month>
 */
export class EntityKey {

    private key: string;
    public prefix: string;
    public scope: EntityScope;
    public year?: number;
    public month?: number;

    private constructor(key: string) {
        this.key = key;
        const parts = key.split('.');
        this.prefix = parts[0];
        if (parts[1] === 'global') {
            this.scope = 'global';
        } else if (parts.length == 2) {
            this.scope = 'yearly';
            this.year = parseInt(parts[1], 10);
        } else if (parts.length == 3) {
            this.scope = 'monthly';
            this.year = parseInt(parts[1], 10);
            this.month = parseInt(parts[2], 10);
        } else {
            throw new Error(`Invalid EntityKey format: ${key}`);
        }
    }

    static from(key: string): EntityKey {
        return new EntityKey(key);
    }

    static fromId(prefix: string, id: EntityId): EntityKey {
        switch (id.scope) {
            case 'global': return new EntityKey(`${prefix}.global`);
            case 'yearly':
                if (id.year) return new EntityKey(`${prefix}.${id.year}`);
                break;
            case 'monthly':
                if (id.year && id.month) return new EntityKey(`${prefix}.${id.year}.${String(id.month).padStart(2, '0')}`);
                break;
        }

        throw new Error(`Unsupported EntityConfig scope: ${id.scope}`);
    }

    toString(): string {
        return this.key;
    }
}