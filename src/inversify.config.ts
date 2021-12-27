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
import { EndUserProductView } from "./view/EndUserProductView";
import { EndUserProductCategoryView } from "./view/EndUserProductCategoryView";
import { EndUserGeocodingView } from "./view/EndUserGeocodingVIew";
import { EndUserGeocoderController } from "./controller/EndUserGeocoderController";
import { IGeocoderService } from "./services/IGeocoderService";
import { GoogleGeocoderService } from "./services/GoogleGeocoderService";
import { GeocoderController } from "./controller/GeocoderController";
import { EndUserTransportFeeController } from "./controller/EndUserTransportFeeController";
import { EndUserTransportFeeView } from "./view/EndUserTransportFeeView";
import { IOrderRepository } from "./repository/IOrderRepository";
import { OrderRepositoryPostgres } from "./repository/OrderRepositoryPostgres";
import { IAddressRepository } from "./repository/IAddressRepository";
import { AddressRepositoryPostgres } from "./repository/AddressRepositoryPostgres";
import { ICustomerContactRepository } from "./repository/ICustomerContactRepository";
import { CustomerContactRepositoryPostgres } from "./repository/CustomerContactRepositoryPostgres";
import { EndUserOrderView } from "./view/EndUserOrderView";
import { EndUserOrderController } from "./controller/EndUserOrderController";
import { EndUserAddressController } from "./controller/EndUserAddressController";
import { EndUserProductController } from "./controller/EndUserProductController";
import { IEmailService } from "./services/IEmailService";
import { EMailService } from "./services/EmailService";
import { AdminOrderView } from "./view/AdminOrderView";
import { AdminOrderController } from "./controller/AdminOrderController";
import { Storage } from "@google-cloud/storage";
import { BinaryRepositoryGCloudStorage } from "./repository/BinaryRepositoryGCloudStorage";
import { SendGridEmailService } from "./services/SendGridEmailService";
import { IPriceRequestRepository } from "./repository/iPriceRequestRepository";
import { PriceRequestRepositoryPostgres } from "./repository/PriceRequestRepositoryPostgres";
import { EndUserPriceRequestController } from "./controller/EndUserPriceRequestController";
import { EndUserPriceRequestView } from "./view/EndUserPriceRequestView";


export let myContainer = new Container();

export function resetContainer() {
    myContainer.unbindAll()
    myContainer.bind<Pool>(TYPES.POSTGRES_DRIVER).toConstantValue(new Pool(config.postgres));
    myContainer.bind<string>(TYPES.JWT_SECRECT_KEY).toConstantValue("38BggaT/EYOza5yIKeR13+9kgibw3K5UK/5AJjlAamoLo0IT/y3fX2Qcx18IS1e0zTMb556dtfac4bNV0EOuGsdXAQRRgiJueyanKW534X/VRZgSUggNeR4lEuz0q7iBbRjGLS7zm+hjU1MtoBbW70C2qX2cnFTRXuVwGHy2pQyYCo+stA9+ZJiacryZarT4yf/kUr6hJ+/WAJTMHHRcBWOLr6vedZQ7EmVfJA==");
    myContainer.bind<UserView>(TYPES.USER_VIEW).to(UserView);
    myContainer.bind<UserController>(TYPES.USER_CONTROLLER).to(UserController);
    myContainer.bind<IUserRepository>(TYPES.USER_REPOSITORY).to(UserRepositoryPostgres);
    myContainer.bind<number>(TYPES.JWT_DURATION_S).toConstantValue(24 * 3600 * 30 * 1000);
    myContainer.bind<JwtAuthenticator>(TYPES.JWT_AUTHENTICATOR).to(JwtAuthenticator);
    myContainer.bind<UserAuthorizer>(TYPES.USER_AUTHORIZER).to(UserAuthorizer);
    myContainer.bind<IProductRepository>(TYPES.PRODUCT_REPOSITORY).to(ProductRepositoryPostgres);
    myContainer.bind<IProductPriceRepository>(TYPES.PRODUCT_PRICE_REPOSITORY).to(PriceRepositoryPostgres);
    myContainer.bind<IImageRepository>(TYPES.IMAGE_REPOSITORY).to(ImageRepositoryPostgres)
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
    myContainer.bind<GeocoderController>(TYPES.GEOCODER_CONTROLLER).to(GeocoderController)
    myContainer.bind<EndUserProductView>(TYPES.END_USER_PRODUCT_VIEW).to(EndUserProductView)
    myContainer.bind<EndUserProductCategoryView>(TYPES.END_USER_PRODUCT_CATEGORY_VIEW).to(EndUserProductCategoryView)

    myContainer.bind<EndUserGeocodingView>(TYPES.END_USER_GEOCODER_VIEW).to(EndUserGeocodingView)
    myContainer.bind<EndUserGeocoderController>(TYPES.END_USER_GEOCODER_CONTROLLER).to(EndUserGeocoderController)
    myContainer.bind<IGeocoderService>(TYPES.GEOCODER_SERVICE).to(GoogleGeocoderService)
    myContainer.bind<any>(TYPES.GOOGLE_GEOCODER_OPTION).toConstantValue({
        apiKey: 'AIzaSyAPW61kcHMbEsIZaiBcfL3qyfhcRurm6bk',
        language: 'vi'
    })
    myContainer.bind<string>(TYPES.GOOGLE_GEOCODER_API_KEY).toConstantValue('AIzaSyAPW61kcHMbEsIZaiBcfL3qyfhcRurm6bk')

    myContainer.bind<EndUserTransportFeeController>(TYPES.END_USER_TRANSPORT_FEE_CONTROLLER).to(EndUserTransportFeeController)
    myContainer.bind<EndUserTransportFeeView>(TYPES.END_USER_TRANSPORT_FEE_VIEW).to(EndUserTransportFeeView)

    myContainer.bind<IOrderRepository>(TYPES.ORDER_REPOSITORY).to(OrderRepositoryPostgres)
    myContainer.bind<IAddressRepository>(TYPES.ADDRESS_REPOSITORY).to(AddressRepositoryPostgres)
    myContainer.bind<ICustomerContactRepository>(TYPES.CUSTOMER_CONTACT_REPOSITORY).to(CustomerContactRepositoryPostgres)

    myContainer.bind<EndUserOrderView>(TYPES.END_USER_ORDER_VIEW).to(EndUserOrderView)
    myContainer.bind<EndUserOrderController>(TYPES.END_USER_ORDER_CONTROLLER).to(EndUserOrderController)
    myContainer.bind<EndUserAddressController>(TYPES.END_USER_ADDRESS_CONTROLLER).to(EndUserAddressController)
    myContainer.bind<EndUserProductController>(TYPES.END_USER_PRODUCT_CONTROLLER).to(EndUserProductController)

    myContainer.bind<AdminOrderController>(TYPES.ADMIN_ORDER_CONTROLLER).to(AdminOrderController)
    myContainer.bind<AdminOrderView>(TYPES.ADMIN_ORDER_VIEW).to(AdminOrderView)

    myContainer.bind<string>(TYPES.GOOGLE_CLOUD_STORAGE_BUCKET_NAME).toConstantValue('kim-thi')
    myContainer.bind<Storage>(TYPES.GOOGLE_CLOUD_STORAGE).toConstantValue(new Storage())

    if (process.env.GCLOUD !== undefined) {
        myContainer.bind<IBinaryRepository>(TYPES.BINARY_REPOSITORY).to(BinaryRepositoryGCloudStorage)
    } else {
        myContainer.bind<IBinaryRepository>(TYPES.BINARY_REPOSITORY).to(BinaryRepositoryFileSystem)
    }

    myContainer.bind<string>(TYPES.SEND_GRID_API_KEY).toConstantValue(process.env.SENDGRID_API_KEY!)
    myContainer.bind<string>(TYPES.SEND_GRID_SENDER_EMAIL).toConstantValue('erenjeager212121@gmail.com')
    
    myContainer.bind<IEmailService>(TYPES.EMAIL_SERVICE).to(SendGridEmailService);
    if (process.env.GCLOUD !== undefined) {
        myContainer.bind<string>(TYPES.ADMIN_EMAIL).toConstantValue('lecong364@gmail.com')
    } else {
        myContainer.bind<string>(TYPES.ADMIN_EMAIL).toConstantValue('le.hoang.long@outlook.com')
    }

    myContainer.bind<IPriceRequestRepository>(TYPES.PRICE_REQUEST_REPOSITORY).to(PriceRequestRepositoryPostgres)

    myContainer.bind<EndUserPriceRequestController>(TYPES.END_USER_PRICE_REQUEST_CONTROLLER).to(EndUserPriceRequestController)
    myContainer.bind<EndUserPriceRequestView>(TYPES.END_USER_PRICE_REQUEST_VIEW).to(EndUserPriceRequestView)
}

resetContainer()
export default myContainer