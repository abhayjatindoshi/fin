import type { IPersistence } from "@/modules/data-sync/interfaces/IPersistence";
import type { Config } from "./types";

export interface ICloudService extends IPersistence {
    getConfig(): Promise<Config | null>;
    saveConfig(config: Config): Promise<void>;
}