import { inject, injectable } from "inversify";
import { Pool } from "pg";
import { NotFound } from "../exception/NotFound";
import { ProductPrice } from "../model/ProductPrice";
import { TYPES } from "../types";
import { IProductPriceRepository } from "./IPriceRepository";

@injectable()
export class PriceRepositoryPostgres implements IProductPriceRepository {
    constructor(
        @inject(TYPES.POSTGRES_DRIVER) private client: Pool
    ) {
    }

    async createPrice(price: ProductPrice) : Promise<ProductPrice> {
        let results = await this.client.query(`
            INSERT INTO "product_price" (
                unit, 
                min_quantity,
                price,
            ) VALUES (
                $1, $2, $3
            ) RETURNING id
        `, [price.unit, price.minQuantity, price.price]);
        let newPrice = {...price}
        newPrice.id = results.rows[0]['id'];
        newPrice.isDeleted = false;
        return newPrice;
    }

    async fetchPriceById(productId: number) : Promise<ProductPrice> {
        let results = await this.client.query(`
            SELECT id, unit, min_quantity, price, is_deleted
            FROM "product_price"
            WHERE id = $1 AND is_deleted = FALSE
        `, [productId]);
        if (results.rowCount == 0) {
            throw new NotFound("product_price", "id", productId.toString());
        } else {
            let result = results.rows[0];
            return {
                id: result['id'],
                unit: result['unit'],
                minQuantity: result['min_quantity'],
                price: result['price'],
                isDeleted: result['is_deleted'],
            }
        }
    }
}