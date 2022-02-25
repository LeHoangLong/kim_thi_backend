import { inject, injectable } from "inversify";
import { Pool, PoolClient, QueryResult } from "pg";
import SQL from "sql-template-strings";
import { NotFound } from "../exception/NotFound";
import { Product } from "../model/Product";
import { ProductCategory } from "../model/ProductCategory";
import { PostgresConnectionFactory } from "../services/PostgresConnectionFactory";
import { TYPES } from "../types";
import { IProductRepository, ProductSearchFilter } from "./IProductRepository";

@injectable()
export class ProductRepositoryPostgres implements IProductRepository{
    constructor(
        @inject(TYPES.POSTGRES_DRIVER) private client: Pool,
        @inject(TYPES.CONNECTION_FACTORY) private connectionFactory: PostgresConnectionFactory,
    ) {

    }

    async createProduct(product: Product): Promise<Product> {
        let ret : Product
        await this.connectionFactory.startTransaction(this, [], async () => {
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
                let results = await connection.query(query);
                let newProduct = {...product};
                newProduct.id = results.rows[0].id;
                newProduct.serialNumber = product.serialNumber;
                newProduct.createdTimeStamp = results.rows[0].created_time;
                newProduct.isDeleted = false;
                newProduct.wholesalePrices = product.wholesalePrices
                newProduct.imagesId = []
                ret = newProduct;

                for (let i = 0; i < product.imagesId.length; i++) {
                    let query = SQL`
                        INSERT INTO "product_image" (
                            product_id,
                            image_id
                        ) VALUES (
                            ${newProduct.id},
                            ${product.imagesId[i]}
                        )
                    `
                    await connection.query(query);
                    newProduct.imagesId.push(product.imagesId[i])
                }
            })
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

    private _jsonToProduct(json: any) : Product {
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
            imagesId: [],
        }

        if (json['image_id'] !== null) {
            newProduct.imagesId.push(json['image_id'])
        }

        return newProduct
    }  

    private _responseToProducts(results: QueryResult) : Product[] {
        let products : Product[] = [];
        for (let i = 0; i < results.rows.length; i++) {
            let result = results.rows[i];
            let product = this._jsonToProduct(result)
            let currentProduct = products.find(e => e.id === product.id)
            if (currentProduct === undefined) {
                products.push(product)
            } else if (product.imagesId.length > 0) {
                currentProduct.imagesId.push(product.imagesId[0])
            }
        }

        return products
    }

    private async _fetchProducts(offset: number, limit: number): Promise<Product[]> {
        let results = await this.client.query(`
            SELECT 
                p.*,
                pi.image_id
            FROM (
                SELECT 
                    id, serial_number, name, is_deleted, avatar_id,
                    rank, created_time, wholesale_prices, description
                FROM "product"
                WHERE is_deleted = FALSE
                ORDER BY created_time DESC
                LIMIT $1
                OFFSET $2
            ) p
            LEFT JOIN "product_image" pi
            ON p.id = pi.product_id
            ORDER BY p.created_time DESC
        `, [limit, offset])
        return this._responseToProducts(results)
    }

    async fetchNumberOfProducts(filter: ProductSearchFilter = {}): Promise<number> {
        let result: QueryResult<any>
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
        let result = await this.client.query(`
            SELECT 
                p.*, pi.image_id
            FROM (
                SELECT 
                    id, serial_number, name, is_deleted, avatar_id,
                    rank, created_time, wholesale_prices, description
                FROM "product"
                WHERE ($2=FALSE OR ($2=TRUE AND is_deleted = FALSE)) AND id = $1
            ) p
            LEFT JOIN "product_image" pi 
            ON p.id = pi.product_id
        `, [id, ignoreDeleted])
        if (result.rowCount == 0) {
            throw new NotFound("product", "id", id.toString())
        } else {
            let products = this._responseToProducts(result)
            return products[0]
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

    async _fetchProductsByName(name: string, offset: number, limit: number) : Promise<Product[]> {
        let response = await this.client.query(`
            SELECT 
                p.*,
                pi.product_id
            FROM (
                SELECT 
                    id, serial_number, name, is_deleted, avatar_id,
                    rank, created_time, wholesale_prices, description
                FROM "product"
                WHERE LOWER(name) LIKE $1 AND is_deleted = FALSE
                ORDER BY rank DESC, created_time DESC
                LIMIT $2
                OFFSET $3
            ) p
            LEFT JOIN "product_image" pi
            ON p.id = pi.product_id
            ORDER BY p.rank DESC, p.created_time DESC
        `, [`%${name}%`.toLowerCase(), limit, offset]);

        return this._responseToProducts(response)
    }
    
    async _fetchProductsByCategory(category: string, limit: number, offset: number) : Promise<Product[]> {
        let ret : Product[] = [];
        await this.connectionFactory.getConnection(this, async (connection: PoolClient) => {
            let response: QueryResult<any>;
            response = await connection.query(`
                SELECT
                    p.*,
                    pi.*
                FROM (
                    SELECT 
                        id, serial_number, name, is_deleted, avatar_id,
                        rank, created_time, wholesale_prices, description
                    FROM "product" INNER JOIN "product_product_category" cat
                    ON is_deleted = FALSE AND cat.product_id = id AND cat.category = $1
                    ORDER BY rank DESC, created_time DESC
                    LIMIT $2
                    OFFSET $3
                ) p
                LEFT JOIN "product_image" pi
                ON p.id = pi.product_id
                ORDER BY p.rank DESC, p.created_time DESC
            `, [category, limit, offset]);

            ret = this._responseToProducts(response)
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

    async _fetchProductsWithNameAndProduct(
        name: string,
        category: string,
        offset: number,
        limit: number,
    ) : Promise<Product[]> {
        let ret: Product[] = []
        await this.connectionFactory.getConnection(this, async (connection: PoolClient) => {
            let response = await connection.query(`
                SELECT
                    p.*,
                    pi.*
                FROM (
                    SELECT 
                        p.*,
                        cat.category
                    FROM (
                        SELECT 
                            id, serial_number, name, is_deleted, avatar_id,
                            rank, created_time, wholesale_prices, description
                        FROM "product"
                        WHERE LOWER(name) LIKE LOWER($2) AND is_deleted = FALSE
                        ORDER BY rank DESC, created_time DESC
                    ) p
                    INNER JOIN "product_product_category" cat
                    ON  cat.product_id = p.id 
                        AND cat.category = $1
                    ORDER BY p.rank DESC, p.created_time DESC
                    LIMIT $3
                    OFFSET $4
                ) p 
                LEFT JOIN "product_image" pi
                ON p.id = pi.product_id
                ORDER BY p.rank DESC, p.created_time DESC
            `, [category, `%${name}%`, limit, offset]);
            ret = this._responseToProducts(response)
        });

        return ret
    }

    async fetchProducts(filter: ProductSearchFilter & {
        limit: number, 
        offset: number
    }) : Promise<Product[]> {
        let hasName = filter.name !== undefined  && filter.name.length > 0
        let hasCategory = filter.category !== undefined && filter.category.length > 0 
        if (hasCategory && hasName) {
            return this._fetchProductsWithNameAndProduct(
                filter.name!, 
                filter.category!, 
                filter.offset, 
                filter.limit
            )
        } else if (hasCategory && !hasName) {
            return this._fetchProductsByCategory(filter.category!, filter.limit, filter.offset)
        } else if (!hasCategory && hasName) {
            return this._fetchProductsByName(filter.name!, filter.offset, filter.limit)
        } else {
            return this._fetchProducts(filter.offset, filter.limit)
        }
    }
}