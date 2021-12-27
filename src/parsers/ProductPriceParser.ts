import Decimal from "decimal.js";
import { EProductUnit, EProductUnitToString, ProductPrice, stringToEProductUnit } from "../model/ProductPrice";

export function parseProductPrice(productPrice: ProductPrice) : ProductPrice {
    let ret : ProductPrice = {
        ...productPrice
    }

    ret.priceLevels = [...ret.priceLevels]
    ret.unit = EProductUnitToString(ret.unit) as any
    ret.defaultPrice = ret.defaultPrice.toString() as any
    for (let i = 0; i < ret.priceLevels.length; i++) {
        ret.priceLevels[i] = {
            minQuantity: ret.priceLevels[i].minQuantity.toString() as any,
            price: ret.priceLevels[i].price.toString() as any,
        }
    }

    return ret
}

export function normalizeProductPrice(productPrice: ProductPrice) : ProductPrice {
    let ret: ProductPrice = {
        ...productPrice
    }
    
    ret.priceLevels = [...ret.priceLevels]
    ret.unit = stringToEProductUnit(ret.unit as any)
    ret.defaultPrice = new Decimal(ret.defaultPrice)
    for (let i = 0; i < ret.priceLevels.length; i++) {
        ret.priceLevels[i] = {
            minQuantity: new Decimal(ret.priceLevels[i].minQuantity),
            price: new Decimal(ret.priceLevels[i].price),
        }
    }

    return ret


}