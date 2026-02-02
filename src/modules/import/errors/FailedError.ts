export type FailureType = 'NO_SUPPORTED_ADAPTER' | 'UNSUPPORTED_FILE_TYPE'

export class FailedError extends Error {
    type: FailureType;

    constructor(type: FailureType, message: string) {
        super(message);
        this.type = type;
    }
}