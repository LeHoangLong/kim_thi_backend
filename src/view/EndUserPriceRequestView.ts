import Decimal from "decimal.js";
import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { EndUserPriceRequestController } from "../controller/EndUserPriceRequestController";
import { EProductUnit, stringToEProductUnit } from "../model/ProductPrice";
import { parsePriceRequest } from "../parsers/PriceRequestParse";
import { CreatePriceRequestArgs, CreatePriceRequestItemArgs } from "../repository/iPriceRequestRepository";
import { TYPES } from "../types";

@injectable()
export class EndUserPriceRequestView {
    constructor(
        @inject(TYPES.END_USER_PRICE_REQUEST_CONTROLLER) private controller: EndUserPriceRequestController
    ) {}


    async createPriceRequest(request: Request, response: Response) {
        try {
            
            let customerAddress = request.body.customerAddress
            let customerMessage = request.body.customerMessage
            let customerPhone = request.body.customerPhone
            let customerName = request.body.customerName

            if (typeof(customerAddress) != 'string') {
                return response.status(400).send()
            }

            if (typeof(customerPhone) != 'string') {
                return response.status(400).send()
            }

            if (typeof(customerName) != 'string') {
                return response.status(400).send()
            }

            if (typeof(customerMessage) != 'string') {
                customerMessage = ''
            }

            
            if (!Array.isArray(request.body.items) || request.body.items.length === 0) {
                return response.status(400).send()
            }
            let items : CreatePriceRequestItemArgs[] = []
            for (let i = 0; i < request.body.items.length; i++) {
                let productId = parseInt(request.body.items[i].productId)
                if (isNaN(productId)) {
                    return response.status(400).send()
                }
                let quantity = new Decimal(request.body.items[i].quantity)
                if (quantity.isNaN()) {
                    return response.status(400).send()
                }

                let unit: EProductUnit
                try {
                    unit = stringToEProductUnit(request.body.items[i].unit)
                } catch (exception) {
                    return response.status(400).send()
                }

                items.push({
                    productId,
                    quantity,
                    unit,
                })
            }

            let arg : CreatePriceRequestArgs = {
                customerAddress,
                customerMessage,
                customerPhone,
                customerName,
                items,
            }   

            let priceRequest = await this.controller.createPriceRequest(arg)
            let ret = parsePriceRequest(priceRequest)
            return response.status(201).send(ret)
        } catch (exception) {
            console.log('exception')
            console.log(exception)
            return response.status(500).send()
        }
    }
}