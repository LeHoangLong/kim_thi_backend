import Decimal from "decimal.js";
import { Address } from "../model/Address";
import { AreaTransportFee } from "../model/AreaTransportFee";
import { CustomerContact } from "../model/CustomerContact";
import { Order, OrderItem } from "../model/Order";

export interface CreateOrderArg {
    items: OrderItem[],
    message: string,
    paymentAmount: Decimal,
    customerContact: CustomerContact,
    shippingAddress: Address,
    areaTransportFee: AreaTransportFee,
}

export interface FilterOrderArg {
    orderId?: number, // -1 for ignore
    orderTimeStart?: Date,
    orderTimeEnd?: Date,
    includeCancelledOrders?: boolean,
    includeReceivedOrders?: boolean,
    includeShippedOrders?: boolean,
    includePaidOrders?: boolean,
    includeOrderedOrders?: boolean,
}

export interface FetchOrderArg extends FilterOrderArg {
    limit: number,
    offset: number,
    startId: number,
}

export interface IOrderRepository {
    createOrder(arg: CreateOrderArg): Promise<Order>
    fetchOrders(arg: FetchOrderArg): Promise<Order[]>
    fetchNumberOfOrders(arg: FilterOrderArg): Promise<number>
    updateOrderStatus(arg: {
        orderId: number, 
        isShipped: boolean, 
        isReceived: boolean, 
        isCancelled: boolean, 
        isPaid: boolean
    }) : Promise<boolean>
}