import { inject, injectable } from "inversify";
import { Pool, PoolClient } from "pg";
import { NotFound } from "../exception/NotFound";
import { Product } from "../model/Product";
import { ProductCategory } from "../model/ProductCategory";
import { ProductPrice } from "../model/ProductPrice";
import { PostgresConnectionFactory } from "../services/PostgresConnectionFactory";
import { TYPES } from "../types";
import { IProductRepository } from "./IProductRepository";
var PgError = require("pg-error")

@injectable()
export class ProductRepositoryPostgres implements IProductRepository{
    constructor(
        @inject(TYPES.POSTGRES_DRIVER) private client: Pool,
        @inject(TYPES.CONNECTION_FACTORY) private connectionFactory: PostgresConnectionFactory,
    ) {

    }

    async createProduct(product: Product): Promise<Product> {
        let ret : Product
        await this.connectionFactory.getConnection(this, async (connection: PoolClient) => {
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
            ret = newProduct;
        })
        return ret!;
    }

    async deleteProduct(id: number) : Promise<number> {
        let ret : number = 0
        await this.connectionFactory.getConnection(this, async (connection: PoolClient) => {
            let results = await connection.query(`
            UPDATE "product" SET is_deleted = TRUE WHERE id = $1
            `, [id]);
            ret = results.rowCount
        })
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

    async fetchProductsByCategory(category: string, limit: number, offset: number) : Promise<Product[]> {
        let response = await this.client.query(`
        SELECT 
            id, serial_number, name, is_deleted, avatar_id,
            rank, created_time
        FROM "product" INNER JOIN "product_category" cat
        WHERE cat.category = $1 AND is_deleted = FALSE
        ORDER BY rank DESC, created_time DESC
        LIMIT $2
        OFFSET $3
        `, [category, limit, offset]);
        let ret : Product[] = [];
        for (let i = 0; i < response.rows.length; i++) {
            let result = response.rows[i];
            ret.push(this._jsonToProduct(result))
        }
        return ret;
    }


    async fetchProductCategories(productId: number) : Promise<ProductCategory[]> {
        let response = await this.client.query(`
            SELECT 
                category
            FROM "product_category"
            WHERE product_id = $1
        `, [productId])
        let ret : ProductCategory[] = [];
        for (let i = 0; i < response.rows.length; i++) {
            let result = response.rows[i];
            ret.push(this._jsonToProductCategory(result, productId))
        }
        return ret;
    }

    async createProductCategory(productId: number, categories: string[]) : Promise<ProductCategory[]> {
        let ret : ProductCategory[] = []
        for (let i = 0; i < categories.length; i++) {
            await this.client.query(`
                INSERT INTO "product_product_category" (
                    category, 
                    product_id
                ) VALUES ($1, $2)
            `, [categories[i], productId])
            ret.push({
                category: categories[i],
            })
        }
        return ret;
    }

    _jsonToProductCategory(json: any, productId: number) : ProductCategory {
        return {
            category: json['category'],
        }
    }

    async updateProductCategories(productId: number, categories: string[]) : Promise<ProductCategory[]> {
        let ret : ProductCategory[] = []
        await this.connectionFactory.getConnection(this, async (connection: PoolClient) => {
            await this.client.query(`
                DELETE FROM "product_product_category" WHERE product_id = $1
            `, [productId])
            ret = await this.createProductCategory(productId, categories)
        })
        return ret
    }
}