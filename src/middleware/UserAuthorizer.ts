import express from 'express';
import { injectable } from 'inversify';

@injectable()
export class UserAuthorizer {
    authorize(request: express.Request, response: express.Response, next: express.NextFunction) {
        if (!request.context || request.context.user === undefined) {
            return response.status(401).send();
        } else {
            next();
        }
    }
}