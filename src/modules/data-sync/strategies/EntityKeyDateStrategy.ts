import type { Entity } from "../interfaces/Entity";
import type { IEntityKeyStrategy } from "../interfaces/IEntityKeyStrategy";
import type { EntityName } from "../interfaces/types";

export type DateStrategyOptions = {
    years: number[];
}

export abstract class EntityKeyDateStrategy implements IEntityKeyStrategy<DateStrategyOptions> {
    abstract separator: string;
    abstract identifierLength: number;
    abstract getEntityKeyWithoutPrefix<E extends Entity>(entityName: EntityName<E>, entity: E): string;
    abstract generateAllEntityKeys<E extends Entity>(prefix: string, entityName: EntityName<E>, year: number): string[];

    entityKeyFilter<E extends Entity>(prefix: string, entityName: EntityName<E>, options?: DateStrategyOptions | undefined): string[] {
        if (!options) options = { years: [new Date().getFullYear()] };
        return options.years.map(year => this.generateAllEntityKeys(prefix, entityName, year)).flat();
    }

    getKey<E extends Entity>(entityName: EntityName<E>, entity: E): string {
        return this.getEntityKeyWithoutPrefix(entityName, entity);
    }

}