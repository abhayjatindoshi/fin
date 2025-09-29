import type { Entity } from "@/modules/data-sync/interfaces/Entity";
import type { EntityName } from "@/modules/data-sync/interfaces/types";
import { EntityKeyDateStrategy } from "@/modules/data-sync/strategies/EntityKeyDateStrategy";
import type { EntityConfigDefinition } from "../entities/types";
import { EntityConfig } from "../entities/entities";

export class DateStrategy extends EntityKeyDateStrategy {
    separator = '.';
    identifierLength = 8;

    getEntityKeyWithoutPrefix<E extends Entity>(entityName: EntityName<E>, entity: E): string {
        const entityConfig = this.getConfig(entityName);
        switch (entityConfig.scope) {
            case 'global':
                return 'global';
            case 'yearly': {
                const date = entityConfig.getKeyDate(entity);
                return `${date.getFullYear()}`;
            }
            case 'monthly': {
                const date = entityConfig.getKeyDate(entity);
                return `${date.getFullYear()}${this.separator}${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            }
            default:
                throw new Error(`Unsupported entity scope: ${entityConfig}`);
        }
    }

    generateAllEntityKeys<E extends Entity>(prefix: string, entityName: EntityName<E>, year: number): string[] {
        const entityConfig = this.getConfig(entityName);
        switch (entityConfig.scope) {
            case 'global':
                return [`${prefix}${this.separator}global`];
            case 'yearly':
                return [`${prefix}${this.separator}${year}`];
            case 'monthly': {
                const keys: string[] = [];
                for (let month = 1; month <= 12; month++) {
                    keys.push(`${prefix}${this.separator}${year}${this.separator}${month.toString().padStart(2, '0')}`);
                }
                return keys;
            }
            default:
                throw new Error(`Unsupported entity scope: ${entityConfig}`);
        }
    }

    private getConfig<E extends Entity>(entityName: EntityName<E>): EntityConfigDefinition<E> {
        const entityConfig = EntityConfig[entityName as keyof typeof EntityConfig] as EntityConfigDefinition<E>;
        if (!entityConfig) throw new Error(`No entity config found for entity name: ${entityName as string}`);
        return entityConfig;
    }

}