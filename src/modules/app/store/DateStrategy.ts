import type { EntityNameOf, EntityTypeOf } from "@/modules/data-sync/interfaces/types";
import { EntityKeyDateStrategy } from "@/modules/data-sync/strategies/EntityKeyDateStrategy";
import { EntityConfig, util } from "../entities/entities";
import type { EntityConfigDefinition } from "../entities/types";

export class DateStrategy extends EntityKeyDateStrategy<typeof util> {

    separator = '.';
    identifierLength = 8;

    generateKeyForYear<N extends EntityNameOf<typeof util>>(entityName: N, entity: EntityTypeOf<typeof util, N>): string {
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

    generateAllKeysForYear<N extends EntityNameOf<typeof util>>(entityName: N, year: number): string[] {
        const entityConfig = this.getConfig(entityName);
        switch (entityConfig.scope) {
            case 'global':
                return [`global`];
            case 'yearly':
                return [`${year}`];
            case 'monthly': {
                const keys: string[] = [];
                for (let month = 1; month <= 12; month++) {
                    keys.push(`${year}${this.separator}${month.toString().padStart(2, '0')}`);
                }
                return keys;
            }
            default:
                throw new Error(`Unsupported entity scope: ${entityConfig}`);
        }
    }

    private getConfig<N extends EntityNameOf<typeof util>>(entityName: N): EntityConfigDefinition<typeof util, N> {
        const entityConfig = EntityConfig[entityName as keyof typeof EntityConfig] as EntityConfigDefinition<typeof util, N>;
        if (!entityConfig) throw new Error(`No entity config found for entity name: ${entityName as string}`);
        return entityConfig;
    }

}