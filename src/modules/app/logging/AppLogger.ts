/* eslint-disable @typescript-eslint/no-explicit-any */
import { Logger } from "@/modules/data-sync/Logger";
import { AppLogHandler } from "./AppLogHandler";

export class AppLogger extends Logger {
    private static instance: AppLogger;
    public static getInstance(): AppLogger {
        if (!AppLogger.instance) {
            AppLogger.instance = new AppLogger(AppLogHandler.getInstance());
        }
        return AppLogger.instance;
    }

    public static tagged(tag: string): TaggedAppLogger {
        return new TaggedAppLogger(tag);
    }

    private constructor(logHandler: AppLogHandler) {
        super(logHandler);
    }

    static v = (tag: string, message?: string, args?: any) => AppLogger.getInstance().v(tag, message, args);
    static d = (tag: string, message?: string, args?: any) => AppLogger.getInstance().d(tag, message, args);
    static i = (tag: string, message?: string, args?: any) => AppLogger.getInstance().i(tag, message, args);
    static w = (tag: string, message?: string, args?: any) => AppLogger.getInstance().w(tag, message, args);
    static e = (tag: string, message?: string, args?: any) => AppLogger.getInstance().e(tag, message, args);
}

class TaggedAppLogger {
    private tag: string;

    constructor(tag: string) {
        this.tag = tag;
    }

    v = (message?: any, ...args: any[]) => AppLogger.v(this.tag, message, args);
    d = (message?: any, ...args: any[]) => AppLogger.d(this.tag, message, args);
    i = (message?: any, ...args: any[]) => AppLogger.i(this.tag, message, args);
    w = (message?: any, ...args: any[]) => AppLogger.w(this.tag, message, args);
    e = (message?: any, ...args: any[]) => AppLogger.e(this.tag, message, args);
}