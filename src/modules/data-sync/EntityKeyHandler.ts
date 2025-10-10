import { nanoid } from "nanoid";
import type { EntityUtil } from "./EntityUtil";
import type { IEntityKeyStrategy } from "./interfaces/IEntityKeyStrategy";
import type { ILogger } from "./interfaces/ILogger";
import type { EntityNameOf, EntityTypeOf, SchemaMap } from "./interfaces/types";

/**
 * Entity ID Format: <key>.<nanoid>
 */

export class EntityKeyHandler<U extends EntityUtil<SchemaMap>, FilterOptions> {
    private logger: ILogger;
    private strategy: IEntityKeyStrategy<U, FilterOptions>;

    constructor(logger: ILogger, strategy: IEntityKeyStrategy<U, FilterOptions>) {
        this.logger = logger;
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
        parts.pop(); // Remove the nanoid part
        const key = parts.join(this.strategy.separator);
        return `${key}`;
    }

    public getEntityKeys<N extends EntityNameOf<U>>(entityName: N, options?: FilterOptions): string[] {
        return this.strategy.generateAllKeysFor(entityName, options);
    }
}