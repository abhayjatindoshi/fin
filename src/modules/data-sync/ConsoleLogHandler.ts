/* eslint-disable @typescript-eslint/no-explicit-any */
import type { LogLevel } from "./interfaces/ILogger";
import type { ILogHandler, Log } from "./interfaces/ILogHandler";

export class ConsoleLogHandler implements ILogHandler {
    handleLog(log: Log): void {
        const logFun = this.getLogFunction(log.level);
        let message = `[${log.level}] [${log.timestamp.toISOString()}] ${log.tag}`;
        if (log.message) {
            message += `: ${log.message}`;
        }

        if (log.args) {
            if (Array.isArray(log.args)) {
                logFun(message, ...log.args);
            } else {
                logFun(message, log.args);
            }
        } else {
            logFun(message);
        }
    }

    private getLogFunction(level: LogLevel): (...data: any[]) => void {
        switch (level) {
            case 'VERBOSE':
            case 'DEBUG':
                return console.debug;
            case 'INFO':
                return console.debug;
            case 'WARN':
                return console.warn;
            case 'ERROR':
                return console.error;
        }
    }
}