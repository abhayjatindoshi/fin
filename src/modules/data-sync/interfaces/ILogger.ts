/* eslint-disable @typescript-eslint/no-explicit-any */

export type LogLevel = 'VERBOSE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface ILogger {
    v(tag: string, message?: string, args?: any): void;
    d(tag: string, message?: string, args?: any): void;
    i(tag: string, message?: string, args?: any): void;
    w(tag: string, message?: string, args?: any): void;
    e(tag: string, message?: string, args?: any): void;
}