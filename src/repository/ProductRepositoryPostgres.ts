import { inject, injectable } from "inversify";
import { Pool } from "pg";
import { Product } from "../model/Product";
import { TYPES } from "../types";
import { IProductRepository } from "./IProductRepository";

@injectable()
export class ProductRepositoryPostgres implements IProductRepository{
    constructor(
        @inject(TYPES.POSTGRES_DRIVER) private client: Pool
    ) {

    }

    async createProduct(product: Product): Promise<Product> {
        var results = await this.client.query(`
            INSERT INTO "product" (
                name, rank, avatar_id, display_price_id
            ) VALUES (
                $1, $2, $3, $4, $5
            ) RETURNING (id, created_time, is_deleted)
        `, [ product.name, product.rank, product.avatarId, product.displayPriceId ]);
        let newProduct = {...product};
        newProduct.id = results.rows[0].id;
        newProduct.createdTimeStamp = results.rows[0].created_time;
        newProduct.isDeleted = results.rows[0].is_deleted;
        return newProduct;
    }

    async fetchProducts(offset: number, limit: number): Promise<Product[]> {
        var results = await this.client.query(`
            SELECT 
                id, name, is_deleted, avatar_id, rank,
                display_price_id, created_time
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
                displayPriceId: result['display_price_id'],
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