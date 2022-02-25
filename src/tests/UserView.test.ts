import { Permission } from "../model/Permission";
import { User } from "../model/User";
import { IUserRepository } from "../repository/IUserRepository";
import 'reflect-metadata';
import sinon from 'sinon';
import { TYPES } from '../types';
import { myContainer } from "../inversify.config";
import { UserView } from "../view/UserView";
import { JwtAuthenticator } from "../middleware/JwtAuthenticator";
import { CookieOptions } from "express";
import bcrypt from 'bcrypt';

describe('User test', function() {
    let context: any = {};
    this.beforeEach(function() {
        context = {} as any;
        let fakeHasedPassword = bcrypt.hashSync("password", 10); 
        const fakeUserDriver: IUserRepository = {
            async createUser(username: string, password: string, permissions: Permission[]): Promise<User> {
                password = bcrypt.hashSync(password, 10); 
                return new User(
                        0,
                        username,
                        password,
                        false,
                        false,
                        permissions
                    );
                },
            async fetchUserByUsername(username: string) : Promise<User> {
                return new User(
                    0,
                    username,
                    fakeHasedPassword,
                    false,
                    false,
                    [Permission.ADMIN]
                );
            },
        }
                
        const jwtAuthenticator = {
            generateToken(username: string) {
                return "token";
            },
            durationS: 1000
        }
        context.generateTokenSpy = sinon.spy(jwtAuthenticator, "generateToken");
        myContainer.rebind<JwtAuthenticator>(TYPES.JWT_AUTHENTICATOR).toConstantValue(jwtAuthenticator as any);
        myContainer.rebind<IUserRepository>(TYPES.USER_REPOSITORY).toConstantValue(fakeUserDriver);
        context.view = myContainer.get<UserView>(TYPES.USER_VIEW);
        context.request = {
            body: {
                username: 'username',
                password: 'password'
            }
        }
        context.response = {
            status(status: number){ return this },
            cookie(name: string, value: string, option: CookieOptions){ return this },
            send() {},
        }
        
        context.cookieSpy = sinon.spy(context.response, "cookie");
        context.statusSpy = sinon.spy(context.response, "status");
        context.sendSpy = sinon.spy(context.response, "send")
                
    });

    it("should be able to login", async function() {
        await context.view.loginView(context.request as any, context.response as any);
        sinon.assert.calledOnceWithExactly(context.cookieSpy, "jwt", "token", {
            maxAge: 1000
        });
        sinon.assert.calledOnceWithExactly(context.generateTokenSpy, "username");
        sinon.assert.calledOnceWithExactly(context.statusSpy, 200);
        sinon.assert.calledOnce(context.sendSpy)
    });

    it('should reject if password is incorrect', async function() {
        context.request.body.password = 'password2';
        await context.view.loginView(context.request as any, context.response as any);
        sinon.assert.calledOnceWithExactly(context.statusSpy, 404);
        sinon.assert.calledOnce(context.sendSpy)
    }) 
});