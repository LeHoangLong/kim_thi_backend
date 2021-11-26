import { NotFound } from "../../exception/NotFound";
import { Order, OrderItem } from "../../model/Order";
import { CreateOrderArg, FetchOrderArg, FilterOrderArg, IOrderRepository } from "../../repository/IOrderRepository";

export class MockOrderRepository implements IOrderRepository {
    public orders: Order[] = []
    private filter(arg: FilterOrderArg) : Order[] {
        let filtered = this.orders.filter(e => 
            ((e.isCancelled && arg.includeCancelledOrders) ||
            (e.isPaid && arg.includePaidOrders) ||
            (e.isReceived && arg.includeReceivedOrders) ||
            (e.isShipped && arg.includeShippedOrders) ||
            arg.includeOrderedOrders === true) && 
            (arg.orderId === undefined || e.id === arg.orderId) &&
            (arg.orderTimeEnd === undefined || new Date(e.orderTime) <= arg.orderTimeEnd) &&
            (arg.orderTimeStart === undefined || new Date(e.orderTime) >= arg.orderTimeStart)
        )
        return filtered
    }


    async updateOrderStatus(arg: { orderId: number; isShipped: boolean; isReceived: boolean; isCancelled: boolean; isPaid: boolean; }): Promise<boolean> {
        let index = this.orders.findIndex(e => e.id === arg.orderId)
        if (index === -1) {
            return false
        } else {
            this.orders[index] = {
                ...this.orders[index],
                isShipped: arg.isShipped,
                isReceived: arg.isReceived,
                isCancelled: arg.isCancelled,
                isPaid: arg.isPaid,
            }
            return true;
        }
    }
    
    async fetchNumberOfOrders(arg: FilterOrderArg): Promise<number> {
        let filter = this.filter(arg)
        return filter.length
    }

    async fetchOrders(arg: FetchOrderArg): Promise<Order[]> {
        let filtered = this.filter(arg)
        filtered = filtered.filter(e => e.id >= arg.startId)
        let ret: Order[] = []
        for (let i = arg.offset; i < filtered.length && i < arg.offset + arg.limit; i++) {
            ret.push(filtered[i])
        }

        return ret
    }

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
            paymentTime: null,
            receivedTime: null,
            startShippingTime: null,
            cancellationTime: null,
        }

        this.orders.push(ret)

        return ret
    }
    
}