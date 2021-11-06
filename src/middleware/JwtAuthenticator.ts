import jwt, { TokenExpiredError } from 'jsonwebtoken';
import express from 'express';
import * as Request from './Context'; //not used but import here to show that we have dependency on this module (to extend express request object)
import { inject, injectable } from 'inversify';
import { TYPES } from '../types';
import { IUserRepository } from '../repository/IUserRepository';
import { NotFound } from '../exception/NotFound';

@injectable()
export class JwtAuthenticator {
    readonly secretKey: string;
    readonly durationS: number;
    private driver: IUserRepository;

    constructor(
        @inject(TYPES.USER_REPOSITORY) driver: IUserRepository,
        @inject(TYPES.JWT_SECRECT_KEY) secretKey: string,
        @inject(TYPES.JWT_DURATION_S) durationS: number
    ) {
        this.secretKey = secretKey;
        this.durationS = durationS;
        this.driver = driver;
    }

    generateToken(username: string) {
        return jwt.sign({username: username}, this.secretKey, {
            expiresIn: this.durationS,
        });
    }

    async authenticate(request: express.Request, response: express.Response, next: express.NextFunction) {
        try {
            if (request.cookies != undefined && request.cookies.jwt != undefined) {
                let payload: any = jwt.verify(request.cookies.jwt, this.secretKey);
                if ('username' in payload) {
                    let username: string = payload.username;
                    try { 
                        var user = await this.driver.fetchUserByUsername(username);
                        request.context.user = user;
                        next();
                    } catch (error) {
                        if (error instanceof NotFound) {
                            return response.status(403).send();
                        } else {
                            return response.status(502).send(error);
                        }
                    }
                } else {
                    next();
                }
            } else {
                next();
            }
        } catch (error) {
            if (error instanceof TokenExpiredError) {
                return response.status(403).send();
            } else {
                response.status(502).send(error);
                throw error;
            }
        }
    }
}