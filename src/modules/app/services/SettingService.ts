import { Observable, map } from "rxjs";
import { EntityName } from "../entities/entities";
import { SettingSchema, type Setting } from "../entities/Setting";
import { BaseService } from "./BaseService";

const defaultValues = {
    "calendar.firstMonth": "0",
    "calendar.firstDay": "0",
};

export type SettingKeys = keyof typeof defaultValues;
export class SettingService extends BaseService {


    async update(key: SettingKeys, value: string): Promise<boolean> {

        const repo = this.repository(EntityName.Setting);
        const entries = await repo.getAll({ where: { key } }) as Array<Setting>;
        if (entries.length > 0) {
            const entry = entries[0];
            if (entry.value === value) return true;
            entry.value = value;
            repo.save(entry);
        } else {
            repo.save(SettingSchema.parse({ key, value }));
        }
        return true;
    }

    observe(): Observable<Record<SettingKeys, string>> {
        const settingsRepo = this.repository(EntityName.Setting);
        return settingsRepo.observeAll().pipe(map(result => {
            const settingsData = result as Array<Setting>;
            return this.transform(settingsData);
        }));
    }

    private transform(settingsData: Array<Setting>): Record<SettingKeys, string> {
        return settingsData.reduce((acc, setting) => {
            acc[setting.key as SettingKeys] = setting.value;
            return acc;
        }, { ...defaultValues } as Record<SettingKeys, string>);
    }
}