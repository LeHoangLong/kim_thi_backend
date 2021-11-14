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

export interface IOrderRepository {
    createOrder(arg: CreateOrderArg): Promise<Order>
}