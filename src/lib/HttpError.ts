export class HttpError extends Error {
  public httpCode: number;

  constructor(message: string, httpCode: number) {
    super(message);
    console.log(message);
    this.name = "HttpError";
    this.httpCode = httpCode;

    Object.setPrototypeOf(this, HttpError.prototype);
  }
}
