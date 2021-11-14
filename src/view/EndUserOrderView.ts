import 'reflect-metadata'
import { inject, injectable } from "inversify";
import { Request, Response } from 'express';
import { TYPES } from '../types';
import { CreateOrderArgOrderItem, EndUserOrderController } from '../controller/EndUserOrderController';
import { Order, OrderItem } from '../model/Order';
import { EProductUnitToString, stringToEProductUnit } from '../model/ProductPrice';
import Decimal from 'decimal.js';
import { IncorrectValue } from '../exception/IncorrectValue';
import { DeletedResource } from '../exception/DeletedResource';
import { UnrecognizedEnumValue } from '../exception/UnrecognizedEnumValue';
import { parseOrder } from '../parsers/OrderParser';

@injectable()
export class EndUserOrderView {
    constructor(
        @inject(TYPES.END_USER_ORDER_CONTROLLER) private controller: EndUserOrderController,
    ) {
        
    }

    async createOrder(request: Request, response: Response) {
        let items : CreateOrderArgOrderItem[] = []
        try {
            for (let i = 0; i < request.body.items.length; i++) {
                items.push({
                    productId: request.body.items[i].productId as number,
                    unit: stringToEProductUnit(request.body.items[i].unit),
                    quantity: new Decimal(request.body.items[i].quantity),
                })
            }
        } catch (exception) {
            if (exception instanceof UnrecognizedEnumValue) {
                return response.status(400).send()
            } else {
                throw exception
            }
        }

        let address = {
            latitude: new Decimal(request.body.address.latitude),
            longitude: new Decimal(request.body.address.longitude),
        }

        let contact = {
            phoneNumber: request.body.customerContact.phoneNumber,
        }

        let expectedPrice = new Decimal(request.body.expectedPrice)
        let order : Order
        try {
            order = await this.controller.createOrder({
                items: items,
                address: address,
                contact: contact,
                expectedPrice: expectedPrice,
                customerMessage: request.body.customerMessage,
            })
            let ret = parseOrder(order)
            return response.status(201).send(ret)
        } catch (exception) {
            if (exception instanceof IncorrectValue) {
                return response.status(400).send()
            } else if (exception instanceof DeletedResource) {
                return response.status(404).send()
            } else {
                throw exception
            }
        }

    }
}