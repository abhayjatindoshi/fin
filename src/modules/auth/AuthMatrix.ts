import { Google } from "./handlers/google/Google";
import { AuthFeatureNames, type IAuthFeatureHandler, type IAuthFeatureName } from "./interfaces/features/IAuthFeatureHandler";
import type { IAuthDisplay } from "./interfaces/IAuth";

export class AuthMatrix {
    public static FeatureHandlers: Record<IAuthFeatureName, Record<string, IAuthFeatureHandler>> = AuthMatrix.arrayToRecord(AuthFeatureNames);
    public static Handlers: Record<string, IAuthFeatureHandler> = {};
    public static HandlerDisplay: Record<string, IAuthDisplay> = {};

    static {
        const auths = [
            new Google(),
        ];

        auths.forEach(auth => {
            auth.features.forEach(feature => {
                const handler = feature.handler;
                handler.id = `${auth.id}-${feature.id}`;
                const featureName = handler.featureName;
                AuthMatrix.FeatureHandlers[featureName][handler.id] = handler;

                const display = { ...auth.display, ...feature.display };
                AuthMatrix.HandlerDisplay[handler.id] = display;
                AuthMatrix.Handlers[handler.id] = handler;
            });
        });
    }

    private static arrayToRecord<T extends string, V>(arr: ReadonlyArray<T>): Record<T, Record<string, V>> {
        return arr.reduce((o, item) => {
            o[item] = {};
            return o;
        }, {} as Record<T, Record<string, V>>);
    }
}