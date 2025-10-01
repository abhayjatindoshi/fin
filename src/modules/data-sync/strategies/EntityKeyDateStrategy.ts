import type { EntityUtil } from "../EntityUtil";
import type { IEntityKeyStrategy } from "../interfaces/IEntityKeyStrategy";
import type { EntityNameOf, EntityTypeOf, SchemaMap } from "../interfaces/types";

export type DateStrategyOptions = {
    years: number[];
}

export abstract class EntityKeyDateStrategy<U extends EntityUtil<SchemaMap>> implements IEntityKeyStrategy<U, DateStrategyOptions> {

    abstract separator: string;
    abstract identifierLength: number;
    abstract generateKeyForYear<N extends EntityNameOf<U>>(entityName: N, entity: EntityTypeOf<U, N>): string;
    abstract generateAllKeysForYear<N extends EntityNameOf<U>>(prefix: string, entityName: N, year: number): string[];

    generateAllKeysFor<N extends EntityNameOf<U>>(prefix: string, entityName: N, options?: DateStrategyOptions | undefined): string[] {
        if (!options) options = { years: [new Date().getFullYear()] };
        return options.years.map(year => this.generateAllKeysForYear(prefix, entityName, year)).flat();
    }

    generateKeyFor<N extends EntityNameOf<U>>(entityName: N, entity: EntityTypeOf<U, N>): string {
        return this.generateKeyForYear(entityName, entity);
    }

}