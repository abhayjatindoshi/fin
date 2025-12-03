/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ILogger, LogLevel } from "./interfaces/ILogger";
import type { ILogHandler, Log } from "./interfaces/ILogHandler";

export class Logger implements ILogger {

    private logHandler: ILogHandler;

    constructor(logHandler: ILogHandler) {
        this.logHandler = logHandler;
    }

    v(tag: string, message?: string, args?: any): void {
        this.log('VERBOSE', tag, message, args);
    }
    d(tag: string, message?: string, args?: any): void {
        this.log('DEBUG', tag, message, args);
    }
    i(tag: string, message?: string, args?: any): void {
        this.log('INFO', tag, message, args);
    }
    w(tag: string, message?: string, args?: any): void {
        this.log('WARN', tag, message, args);
    }
    e(tag: string, message?: string, args?: any): void {
        this.log('ERROR', tag, message, args);
    }

    private log(level: LogLevel, tag: string, message?: string, args?: any): void {
        const log: Log = {
            level,
            tag,
            message,
            args,
            timestamp: new Date(),
        };
        this.logHandler.handleLog(log);
    }
}