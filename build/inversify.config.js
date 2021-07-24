"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.myContainer = void 0;
require("reflect-metadata");
const pg_1 = require("pg");
const types_1 = require("./types");
const inversify_1 = require("inversify");
const config_1 = __importDefault(require("./config"));
const UserRepositoryPostgres_1 = require("./repository/UserRepositoryPostgres");
const UserController_1 = require("./controller/UserController");
const JwtAuthenticator_1 = require("./middleware/JwtAuthenticator");
const UserView_1 = require("./view/UserView");
const UserAuthorizer_1 = require("./middleware/UserAuthorizer");
const ProductRepositoryPostgres_1 = require("./repository/ProductRepositoryPostgres");
const PriceRepositoryPostgres_1 = require("./repository/PriceRepositoryPostgres");
const ImageRepositoryPostgres_1 = require("./repository/ImageRepositoryPostgres");
const BinaryRepositoryFilesystem_1 = require("./repository/BinaryRepositoryFilesystem");
const ProductController_1 = require("./controller/ProductController");
const ImageController_1 = require("./controller/ImageController");
const ProductView_1 = require("./view/ProductView");
const AdminAuthorizer_1 = require("./middleware/AdminAuthorizer");
const ImageView_1 = require("./view/ImageView");
const PostgresConnectionFactory_1 = require("./services/PostgresConnectionFactory");
const ProductCategoryRepositoryPostgres_1 = require("./repository/ProductCategoryRepositoryPostgres");
exports.myContainer = new inversify_1.Container();
exports.myContainer.bind(types_1.TYPES.POSTGRES_DRIVER).toConstantValue(new pg_1.Pool(config_1.default.postgres));
exports.myContainer.bind(types_1.TYPES.JWT_SECRECT_KEY).toConstantValue("38BggaT/EYOza5yIKeR13+9kgibw3K5UK/5AJjlAamoLo0IT/y3fX2Qcx18IS1e0zTMb556dtfac4bNV0EOuGsdXAQRRgiJueyanKW534X/VRZgSUggNeR4lEuz0q7iBbRjGLS7zm+hjU1MtoBbW70C2qX2cnFTRXuVwGHy2pQyYCo+stA9+ZJiacryZarT4yf/kUr6hJ+/WAJTMHHRcBWOLr6vedZQ7EmVfJA==");
exports.myContainer.bind(types_1.TYPES.USER_VIEW).to(UserView_1.UserView);
exports.myContainer.bind(types_1.TYPES.USER_CONTROLLER).to(UserController_1.UserController);
exports.myContainer.bind(types_1.TYPES.USER_REPOSITORY).to(UserRepositoryPostgres_1.UserRepositoryPostgres);
exports.myContainer.bind(types_1.TYPES.JWT_DURATION_S).toConstantValue(24 * 3600 * 30);
exports.myContainer.bind(types_1.TYPES.JWT_AUTHENTICATOR).to(JwtAuthenticator_1.JwtAuthenticator);
exports.myContainer.bind(types_1.TYPES.USER_AUTHORIZER).to(UserAuthorizer_1.UserAuthorizer);
exports.myContainer.bind(types_1.TYPES.PRODUCT_REPOSITORY).to(ProductRepositoryPostgres_1.ProductRepositoryPostgres);
exports.myContainer.bind(types_1.TYPES.PRODUCT_PRICE_REPOSITORY).to(PriceRepositoryPostgres_1.PriceRepositoryPostgres);
exports.myContainer.bind(types_1.TYPES.IMAGE_REPOSITORY).to(ImageRepositoryPostgres_1.ImageRepositoryPostgres);
exports.myContainer.bind(types_1.TYPES.BINARY_REPOSITORY).to(BinaryRepositoryFilesystem_1.BinaryRepositoryFileSystem);
exports.myContainer.bind(types_1.TYPES.PRODUCT_CONTROLLER).to(ProductController_1.ProductController);
exports.myContainer.bind(types_1.TYPES.PRODUCT_IMAGE_CONTROLLER).to(ImageController_1.ProductImageController);
exports.myContainer.bind(types_1.TYPES.PRODUCT_VIEW).to(ProductView_1.ProductView);
exports.myContainer.bind(types_1.TYPES.ADMIN_AUTHORIZER).to(AdminAuthorizer_1.AdminAuthorizer);
exports.myContainer.bind(types_1.TYPES.IMAGE_VIEW).to(ImageView_1.ImageView);
exports.myContainer.bind(types_1.TYPES.CONNECTION_FACTORY).toConstantValue(new PostgresConnectionFactory_1.PostgresConnectionFactory(exports.myContainer.get(types_1.TYPES.POSTGRES_DRIVER)));
exports.myContainer.bind(types_1.TYPES.PRODUCT_CATEGORY_REPOSITORY).to(ProductCategoryRepositoryPostgres_1.ProductCategoryRepositoryPostgres);
exports.default = exports.myContainer;