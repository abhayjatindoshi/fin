/* eslint-disable @typescript-eslint/no-explicit-any */
import type { LogLevel } from "./ILogger";

export interface Log {
    level: LogLevel;
    tag: string;
    message?: string;
    args?: any;
    timestamp: Date;
}

export interface ILogHandler {
    handleLog(log: Log): void;
}