import type { LogLevel } from "@/modules/data-sync/interfaces/ILogger";
import type { ILogHandler, Log } from "@/modules/data-sync/interfaces/ILogHandler";
import { BehaviorSubject, Observable, Subscription } from "rxjs";

type WindowWithLogs = Window & {
    enableLogs?: () => void,
    disableLogs?: () => void,
};

export class AppLogHandler implements ILogHandler {
    private static instance: AppLogHandler;
    public static getInstance(): AppLogHandler {
        if (!AppLogHandler.instance) {
            AppLogHandler.instance = new AppLogHandler();
            (window as WindowWithLogs)['enableLogs'] = AppLogHandler.instance.enableConsoleLogs.bind(AppLogHandler.instance);
            (window as WindowWithLogs)['disableLogs'] = AppLogHandler.instance.disableConsoleLogs.bind(AppLogHandler.instance);
        }
        return AppLogHandler.instance;
    }

    private constructor() { }
    private logStreamSubject = new BehaviorSubject<Log | null>(null);
    private consoleLogsSubscription: Subscription | null = null;

    handleLog(log: Log): void {
        this.logStreamSubject.next(log);
    }

    get stream() {
        return new Observable<Log>(subscriber => {
            const subscription = this.logStreamSubject.subscribe(log => {
                if (log) subscriber.next(log);
            });
            return () => subscription.unsubscribe();
        });
    }

    private enableConsoleLogs() {
        this.consoleLogsSubscription = this.stream.subscribe(log => {
            const logFun = this.getLogFunction(log.level);
            let message = `[${log.level}] [${log.timestamp.toISOString()}] ${log.tag}`;
            if (log.message) {
                message += `: ${log.message}`;
            }
            logFun(message);
        });
    }

    private disableConsoleLogs() {
        this.consoleLogsSubscription?.unsubscribe();
        this.consoleLogsSubscription = null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private getLogFunction(level: LogLevel): (...data: any[]) => void {
        switch (level) {
            case 'VERBOSE':
            case 'DEBUG':
                return console.debug;
            case 'INFO':
                return console.info;
            case 'WARN':
                return console.warn;
            case 'ERROR':
                return console.error;
        }
    }
}