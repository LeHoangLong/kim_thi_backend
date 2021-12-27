import { inject, injectable } from "inversify";
import { Pool, PoolClient, QueryResult } from "pg";
import SQL from "sql-template-strings";
import { NotFound } from "../exception/NotFound";
import { Product } from "../model/Product";
import { ProductCategory } from "../model/ProductCategory";
import { ProductPrice } from "../model/ProductPrice";
import { PostgresConnectionFactory } from "../services/PostgresConnectionFactory";
import { TYPES } from "../types";
import { IProductRepository, ProductSearchFilter } from "./IProductRepository";
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
            let query = SQL`
                INSERT INTO "product" (
                    serial_number, 
                    name, 
                    rank, 
                    avatar_id, 
                    description,
                    wholesale_prices
                ) VALUES (
                    ${product.serialNumber}, 
                    ${product.name}, 
                    ${product.rank}, 
                    ${product.avatarId}, 
                    ${product.description},
                    ARRAY[
            `

            for (let i = 0; i < product.wholesalePrices.length; i++) {
                query.append(SQL`
                    ${product.wholesalePrices[i]}
                `)
                if (i !== product.wholesalePrices.length - 1) {
                    query.append(',')
                }
            }

            query.append(SQL`
                    ]::text[]
                ) RETURNING id, created_time
            `)
            var results = await connection.query(query);
            let newProduct = {...product};
            newProduct.id = results.rows[0].id;
            newProduct.serialNumber = product.serialNumber;
            newProduct.createdTimeStamp = results.rows[0].created_time;
            newProduct.isDeleted = false;
            newProduct.wholesalePrices = product.wholesalePrices
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
        let newProduct : Product = {
            id: json['id'],
            description: json['description'],
            serialNumber: json['serial_number'],
            name: json['name'],
            isDeleted: json['is_deleted'],
            avatarId: json['avatar_id'],
            createdTimeStamp: json['created_time'],
            rank: json['rank'],
            wholesalePrices: json['wholesale_prices'],
        }

        return newProduct
    }  

    async fetchProducts(offset: number, limit: number): Promise<Product[]> {
        var results = await this.client.query(`
            SELECT 
                id, serial_number, name, is_deleted, avatar_id,
                rank, created_time, wholesale_prices, description
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

    async fetchNumberOfProducts(filter: ProductSearchFilter = {}): Promise<number> {
        var result: QueryResult<any>
        if (filter.category) {
            result = await this.client.query(`
            SELECT COUNT(DISTINCT p.id) FROM "product" p 
            JOIN "product_product_category" pc
            ON p.id = pc.product_id
            AND  LOWER(pc.category) = LOWER($1)
            AND ( $2::text IS NULL OR LOWER(p.name) LIKE LOWER($2) )
            WHERE p.is_deleted = FALSE
            `, [filter.category, filter.name? `%${filter.name}%` : null]);
        } else {
            result = await this.client.query(`
                SELECT COUNT(DISTINCT p.id) FROM "product" p 
                WHERE p.is_deleted = FALSE
                    AND ( $1::text IS NULL OR LOWER(p.name) LIKE LOWER($1) )
            `, [filter.name? `%${filter.name}%` : null])
        }
        return parseInt(result.rows[0].count)
    }

    async fetchProductById(id: number, ignoreDeleted: boolean = true) : Promise<Product> {
        var result = await this.client.query(`
            SELECT 
                id, serial_number, name, is_deleted, avatar_id,
                rank, created_time, wholesale_prices, description
            FROM "product"
            WHERE ($2=FALSE OR ($2=TRUE AND is_deleted = FALSE)) AND id = $1
        `, [id, ignoreDeleted])
        if (result.rowCount == 0) {
            throw new NotFound("product", "id", id.toString())
        } else {
            let row = result.rows[0]
            return this._jsonToProduct(row)
        }
    }

    async fetchProductsCountWithName(name: string) : Promise<number> {
        let response = await this.client.query(`
            SELECT COUNT(*) 
            FROM "product" 
            WHERE name LIKE $1 AND is_deleted = FALSE
        `, [`%${name}%`])
        return parseInt(response.rows[0].count)
    }

    async findProductsByName(name: string, offset: number, limit: number) : Promise<Product[]> {
        let response = await this.client.query(`
            SELECT 
                id, serial_number, name, is_deleted, avatar_id,
                rank, created_time, wholesale_prices, description
            FROM "product"
            WHERE LOWER(name) LIKE $1 AND is_deleted = FALSE
            ORDER BY rank DESC, created_time DESC
            LIMIT $2
            OFFSET $3
        `, [`%${name}%`.toLowerCase(), limit, offset]);
        let ret : Product[] = [];
        for (let i = 0; i < response.rows.length; i++) {
            let result = response.rows[i];
            ret.push(this._jsonToProduct(result))
        }
        return ret;
    }
    
    async fetchProductsByCategory(category: string, limit: number, offset: number, name?: string) : Promise<Product[]> {
        let ret : Product[] = [];
        await this.connectionFactory.getConnection(this, async (connection: PoolClient) => {
            let response: QueryResult<any>;
            if (name === undefined) {
                response = await connection.query(`
                    SELECT 
                        id, serial_number, name, is_deleted, avatar_id,
                        rank, created_time, wholesale_prices, description
                    FROM "product" INNER JOIN "product_product_category" cat
                    ON is_deleted = FALSE AND cat.product_id = id AND cat.category = $1
                    ORDER BY rank DESC, created_time DESC
                    LIMIT $2
                    OFFSET $3
                `, [category, limit, offset]);
            } else {
                response = await connection.query(`
                    SELECT 
                        id, serial_number, name, is_deleted, avatar_id,
                        rank, created_time, wholesale_prices, description
                    FROM "product" INNER JOIN "product_product_category" cat
                    ON is_deleted = FALSE 
                        AND cat.product_id = id 
                        AND cat.category = $1
                        AND LOWER(name) LIKE LOWER($2)
                    ORDER BY rank DESC, created_time DESC
                    LIMIT $3
                    OFFSET $4
                `, [category, `%${name}%`, limit, offset]);
            }
            for (let i = 0; i < response.rows.length; i++) {
                let result = response.rows[i];
                ret.push(this._jsonToProduct(result))
            }
        })

        return ret;
    }


    async fetchProductCategories(productId: number) : Promise<ProductCategory[]> {
        let ret : ProductCategory[] = [];
        await this.connectionFactory.getConnection(this, async (connection: PoolClient) => {
            let response = await connection.query(`
                SELECT 
                    category
                FROM "product_product_category"
                WHERE product_id = $1
            `, [productId])
            for (let i = 0; i < response.rows.length; i++) {
                let result = response.rows[i];
                ret.push(this._jsonToProductCategory(result))
            }
        })
        return ret;
    }

    async createProductCategory(productId: number, categories: string[]) : Promise<ProductCategory[]> {
        let ret : ProductCategory[] = []
        await this.connectionFactory.getConnection(this, async (connection: PoolClient) => {
            for (let i = 0; i < categories.length; i++) {
                await connection.query(`
                INSERT INTO "product_product_category" (
                        category, 
                        product_id
                    ) VALUES ($1, $2)
                `, [categories[i], productId])
                ret.push({
                    category: categories[i],
                })
            }
        })
        return ret;
    }

    _jsonToProductCategory(json: any) : ProductCategory {
        return {
            category: json['category'],
        }
    }

    async updateProductCategories(productId: number, categories: string[]) : Promise<ProductCategory[]> {
        let ret : ProductCategory[] = []
        await this.connectionFactory.getConnection(this, async (connection) => {
            await connection.query(`
                DELETE FROM "product_product_category" WHERE product_id = $1
            `, [productId])
            ret = await this.createProductCategory(productId, categories)
        })
        return ret
    }


    async fetchProductsByAreaTransportFee(areaTransportFeeId: number, limit: number, offset: number, ignoreDeleted: boolean = true) : Promise<Product[]> {
        let ret: Product[] = []
        await this.connectionFactory.getConnection(this, async (connection) => {
            let response = await connection.query(SQL`
                SELECT
                    id, serial_number, name, is_deleted, avatar_id,
                    rank, created_time, wholesale_prices, description
                FROM "product"
                JOIN "product_area_transport_fee" patf
                ON patf.transport_fee_id = ${areaTransportFeeId}
                    AND  id = patf.product_id
                    AND (${ignoreDeleted} = FALSE OR is_deleted = FALSE)
                ORDER BY created_time DESC, id DESC
                LIMIT ${limit}
                OFFSET ${offset}
            `)


            for (let i = 0; i < response.rows.length; i++) {
                let result = response.rows[i];
                ret.push(this._jsonToProduct(result))
            }
        })

        return ret
    }
}