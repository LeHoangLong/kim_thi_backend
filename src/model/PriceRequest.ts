import Decimal from "decimal.js";
import { CustomerContact } from "./CustomerContact";
import { EProductUnit } from "./ProductPrice";

export interface PriceRequestItem {
    id: number,
    productId: number,
    quantity: Decimal,
    unit: EProductUnit,
}

export interface PriceRequest {
    id: number,
    items: PriceRequestItem[],
    customerAddress: string,
    customerMessage: string,
    customerPhone: string,
    customerName: string,
    createdTime: Date,
}