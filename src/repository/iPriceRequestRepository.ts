import Decimal from "decimal.js";
import { PriceRequest } from "../model/PriceRequest";
import { EProductUnit } from "../model/ProductPrice";

export interface CreatePriceRequestItemArgs {
    productId: number,
    quantity: Decimal,
    unit: EProductUnit,
}

export interface CreatePriceRequestArgs {
    items: CreatePriceRequestItemArgs[],
    customerAddress: string,
    customerMessage: string,
    customerPhone: string,
    customerName: string,
}

export interface IPriceRequestRepository {
    createPriceRequest(arg: CreatePriceRequestArgs) : Promise<PriceRequest>;
}