import { Order } from "../model/Order";
import { EProductUnitToString } from "../model/ProductPrice";
import { parseAreaTransportFee } from "./AreaTransportFeeParser";

export function parseOrder(order: Order) {
    let ret: Order = {...order}
    ret.items = [...ret.items]
    for (let i = 0; i < ret.items.length; i++) {
        ret.items[i] = {
            id: ret.items[i].id,
            unit: EProductUnitToString(ret.items[i].unit) as any,
            price: ret.items[i].price.toString() as any,
            quantity: ret.items[i].quantity.toString() as any,
        }
    }

    ret.address.latitude = ret.address.latitude.toString() as any
    ret.address.longitude = ret.address.longitude.toString() as any

    ret.paymentAmount = ret.paymentAmount.toString() as any

    ret.areaTransportFee = parseAreaTransportFee(ret.areaTransportFee) as any

    return ret
}