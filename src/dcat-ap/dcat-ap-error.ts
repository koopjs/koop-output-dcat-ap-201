export class DcatApError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.name = 'DcatApError';
        this.statusCode = statusCode;
    }
}