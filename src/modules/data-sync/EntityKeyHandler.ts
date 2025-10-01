import { nanoid } from "nanoid";
import type { EntityUtil } from "./EntityUtil";
import type { IEntityKeyStrategy } from "./interfaces/IEntityKeyStrategy";
import type { ILogger } from "./interfaces/ILogger";
import type { EntityNameOf, EntityTypeOf, SchemaMap } from "./interfaces/types";

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

export class EntityKeyHandler<U extends EntityUtil<SchemaMap>, FilterOptions> {
    private logger: ILogger;
    private prefix: string;
    private strategy: IEntityKeyStrategy<U, FilterOptions>;

    constructor(logger: ILogger, prefix: string, strategy: IEntityKeyStrategy<U, FilterOptions>) {
        this.logger = logger;
        this.prefix = prefix;
        this.strategy = strategy;
    }

    public generateNextId<N extends EntityNameOf<U>>(entityName: N, entity: EntityTypeOf<U, N>): string {
        const nanoId = nanoid(this.strategy.identifierLength);
        const key = this.strategy.generateKeyFor(entityName, entity);
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

    public getEntityKeys<N extends EntityNameOf<U>>(entityName: N, options?: FilterOptions): string[] {
        return this.strategy.generateAllKeysFor(this.prefix, entityName, options);
    }
}