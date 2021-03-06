import "reflect-metadata";
import { Pool } from 'pg';
import { TYPES } from './types';
import { Container } from 'inversify';
const config = require('./config').config;
import { UserRepositoryPostgres } from "./repository/UserRepositoryPostgres";
import { UserController } from "./controller/UserController";
import { JwtAuthenticator } from "./middleware/JwtAuthenticator";
import { IUserRepository } from "./repository/IUserRepository";
import { UserView } from "./view/UserView";
import { UserAuthorizer } from "./middleware/UserAuthorizer";
import { IProductRepository } from "./repository/IProductRepository";
import { ProductRepositoryPostgres } from "./repository/ProductRepositoryPostgres";
import { IProductPriceRepository } from "./repository/IPriceRepository";
import { PriceRepositoryPostgres } from "./repository/PriceRepositoryPostgres";
import { IImageRepository } from "./repository/IImageRepository";
import { ImageRepositoryPostgres } from "./repository/ImageRepositoryPostgres";
import { IBinaryRepository } from "./repository/IBinaryRepository";
import { BinaryRepositoryFileSystem } from "./repository/BinaryRepositoryFilesystem";
import { ProductController } from "./controller/ProductController";
import { ProductImageController } from "./controller/ImageController";
import { ProductView } from "./view/ProductView";
import { AdminAuthorizer } from "./middleware/AdminAuthorizer";
import { ImageView } from "./view/ImageView";
import { IConnectionFactory } from "./services/IConnectionFactory";
import { PostgresConnectionFactory } from "./services/PostgresConnectionFactory";
import { IProductCategoryRepository } from "./repository/IProductCategoryRepository";
import { ProductCategoryRepositoryPostgres } from "./repository/ProductCategoryRepositoryPostgres";
import { ProductCategoryController } from "./controller/ProductCategoryController";
import { ProductCategoryView } from "./view/ProductCategoryView";
import { AreaTransportFeeRepositoryPostgres } from "./repository/AreaTransportFeeRepositoryPostgres";
import { IAreaTransportFeeRepository } from "./repository/IAreaTransportFeeRepository";
import { TransportFeeController } from "./controller/TransportFeeController";
import { TransportFeeView } from "./view/TransportFeeView";
import node_geocoder, { Geocoder } from "node-geocoder";


export const myContainer = new Container();

myContainer.bind<Pool>(TYPES.POSTGRES_DRIVER).toConstantValue(new Pool(config.postgres));
myContainer.bind<string>(TYPES.JWT_SECRECT_KEY).toConstantValue("38BggaT/EYOza5yIKeR13+9kgibw3K5UK/5AJjlAamoLo0IT/y3fX2Qcx18IS1e0zTMb556dtfac4bNV0EOuGsdXAQRRgiJueyanKW534X/VRZgSUggNeR4lEuz0q7iBbRjGLS7zm+hjU1MtoBbW70C2qX2cnFTRXuVwGHy2pQyYCo+stA9+ZJiacryZarT4yf/kUr6hJ+/WAJTMHHRcBWOLr6vedZQ7EmVfJA==");
myContainer.bind<UserView>(TYPES.USER_VIEW).to(UserView);
myContainer.bind<UserController>(TYPES.USER_CONTROLLER).to(UserController);
myContainer.bind<IUserRepository>(TYPES.USER_REPOSITORY).to(UserRepositoryPostgres);
myContainer.bind<number>(TYPES.JWT_DURATION_S).toConstantValue(24 * 3600 * 30);
myContainer.bind<JwtAuthenticator>(TYPES.JWT_AUTHENTICATOR).to(JwtAuthenticator);
myContainer.bind<UserAuthorizer>(TYPES.USER_AUTHORIZER).to(UserAuthorizer);
myContainer.bind<IProductRepository>(TYPES.PRODUCT_REPOSITORY).to(ProductRepositoryPostgres);
myContainer.bind<IProductPriceRepository>(TYPES.PRODUCT_PRICE_REPOSITORY).to(PriceRepositoryPostgres);
myContainer.bind<IImageRepository>(TYPES.IMAGE_REPOSITORY).to(ImageRepositoryPostgres)
myContainer.bind<IBinaryRepository>(TYPES.BINARY_REPOSITORY).to(BinaryRepositoryFileSystem)
myContainer.bind<ProductController>(TYPES.PRODUCT_CONTROLLER).to(ProductController)
myContainer.bind<ProductImageController>(TYPES.PRODUCT_IMAGE_CONTROLLER).to(ProductImageController)
myContainer.bind<ProductView>(TYPES.PRODUCT_VIEW).to(ProductView)
myContainer.bind<AdminAuthorizer>(TYPES.ADMIN_AUTHORIZER).to(AdminAuthorizer)
myContainer.bind<ImageView>(TYPES.IMAGE_VIEW).to(ImageView)
myContainer.bind<IConnectionFactory>(TYPES.CONNECTION_FACTORY).toConstantValue(new PostgresConnectionFactory(myContainer.get<Pool>(TYPES.POSTGRES_DRIVER)))
myContainer.bind<IProductCategoryRepository>(TYPES.PRODUCT_CATEGORY_REPOSITORY).to(ProductCategoryRepositoryPostgres)
myContainer.bind<ProductCategoryController>(TYPES.PRODUCT_CATEGORY_CONTROLLER).to(ProductCategoryController)
myContainer.bind<ProductCategoryView>(TYPES.PRODUCT_CATEGORY_VIEW).to(ProductCategoryView)
myContainer.bind<IAreaTransportFeeRepository>(TYPES.AREA_TRANSPORT_FEE_REPOSITORY).to(AreaTransportFeeRepositoryPostgres)
myContainer.bind<TransportFeeController>(TYPES.TRANSPORT_FEE_CONTROLLER).to(TransportFeeController)
myContainer.bind<TransportFeeView>(TYPES.TRANSPORT_FEE_VIEW).to(TransportFeeView)
myContainer.bind<Geocoder>(TYPES.GOOGLE_GEOCODER).toConstantValue(node_geocoder(config.geocoder))

export default myContainer