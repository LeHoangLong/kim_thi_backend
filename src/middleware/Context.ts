import express from 'express';
import config from '../config';

declare global {
    export namespace Express {
      export interface Request {
        context: any
      }
    }
}

//must be at the front of middleware chain
export function generateContext(request: express.Request, response: express.Response, next: express.NextFunction) {
    request.context = {};
    next();
}