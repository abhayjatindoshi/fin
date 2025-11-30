import { DataOrchestrator } from "@/modules/data-sync/DataOrchestrator";
import type { DataRepository } from "@/modules/data-sync/DataRepository";
import type { EntityNameOf } from "@/modules/data-sync/interfaces/types";
import type { DateStrategyOptions } from "@/modules/data-sync/strategies/EntityKeyDateStrategy";
import type { Household } from "../entities/Household";
import type { util } from "../entities/entities";

export abstract class BaseService {
    public repository<N extends EntityNameOf<typeof util>>(entityName: N): DataRepository<typeof util, N, DateStrategyOptions, Household> {
        return DataOrchestrator.getInstance<typeof util, DateStrategyOptions, Household>().repo<N>(entityName);
    }
}