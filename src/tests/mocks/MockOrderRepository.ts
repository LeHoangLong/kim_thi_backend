import { Order, OrderItem } from "../../model/Order";
import { CreateOrderArg, IOrderRepository } from "../../repository/IOrderRepository";

export class MockOrderRepository implements IOrderRepository {
    public orders: Order[] = []

    async createOrder(arg: CreateOrderArg): Promise<Order> {
        for (let i = 0; i < arg.items.length; i++) {
            arg.items[i].id = i
        }
        let ret : Order = {
            id: this.orders.length,
            items: arg.items,
            isShipped: false,
            isReceived: false,
            isPaid: false,
            isCancelled: false,
            cancellationReason: '',
            customerMessage: arg.message,
            customerContact: arg.customerContact,
            paymentAmount: arg.paymentAmount,
            address: arg.shippingAddress,
            areaTransportFee: arg.areaTransportFee,
            orderTime: new Date(),
        }

        this.orders.push(ret)

        return ret
    }
    
}