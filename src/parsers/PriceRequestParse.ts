import { PriceRequest, PriceRequestItem } from "../model/PriceRequest";
import { EProductUnit, EProductUnitToString } from "../model/ProductPrice";

export function parsePriceRequestItem(item: PriceRequestItem) : any {
    let ret : any = {...item}
    ret.quantity = item.quantity.toString()
    ret.unit = EProductUnitToString(item.unit).toLowerCase()
    return ret
}

export function parsePriceRequest(request: PriceRequest) : any {
    let ret : any = {...request}
    ret.createdTime = request.createdTime.toISOString()
    ret.items = [...request.items]
    for (let i = 0; i < request.items.length; i++) {
        ret.items[i] = parsePriceRequestItem(request.items[i])
    }
    return ret
}