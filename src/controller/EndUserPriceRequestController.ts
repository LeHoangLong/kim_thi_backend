import { inject, injectable } from "inversify";
import { PriceRequest } from "../model/PriceRequest";
import { EProductUnitToString } from "../model/ProductPrice";
import { CreatePriceRequestArgs, IPriceRequestRepository } from "../repository/iPriceRequestRepository";
import { IEmailService } from "../services/IEmailService";
import { TYPES } from "../types";
import { EndUserProductController, ProductAndPrice } from "./EndUserProductController";
import { ProductController } from "./ProductController";

@injectable()
export class EndUserPriceRequestController {
    constructor(
        @inject(TYPES.PRICE_REQUEST_REPOSITORY) private priceRequestRepository : IPriceRequestRepository,
        @inject(TYPES.END_USER_PRODUCT_CONTROLLER) private productController: EndUserProductController, 
        @inject(TYPES.EMAIL_SERVICE) private emailService : IEmailService,
        @inject(TYPES.ADMIN_EMAIL) private adminEmail: string,
    ) {}

    private async priceRequestToEmail(priceRequest: PriceRequest) : Promise<string> {
        let ret: string = ''
        let products : Map<number, ProductAndPrice> = new Map()

        for (let i = 0; i < priceRequest.items.length; i++) {
            let productId = priceRequest.items[i].productId
            if (!products.has(productId)) {
                let productWithPrice = await this.productController.fetchProductAndPrice(productId)
                products.set(productId, productWithPrice)
            }
        }

        ret += 'Tên khách: ' + priceRequest.customerName + '\n'
        ret += 'Địa chỉ: ' + priceRequest.customerAddress + '\n'
        ret += 'Lời nhắn: ' + priceRequest.customerMessage + '\n'
        ret += 'SĐT: ' + priceRequest.customerPhone + '\n'
        ret += '\tTên hàng\t|\tSố lượng\t|\tĐơn vị\n'
        for (let i = 0; i < priceRequest.items.length; i++) {
            let orderItem = priceRequest.items[i]
            let productId = orderItem.productId
            let productWithPrice = products.get(productId)
            ret += `\t${productWithPrice?.product.name}\t|\t${orderItem.quantity}\t|\t${EProductUnitToString(orderItem.unit)}\n`
        }

        return ret
    }


    async createPriceRequest(arg: CreatePriceRequestArgs) : Promise<PriceRequest> {
        let priceRequest = await this.priceRequestRepository.createPriceRequest(arg)
        let email = await this.priceRequestToEmail(priceRequest)
        await this.emailService.sendEmail(this.adminEmail, email, 'Yêu cầu báo giá mới')
        
        return priceRequest
    }
}