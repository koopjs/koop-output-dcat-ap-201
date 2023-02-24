const CUSTOM_ERROR_NAME = 'DcatApError';
export class DcatApError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.name = CUSTOM_ERROR_NAME;
        this.statusCode = statusCode;
    }
}