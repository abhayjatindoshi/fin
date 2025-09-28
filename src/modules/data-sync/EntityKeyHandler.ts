import { nanoid } from "nanoid";
import type { Entity } from "./interfaces/Entity";
import type { IEntityKeyStrategy } from "./interfaces/IEntityKeyStrategy";
import type { ILogger } from "./interfaces/ILogger";
import type { EntityName } from "./interfaces/types";

/**
 * Entity ID Format:
 *  global:   <nanoid>
 *  other:    <key>.<nanoid>
 */

/**
 * Entity Key Format:
 *  global:   <prefix>.global
 *  other:    <prefix>.<key>
 */

export class EntityKeyHandler<FilterOptions> {
    private logger: ILogger;
    private prefix: string;
    private strategy: IEntityKeyStrategy<FilterOptions>;

    constructor(logger: ILogger, prefix: string, strategy: IEntityKeyStrategy<FilterOptions>) {
        this.logger = logger;
        this.prefix = prefix;
        this.strategy = strategy;
    }

    public getEntityKey<E extends Entity>(entityName: EntityName<E>, entity: E): string {
        const key = this.strategy.getKey(entityName, entity);
        return `${this.prefix}${this.strategy.separator}${key}`;
    }

    public generateNextId<E extends Entity>(entityName: EntityName<E>, entity: E): string {
        const nanoId = nanoid(this.strategy.identifierLength);
        const key = this.strategy.getKey(entityName, entity);
        const id = `${key}${this.strategy.separator}${nanoId}`;
        this.logger.i(this.constructor.name, `Generated new ID for entity ${entityName}`, id);
        return id;
    }

    public getEntityKeyFromId(id: string): string {
        const parts = id.split(this.strategy.separator);
        if (parts.length <= 1) return `${this.prefix}${this.strategy.separator}global`;
        parts.pop();
        const key = parts.join(this.strategy.separator);
        return `${this.prefix}${this.strategy.separator}${key}`;
    }

    public getEntityKeys<E extends Entity>(entityName: EntityName<E>, options?: FilterOptions): string[] {
        return this.strategy.entityKeyFilter(this.prefix, entityName, options);
    }
}