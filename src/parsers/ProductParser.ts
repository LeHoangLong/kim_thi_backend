import { ProductSummary } from "../controller/ProductController";
import { Product } from "../model/Product";
import { parseProductPrice } from "./ProductPriceParser";

export function parseProductSummary(summary: ProductSummary) : ProductSummary {
    let ret: ProductSummary = {...summary}
    ret.defaultPrice = parseProductPrice(ret.defaultPrice)
    return ret
}