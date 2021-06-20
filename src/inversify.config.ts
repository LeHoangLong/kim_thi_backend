import "reflect-metadata";
import { Pool } from 'pg';
import { TYPES } from './types';
import { Container } from 'inversify';
import config from '../config.json';
import { UserRepositoryPostgres } from "./repository/UserRepositoryPostgres";
import { UserController } from "./controller/UserController";
import { JwtAuthenticator } from "./middleware/JwtAuthenticator";
import { IUserRepository } from "./repository/IUserRepository";
import { UserView } from "./view/UserView";
import { UserAuthorizer } from "./middleware/UserAuthorizer";


export const myContainer = new Container();

myContainer.bind<Pool>(TYPES.POSTGRES_DRIVER).toConstantValue(new Pool(config.postgres));
myContainer.bind<string>(TYPES.JWT_SECRECT_KEY).toConstantValue("38BggaT/EYOza5yIKeR13+9kgibw3K5UK/5AJjlAamoLo0IT/y3fX2Qcx18IS1e0zTMb556dtfac4bNV0EOuGsdXAQRRgiJueyanKW534X/VRZgSUggNeR4lEuz0q7iBbRjGLS7zm+hjU1MtoBbW70C2qX2cnFTRXuVwGHy2pQyYCo+stA9+ZJiacryZarT4yf/kUr6hJ+/WAJTMHHRcBWOLr6vedZQ7EmVfJA==");
myContainer.bind<UserView>(TYPES.USER_VIEW).to(UserView);
myContainer.bind<UserController>(TYPES.USER_CONTROLLER).to(UserController);
myContainer.bind<IUserRepository>(TYPES.USER_REPOSITORY).to(UserRepositoryPostgres);
myContainer.bind<number>(TYPES.JWT_DURATION_S).toConstantValue(24 * 3600 * 30);
myContainer.bind<JwtAuthenticator>(TYPES.JWT_AUTHENTICATOR).to(JwtAuthenticator);
myContainer.bind<UserAuthorizer>(TYPES.USER_AUTHORIZER).to(UserAuthorizer);