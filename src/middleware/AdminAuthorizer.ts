import express from 'express';
import { injectable } from 'inversify';
import { Permission } from '../model/Permission';
import { User } from '../model/User';

@injectable()
export class AdminAuthorizer {
    authorize(request: express.Request, response: express.Response, next: express.NextFunction) {
        if (!request.context || 
            request.context.user === undefined || 
            !(request.context.user as User).permissions.includes(Permission.ADMIN)
        ) {
            return response.status(401).send();
        } else {
            next();
        }
    }
}