import Decimal from "decimal.js";
import { Address } from "./Address";
import { AreaTransportFee } from "./AreaTransportFee";
import { CustomerContact } from "./CustomerContact";
import { EProductUnit } from './ProductPrice'

export interface OrderItem {
    id: number,
    productId: number,
    price: Decimal,
    quantity: Decimal,
    unit: EProductUnit,
}

export interface Order {
    id: number,
    items: OrderItem[],
    isShipped: boolean,
    isReceived: boolean,
    isPaid: boolean,
    paymentTime: Date | null,
    receivedTime: Date | null,
    startShippingTime: Date | null,
    cancellationTime: Date | null,
    isCancelled: boolean,
    cancellationReason: string,
    customerMessage: string,
    customerContact: CustomerContact,
    paymentAmount: Decimal,
    address: Address,
    areaTransportFee: AreaTransportFee,
    orderTime: Date,
}