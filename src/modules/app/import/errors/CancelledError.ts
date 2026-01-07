export class CancelledError extends Error {
    constructor(message: string = "The import process was cancelled.") {
        super(message);
        this.name = "CancelledError";
    }
}