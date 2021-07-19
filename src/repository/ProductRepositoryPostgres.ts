import { inject, injectable } from "inversify";
import { Pool, PoolClient } from "pg";
import { NotFound } from "../exception/NotFound";
import { Product } from "../model/Product";
import { ProductPrice } from "../model/ProductPrice";
import { TYPES } from "../types";
import { IProductRepository } from "./IProductRepository";
var PgError = require("pg-error")

@injectable()
export class ProductRepositoryPostgres implements IProductRepository{
    constructor(
        @inject(TYPES.POSTGRES_DRIVER) private client: Pool
    ) {

    }

    async createProduct(product: Product, prices: ProductPrice[]): Promise<Product> {
        let connection = await this.client.connect()
        await connection.query('BEGIN')
        try {
            var results = await connection.query(`
                INSERT INTO "product" (
                    serial_number, name, rank, avatar_id
                ) VALUES (
                    $1, $2, $3, $4
                ) RETURNING id, created_time, is_deleted
            `, [ product.serialNumber, product.name, product.rank, product.avatarId ]);
            let newProduct = {...product};
            newProduct.id = results.rows[0].id;
            newProduct.serialNumber = product.serialNumber;
            newProduct.createdTimeStamp = results.rows[0].created_time;
            newProduct.isDeleted = results.rows[0].is_deleted;
            await this.createProductPrice(connection, results.rows[0].id, prices)
            await connection.query('COMMIT')
            return newProduct;
        } catch (exception) {
            await connection.query('ROLLBACK')
            if (exception instanceof PgError) {
                throw exception.message
            } else {
                throw exception
            }
        } finally {
            connection.release()
        }
    }

    async deleteProduct(id: number) : Promise<number> {
        let results = await this.client.query(`
            UPDATE "product" SET is_deleted = TRUE WHERE id = $1
        `, [id]);

        return results.rowCount
    }

    async createProductPrice(connection: PoolClient, productId: number, prices: ProductPrice[]) : Promise<ProductPrice[]> {
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

        return ret
    }

    _jsonToProduct(json: any) : Product {
        return {
            id: json['id'],
            serialNumber: json['serial_number'],
            name: json['name'],
            isDeleted: json['is_deleted'],
            avatarId: json['avatar_id'],
            createdTimeStamp: json['created_time'],
            rank: json['rank'],
        }
    }  

    async fetchProducts(offset: number, limit: number): Promise<Product[]> {
        var results = await this.client.query(`
            SELECT 
                id, serial_number, name, is_deleted, avatar_id,
                rank, created_time
            FROM "product"
            WHERE is_deleted = FALSE
            ORDER BY created_time DESC
            LIMIT $1
            OFFSET $2
        `, [limit, offset])
        let products : Product[] = [];
        for (let i = 0; i < results.rows.length; i++) {
            let result = results.rows[i];
            products.push(this._jsonToProduct(result))
        }
        return products;
    }

    async fetchNumberOfProducts(): Promise<number> {
        var result = await this.client.query(`
            SELECT COUNT(*) FROM "product" WHERE is_deleted = FALSE
        `);
        return result.rows[0].count;
    }

    async fetchProductById(id: number) : Promise<Product> {
        var result = await this.client.query(`
            SELECT 
                id, serial_number, name, is_deleted, avatar_id,
                rank, created_time
            FROM "product"
            WHERE is_deleted = FALSE AND id = $1
        `, [id])
        if (result.rowCount == 0) {
            throw new NotFound("product", "id", id.toString())
        } else {
            let row = result.rows[0]
            return {
                id: row['id'],
                serialNumber: row['serial_number'],
                name: row['name'],
                isDeleted: row['is_deleted'],
                avatarId: row['avatar_id'],
                createdTimeStamp: row['created_time'],
                rank: row['rank'],
            }
        }
    }

    async fetchProductsCountWithName(name: string) : Promise<number> {
        let response = await this.client.query(`
            SELECT COUNT(*) 
            FROM "product" 
            WHERE name LIKE $1 AND is_deleted = FALSE
        `, [`%${name}%`])
        console.log('response.rows')
        console.log(response.rows)
        return response.rows[0].count
    }

    async findProductsByName(name: string, offset: number, limit: number) : Promise<Product[]> {
        let response = await this.client.query(`
            SELECT 
                id, serial_number, name, is_deleted, avatar_id,
                rank, created_time
            FROM "product"
            WHERE name LIKE $1 AND is_deleted = FALSE
            ORDER BY rank DESC, created_time DESC
            LIMIT $2
            OFFSET $3
        `, [`%${name}%`, limit, offset]);
        let ret : Product[] = [];
        for (let i = 0; i < response.rows.length; i++) {
            let result = response.rows[i];
            ret.push(this._jsonToProduct(result))
        }
        return ret;
    }
}