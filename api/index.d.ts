export {};

declare global {
  declare namespace Express {
    export interface Request {
      uid: string;
      headers: {
        authorization: string;
      };
    }
  }
}
