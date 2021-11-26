import { inject, injectable } from "inversify";
import { NotFound } from "../exception/NotFound";
import { Order } from "../model/Order";
import { CreateOrderArg, FetchOrderArg, FilterOrderArg, IOrderRepository } from "../repository/IOrderRepository";
import { TYPES } from "../types";

@injectable()
export class AdminOrderController {
    constructor(
        @inject(TYPES.ORDER_REPOSITORY) private repository: IOrderRepository
    ) {}

    async fetchOrderById(orderId: number): Promise<Order> {
        let orders = await this.repository.fetchOrders({
            startId: 0,
            limit: 1,
            offset: 0,
            orderId: orderId,
            includeOrderedOrders: true,
        })
        if (orders.length > 0) {
            return orders[0]
        } else {
            throw new NotFound("Order", "id", orderId.toString())
        }
    }

    async fetchOrders(arg: FetchOrderArg): Promise<Order[]> {
        let orders = await this.repository.fetchOrders(arg)
        return orders
    }

    async fetchNumberOfOrders(arg: FilterOrderArg): Promise<number> {
        return this.repository.fetchNumberOfOrders(arg)
    }

    async updateOrderStatus(arg: {
        orderId: number, 
        isShipped: boolean, 
        isReceived: boolean, 
        isCancelled: boolean, 
        isPaid: boolean
    }) : Promise<Order> {
        let isUpdated = await this.repository.updateOrderStatus(arg)
        if (isUpdated) {
            let orders = await this.repository.fetchOrders({
                orderId: arg.orderId,
                startId: arg.orderId,
                limit: 1,
                offset: 0,
                includeOrderedOrders: true,
            })
            return orders[0]
        } else {
            throw new NotFound("Order", "id", arg.orderId.toString())
        }
    }
}