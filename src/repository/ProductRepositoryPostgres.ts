import { inject, injectable } from "inversify";
import { Pool, PoolClient } from "pg";
import { Product } from "../model/Product";
import { ProductPrice } from "../model/ProductPrice";
import { TYPES } from "../types";
import { IProductRepository } from "./IProductRepository";

@injectable()
export class ProductRepositoryPostgres implements IProductRepository{
    constructor(
        @inject(TYPES.POSTGRES_DRIVER) private client: Pool
    ) {

    }

    async createProduct(product: Product, prices: ProductPrice[]): Promise<Product> {
        let connection = await this.client.connect()
        connection.query('BEGIN')
        try {
            var results = await this.client.query(`
                INSERT INTO "product" (
                    name, rank, avatar_id
                ) VALUES (
                    $1, $2, $3
                ) RETURNING (id, created_time, is_deleted)
            `, [ product.name, product.rank, product.avatarId ]);
            let newProduct = {...product};
            newProduct.id = results.rows[0].id;
            newProduct.createdTimeStamp = results.rows[0].created_time;
            newProduct.isDeleted = results.rows[0].is_deleted;
            await this.createProductPrice(connection, newProduct.id!, prices)
            connection.query('COMMIT')
            return newProduct;
        } catch (exception) {
            connection.query('ROLLBACK')
            throw exception
        } finally {
            connection.release()
        }
    }

    async createProductPrice(connection: PoolClient, productId: string, prices: ProductPrice[]) : Promise<ProductPrice[]> {
        let ret : ProductPrice[] = []
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

            for (let j = 0; j < price.priceLevels.length; i++) {
                let priceLevel = price.priceLevels[j]
                await connection.query(`
                    INSERT INTO "product_price_level" (
                        product_price_id,
                        min_quantity,
                        price,
                    ) VALUES (
                        $1, $2, $3
                    )
                `, [newPrice.id, priceLevel.minQuantity, priceLevel.price])
                newPrice.priceLevels.push(priceLevel)
            }

            ret.push(newPrice)
        }

        return ret
    }

    async fetchProducts(offset: number, limit: number): Promise<Product[]> {
        var results = await this.client.query(`
            SELECT 
                id, name, is_deleted, avatar_id,
                rank, created_time
            FROM "product"
            WHERE is_deleted = FALSE
            ORDER BY created_time
            LIMIT $1
            OFFSET $2
        `, [limit, offset])
        let products : Product[] = [];
        for (let i = 0; i < results.rows.length; i++) {
            let result = results.rows[i];
            products.push({
                id: result['id'],
                name: result['name'],
                isDeleted: result['is_deleted'],
                avatarId: result['avatar_id'],
                createdTimeStamp: result['created_time'],
                rank: result['rank'],
            })
        }
        return products;
    }

    async fetchNumberOfProducts(): Promise<number> {
        var result = await this.client.query(`
            SELECT COUNT(*) FROM "product" WHERE is_deleted = FALSE
        `);
        return result.rows[0].count;
    }
}