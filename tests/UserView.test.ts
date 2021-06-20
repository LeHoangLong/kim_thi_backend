import { Permission } from "../src/model/Permission";
import { User } from "../src/model/User";
import { IUserRepository } from "../src/repository/IUserRepository";
import 'reflect-metadata';
import sinon from 'sinon';
import { expect } from 'chai';
import { TYPES } from '../src/types';
import { myContainer } from "../src/inversify.config";
import { UserView } from "../src/view/UserView";
import { JwtAuthenticator } from "../src/middleware/JwtAuthenticator";
import { CookieOptions } from "express";
import bcrypt from 'bcrypt';

describe('User test', function() {
    var context: any = {};
    this.beforeEach(function() {
        context = {} as any;
        var fakeHasedPassword = bcrypt.hashSync("password", 10); 
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
            status: function(status: number){},
            cookie: function(name: string, value: string, option: CookieOptions){}
        }
        
        context.cookieSpy = sinon.spy(context.response, "cookie");
        context.statusSpy = sinon.spy(context.response, "status");
                
    });

    it("should be able to login", async function() {
        await context.view.loginView(context.request as any, context.response as any);
        sinon.assert.calledOnceWithExactly(context.cookieSpy, "jwt", "token", {
            maxAge: 1000
        });
        sinon.assert.calledOnceWithExactly(context.generateTokenSpy, "username");
        sinon.assert.calledOnceWithExactly(context.statusSpy, 200);
    });

    it('should reject if password is incorrect', async function() {
        context.request.body.password = 'password2';
        await context.view.loginView(context.request as any, context.response as any);
        sinon.assert.calledOnceWithExactly(context.statusSpy, 404);
    }) 
});