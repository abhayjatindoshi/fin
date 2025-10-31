import { Utils } from "@/modules/common/Utils";

export class EntityUtils {
    public static hashTransaction(date: Date, amount: number, description: string): number {
        const str = `${date.toISOString()}|${amount}|${description}`;
        return Utils.generateHash(str);
    }
}