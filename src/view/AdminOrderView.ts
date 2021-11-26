import { inject, injectable } from "inversify";
import { Request, Response } from 'express'
import { TYPES } from "../types";
import { AdminOrderController } from "../controller/AdminOrderController";
import { parseOrder } from "../parsers/OrderParser";
import { NotFound } from "../exception/NotFound";

@injectable()
export class AdminOrderView {
    constructor(
        @inject(TYPES.ADMIN_ORDER_CONTROLLER) private controller: AdminOrderController
    ) {

    }

    async fetchOrderSummaries(request: Request, response: Response) {
        let limit = parseInt(request.query.limit as string)
        let offset = parseInt(request.query.offset as string)
        let startId = parseInt(request.query.startId as string)
        if (isNaN(limit) || 
            isNaN(offset) ||
            isNaN(startId)
        ) {
            return response.status(400).send()
        }

        let orderId: number | undefined = undefined
        if (request.query.orderId !== undefined) {
            orderId = parseInt(request.query.orderId as string)
        }
        let orderTimeStart: Date | undefined = undefined
        if (request.query.orderTimeStart) {
            orderTimeStart = new Date(request.query.orderTimeStart as string)
        }

        let orderTimeEnd: Date | undefined = undefined
        if (request.query.orderTimeEnd) {
            orderTimeEnd = new Date(request.query.orderTimeEnd as string)
        }

        let includeCancelledOrders = request.query.includeCancelledOrders == 'true'
        let includeReceivedOrders = request.query.includeReceivedOrders == 'true'
        let includeShippedOrders = request.query.includeShippedOrders == 'true'
        let includePaidOrders = request.query.includePaidOrders == 'true'
        let includeOrderedOrders = request.query.includeOrderedOrders == 'true'


        let orders = await this.controller.fetchOrders({
            limit: limit,
            offset: offset,
            startId: startId,
            orderId,
            orderTimeStart,
            orderTimeEnd,
            includeCancelledOrders,
            includeReceivedOrders,
            includeShippedOrders,
            includePaidOrders,
            includeOrderedOrders,
        })

        let ret = []
        for (let i = 0; i < orders.length; i++) {
            ret.push(parseOrder(orders[i]))
        }
        return response.status(200).send(ret)
    }

    async fetchNumberOfOrders(request: Request, response: Response) {
        let orderId: number | undefined = undefined
        if (request.query.orderId !== undefined) {
            orderId = parseInt(request.query.orderId as string)
        }

        let orderTimeStart: Date | undefined = undefined
        if (request.query.orderTimeStart) {
            orderTimeStart = new Date(request.query.orderTimeStart as string)
        }

        let orderTimeEnd: Date | undefined = undefined
        if (request.query.orderTimeEnd) {
            orderTimeEnd = new Date(request.query.orderTimeEnd as string)
        }

        let includeCancelledOrders = request.query.includeCancelledOrders === 'true'
        let includeReceivedOrders = request.query.includeReceivedOrders === 'true'
        let includeShippedOrders = request.query.includeShippedOrders === 'true'
        let includePaidOrders = request.query.includePaidOrders === 'true'
        let includeOrderedOrders = request.query.includeOrderedOrders === 'true'

        let numberOfOrders = await this.controller.fetchNumberOfOrders({
            orderId,
            orderTimeStart,
            orderTimeEnd,
            includeCancelledOrders,
            includeReceivedOrders,
            includeShippedOrders,
            includePaidOrders,
            includeOrderedOrders,
        })

        return response.status(200).send(numberOfOrders.toString())
    }

    async updateOrderStatus(request: Request, response: Response) {
        let orderId = parseInt(request.params.id)
        if (isNaN(orderId)) {
            return response.status(400).send()
        }

        let isShipped = request.body.isShipped === 'true'
        let isReceived = request.body.isReceived === 'true'
        let isCancelled = request.body.isCancelled === 'true'
        let isPaid = request.body.isPaid === 'true'

        let order = await this.controller.updateOrderStatus({
            orderId: orderId, 
            isShipped, 
            isReceived, 
            isCancelled, 
            isPaid
        })

        return response.status(200).send(order)
    }

    async fetchOrderDetailById(request: Request, response: Response) {
        let orderId = parseInt(request.params.id as string)
        console.log('request.params')
        console.log(request.params)
        console.log('orderId')
        console.log(orderId)
        if (isNaN(orderId)) {
            return response.status(400).send()
        }

        try {
            let order = await this.controller.fetchOrderById(
                orderId,
            )
            return response.status(200).send(parseOrder(order))

        } catch (exception) {
            console.log('exception')
            console.log(exception)
            if (exception instanceof NotFound) {
                return response.status(404).send()
            } else {
                throw exception
            }
        }
    }
}