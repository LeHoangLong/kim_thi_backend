import 'reflect-metadata';
import { inject, injectable } from "inversify";
import { TYPES } from '../types';
import { UserController } from '../controller/UserController';
import express, { CookieOptions } from 'express';

@injectable()
export class UserView {
    constructor(
        @inject(TYPES.USER_CONTROLLER) private controller : UserController
    ) {}

    async loginView(request: express.Request, response: express.Response) {
        let username = request.body.username;
        let password = request.body.password;

        var ret = await this.controller.logIn(username, password);
        if (ret === null) {
            return response.status(404).send();
        } else {
            var [jwt, maxAge] = ret;
            let option: CookieOptions = {
                maxAge: maxAge,
            };
            response.cookie("jwt", jwt, option);
            return response.status(200).send();
        }
    }

    async getUserView(request: express.Request, response: express.Response) {
        // If a request reaches here, the request must have already been authenticated
        // and a user must be set in context
        return response.status(200).send({
            'username': request.context.user.username
        });
    }
}