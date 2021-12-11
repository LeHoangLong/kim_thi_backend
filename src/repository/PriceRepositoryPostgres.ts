import Decimal from "decimal.js";
import { inject, injectable } from "inversify";
import { Pool, PoolClient } from "pg";
import { NotFound } from "../exception/NotFound";
import { ProductPrice } from "../model/ProductPrice";
import { PostgresConnectionFactory } from "../services/PostgresConnectionFactory";
import { TYPES } from "../types";
import { IProductPriceRepository } from "./IPriceRepository";
const PgError = require('pg-error')
@injectable()
export class PriceRepositoryPostgres implements IProductPriceRepository {
    constructor(
        @inject(TYPES.POSTGRES_DRIVER) private client: Pool,
        @inject(TYPES.CONNECTION_FACTORY) private connectionFactory: PostgresConnectionFactory,
    ) {
    }

    private jsonToPrices(json: any) : ProductPrice[] {
        let ret: ProductPrice[] = []
        for (let i = 0; i < json.length; i++) {
            let row = json[i];
            let price = ret.find(e => e.id === row.id)
            if (price === undefined) {
                price = {
                    id: row['id'],
                    unit: row['unit'],
                    defaultPrice: row['default_price'],
                    isDeleted: false,
                    priceLevels: [],
                    isDefault: row['is_default']
                }
                ret.push(price)
            } 
            
            if (row.min_quantity !== null || row.price !== null) {
                price.priceLevels.push({
                    minQuantity: row.min_quantity,
                    price: row.price,
                })  
            }              
        }

        return ret
    }

    async fetchPricesByProductId(productId: number) : Promise<ProductPrice[]> {
        console.log('productId')
        console.log(productId)
        try {
            let results = await this.client.query(`
                SELECT *
                FROM (
                    SELECT 
                        price.id, price.unit, price.default_price, price.product_id, price.is_default, price.is_deleted,
                        level.min_quantity, level.price
                    FROM "product_price" price
                    LEFT JOIN "product_price_level" level
                    ON level.product_price_id = price.id
                    ORDER BY id ASC
                ) price WHERE price.product_id = $1 AND price.is_deleted = FALSE
            `, [productId]);
            let ret = this.jsonToPrices(results.rows)
            console.log('ret')
            console.log(ret)
            return ret
        } catch (exception: any) {
            throw exception.message
        }
    }

    async fetchPriceById(id: number) : Promise<ProductPrice> {
        try {
            let results = await this.client.query(`
                SELECT *
                FROM (
                    SELECT 
                        price.id, price.unit, price.default_price, price.product_id, price.is_default,
                        level.min_quantity, level.price
                    FROM "product_price" price
                    LEFT JOIN "product_price_level" level
                    ON level.product_price_id = price.id
                    ORDER BY id ASC
                ) price WHERE price.product_id = $1 AND price.is_deleted = FALSE
            `, [id]);
            if (results.rows.length == 0) {
                throw new NotFound("product_price", "id", id.toString());
            } else {
                let ret = this.jsonToPrices(results.rows)
                return ret[0]
            }
        } catch (exception: any) {
            throw exception.message
        }
    }

    async fetchDefaultPriceByProductId(productId: number) : Promise<ProductPrice> {
        let prices = await this.fetchPricesByProductId(productId)
        let defaultPrice = prices.find(e => e.isDefault)
        if (defaultPrice === undefined) {
            throw new NotFound("product_price", "product_id", productId.toString())
        } else {
            return defaultPrice
        }
    }

    async deletePrice(id: number) : Promise<number> {
        try {
            var result = await this.client.query(`
                UPDATE "product_price" SET is_deleted = TRUE WHERE id = $1
            `, [id])

            await this.client.query(`
                UPDATE "product_price_level" SET is_deleted = TRUE WHERE product_price_id = $1
            `, [id])
            return result.rowCount
        } catch (exception: any) {
            throw exception.message
        }
    }


    async createProductPrice(productId: number, prices: ProductPrice[]) : Promise<ProductPrice[]> {
        let ret : ProductPrice[] = []
        await this.connectionFactory.getConnection(this, async (connection: PoolClient) => {
            for (let i = 0; i < prices.length; i++) {
                let price = prices[i]
    
                let results = await connection.query(`
                    INSERT INTO "product_price" (
                        unit, 
                        default_price,
                        product_id,
                        is_default
                    ) VALUES (
                        $1, $2, $3, $4
                    ) RETURNING id
                `, [price.unit, price.defaultPrice.toString(), productId, price.isDefault])
    
                let newPrice : ProductPrice = {
                    id: results.rows[0].id,
                    unit: price.unit,
                    defaultPrice: price.defaultPrice,
                    isDeleted: false,
                    priceLevels: [],
                    isDefault: price.isDefault,
                }
    
                for (let j = 0; j < price.priceLevels.length; j++) {
                    let priceLevel = price.priceLevels[j]
                    await connection.query(`
                        INSERT INTO "product_price_level" (
                            product_price_id,
                            min_quantity,
                            price
                        ) VALUES (
                            $1, $2, $3
                        )
                    `, [newPrice.id, priceLevel.minQuantity.toString(), priceLevel.price.toString()])
                    newPrice.priceLevels.push(priceLevel)
                }
                ret.push(newPrice)
            }
        })
        return ret
    }
}