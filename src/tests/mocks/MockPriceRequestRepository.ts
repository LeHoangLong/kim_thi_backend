import Decimal from "decimal.js";
import { injectable } from "inversify";
import { PriceRequest } from "../../model/PriceRequest";
import { CreatePriceRequestArgs, IPriceRequestRepository } from "../../repository/iPriceRequestRepository";

@injectable()
export class MockPriceRequestRepository implements IPriceRequestRepository {
    public priceRequests: PriceRequest[] = []
    public itemCounter : number = 0
    async createPriceRequest(arg: CreatePriceRequestArgs): Promise<PriceRequest> {
        let newPriceRequest : PriceRequest = {
            id: this.priceRequests.length,
            items: [],
            customerAddress: arg.customerAddress,
            customerMessage: arg.customerMessage,
            customerPhone: arg.customerPhone,
            customerName: arg.customerName,
            createdTime: new Date(),
        }

        for (let i = 0; i < arg.items.length; i++) {
            newPriceRequest.items.push({
                id: this.itemCounter,
                productId: arg.items[i].productId,
                quantity: arg.items[i].quantity,
                unit: arg.items[i].unit,
            })
            this.itemCounter += 1
        }

        this.priceRequests.push(newPriceRequest)
        return newPriceRequest
    }
}