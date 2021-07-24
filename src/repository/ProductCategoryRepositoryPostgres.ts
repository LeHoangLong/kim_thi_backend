import { inject, injectable } from "inversify";
import { PoolClient } from "pg";
import { ProductCategory } from "../model/ProductCategory";
import { IConnectionFactory } from "../services/IConnectionFactory";
import { PostgresConnectionFactory } from "../services/PostgresConnectionFactory";
import { TYPES } from "../types";
import { IProductCategoryRepository } from "./IProductCategoryRepository";

@injectable()
export class ProductCategoryRepositoryPostgres implements IProductCategoryRepository {
    constructor(
        @inject(TYPES.CONNECTION_FACTORY) private connectionFactory: PostgresConnectionFactory,
    ) {}

    async fetchAllCategories(limit: number, offset: number) : Promise<ProductCategory[]> {
        let ret: ProductCategory[] = []
        await this.connectionFactory.getConnection(this, async (connection: PoolClient) => {
            let response = await connection.query(`
            SELECT 
            category
            FROM "product_category"
            ORDER BY created_time DESC
            LIMIT $1
            OFFSET $2
            `, [limit, offset])
            
            for (let i = 0; i < response.rows.length; i++) {
                ret.push(this._jsonToProductCategory(response.rows[i]))
            }
        });
        return ret
    }

    async createProductCategory(category: string) : Promise<ProductCategory> {
        let result : ProductCategory
        await this.connectionFactory.getConnection(this, async (connection: PoolClient) => {
            await connection.query(`
                INSERT INTO "product_category" (category)
                VALUES ($1)
            `, [category])
            result = {
                category: category,
            }
        })
        return result!
    }

    async deleteProductCategory(category: string) : Promise<number> {
        let result : number = 0
        await this.connectionFactory.getConnection(this, async (connection: PoolClient) => {
            let response = await connection.query(`
                DELETE FROM "product_category" WHERE category = $1
            `, [category])

            result = response.rowCount
        })
        return result
    }
    
    _jsonToProductCategory(json: any) : ProductCategory {
        return {
            category: json['category'],
        }
    }
}