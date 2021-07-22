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

    async fetchPricesByProductId(productId: number) : Promise<ProductPrice[]> {
        try {
            let results = await this.client.query(`
                SELECT 
                    id, unit, default_price, product_id, is_default
                FROM "product_price"
                WHERE product_id = $1 AND is_deleted = FALSE
                ORDER BY id ASC
            `, [productId]);
    
            let ret : ProductPrice[] = []
            for (let i = 0 ; i < results.rowCount; i++) {
                let result = results.rows[i];
                let price : ProductPrice = {
                    id: result['id'],
                    unit: result['unit'],
                    defaultPrice: result['default_price'],
                    isDeleted: false,
                    priceLevels: [],
                    isDefault: result['is_default']
                }
    
                let priceLevelResult = await this.client.query(`
                    SELECT
                        min_quantity, price
                    FROM "product_price_level"
                    WHERE product_price_id = $1 AND is_deleted = FALSE
                `, [price.id])
    
                for (let i = 0; i < priceLevelResult.rowCount; i++) {
                    let priceLevelRow = priceLevelResult.rows[i]
                    price.priceLevels.push({
                        minQuantity: priceLevelRow.min_quantity,
                        price: priceLevelRow.price
                    })                
                }
                ret.push(price)
            }
            return ret
        } catch (exception) {
            throw exception.message
        }
    }

    async fetchPriceById(id: number) : Promise<ProductPrice> {
        try {
            let results = await this.client.query(`
                SELECT 
                    id, unit, default_price, product_id, is_default,
                    pl.min_quantity as price_level_min_quantity, pl.price as product_price_level
                FROM "product_price"
                INNER JOIN "product_price_level" pl
                WHERE id = $1 AND is_deleted = FALSE AND pl.product_price_id = id AND pl.is_deleted = FALSE
            `, [id]);
            if (results.rowCount == 0) {
                throw new NotFound("product_price", "id", id.toString());
            } else {
                let result = results.rows[0];
                let ret : ProductPrice = {
                    id: result['id'],
                    unit: result['unit'],
                    defaultPrice: result['default_price'],
                    isDeleted: false,
                    priceLevels: [],
                    isDefault: result['is_default']
                }
                for (let i = 0; i < results.rowCount; i++) {
                    ret.priceLevels.push({
                        minQuantity: results.rows[i].price_level_min_quantity,
                        price: results.rows[i].price_level_price
                    })                
                }
                return ret
            }
        } catch (exception) {
            throw exception.message
        }
    }

    async fetchDefaultPriceByProductId(productId: number) : Promise<ProductPrice> {
        try {
            var result = await this.client.query(`
                SELECT 
                    id, unit, default_price, product_id
                FROM "product_price"
                WHERE product_id = $1 AND is_deleted = FALSE AND is_default = TRUE
            `, [productId])
            if (result.rowCount === 0) {
                console.log('not found')
                throw new NotFound("product_price", "product_id", productId.toString())
            } else {
                let row = result.rows[0]
                let price : ProductPrice = {
                    id: row['id'],
                    unit: row['unit'],
                    defaultPrice: row['default_price'],
                    isDeleted: false,
                    priceLevels: [],
                    isDefault: true
                }
                
                let priceLevelResult = await this.client.query(`
                    SELECT
                        min_quantity, price
                    FROM "product_price_level"
                    WHERE product_price_id = $1 AND is_deleted = FALSE
                `, [price.id])
    
                for (let i = 0; i < priceLevelResult.rowCount; i++) {
                    let priceLevelRow = priceLevelResult.rows[i]
                    price.priceLevels.push({
                        minQuantity: priceLevelRow.min_quantity,
                        price: priceLevelRow.price
                    })                
                }
    
                return price
            }
        } catch (exception) {
            throw exception.message
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
        } catch (exception) {
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
                `, [price.unit, price.defaultPrice, productId, price.isDefault])
    
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
                    `, [newPrice.id, priceLevel.minQuantity, priceLevel.price])
                    newPrice.priceLevels.push(priceLevel)
                }
                ret.push(newPrice)
            }
        })
        return ret
    }
}