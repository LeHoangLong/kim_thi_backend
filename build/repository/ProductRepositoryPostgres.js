"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductRepositoryPostgres = void 0;
const inversify_1 = require("inversify");
const NotFound_1 = require("../exception/NotFound");
const types_1 = require("../types");
var PgError = require("pg-error");
let ProductRepositoryPostgres = class ProductRepositoryPostgres {
    constructor(client, connectionFactory) {
        this.client = client;
        this.connectionFactory = connectionFactory;
    }
    createProduct(product) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret;
            yield this.connectionFactory.getConnection(this, (connection) => __awaiter(this, void 0, void 0, function* () {
                var results = yield connection.query(`
                INSERT INTO "product" (
                    serial_number, name, rank, avatar_id
                ) VALUES (
                    $1, $2, $3, $4
                ) RETURNING id, created_time, is_deleted
            `, [product.serialNumber, product.name, product.rank, product.avatarId]);
                let newProduct = Object.assign({}, product);
                newProduct.id = results.rows[0].id;
                newProduct.serialNumber = product.serialNumber;
                newProduct.createdTimeStamp = results.rows[0].created_time;
                newProduct.isDeleted = results.rows[0].is_deleted;
                ret = newProduct;
            }));
            return ret;
        });
    }
    deleteProduct(id) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = 0;
            yield this.connectionFactory.getConnection(this, (connection) => __awaiter(this, void 0, void 0, function* () {
                let results = yield connection.query(`
            UPDATE "product" SET is_deleted = TRUE WHERE id = $1
            `, [id]);
                ret = results.rowCount;
            }));
            return ret;
        });
    }
    _jsonToProduct(json) {
        return {
            id: json['id'],
            serialNumber: json['serial_number'],
            name: json['name'],
            isDeleted: json['is_deleted'],
            avatarId: json['avatar_id'],
            createdTimeStamp: json['created_time'],
            rank: json['rank'],
        };
    }
    fetchProducts(offset, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            var results = yield this.client.query(`
            SELECT 
                id, serial_number, name, is_deleted, avatar_id,
                rank, created_time
            FROM "product"
            WHERE is_deleted = FALSE
            ORDER BY created_time DESC
            LIMIT $1
            OFFSET $2
        `, [limit, offset]);
            let products = [];
            for (let i = 0; i < results.rows.length; i++) {
                let result = results.rows[i];
                products.push(this._jsonToProduct(result));
            }
            return products;
        });
    }
    fetchNumberOfProducts() {
        return __awaiter(this, void 0, void 0, function* () {
            var result = yield this.client.query(`
            SELECT COUNT(*) FROM "product" WHERE is_deleted = FALSE
        `);
            return result.rows[0].count;
        });
    }
    fetchProductById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            var result = yield this.client.query(`
            SELECT 
                id, serial_number, name, is_deleted, avatar_id,
                rank, created_time
            FROM "product"
            WHERE is_deleted = FALSE AND id = $1
        `, [id]);
            if (result.rowCount == 0) {
                throw new NotFound_1.NotFound("product", "id", id.toString());
            }
            else {
                let row = result.rows[0];
                return {
                    id: row['id'],
                    serialNumber: row['serial_number'],
                    name: row['name'],
                    isDeleted: row['is_deleted'],
                    avatarId: row['avatar_id'],
                    createdTimeStamp: row['created_time'],
                    rank: row['rank'],
                };
            }
        });
    }
    fetchProductsCountWithName(name) {
        return __awaiter(this, void 0, void 0, function* () {
            let response = yield this.client.query(`
            SELECT COUNT(*) 
            FROM "product" 
            WHERE name LIKE $1 AND is_deleted = FALSE
        `, [`%${name}%`]);
            return response.rows[0].count;
        });
    }
    findProductsByName(name, offset, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            let response = yield this.client.query(`
            SELECT 
                id, serial_number, name, is_deleted, avatar_id,
                rank, created_time
            FROM "product"
            WHERE name LIKE $1 AND is_deleted = FALSE
            ORDER BY rank DESC, created_time DESC
            LIMIT $2
            OFFSET $3
        `, [`%${name}%`, limit, offset]);
            let ret = [];
            for (let i = 0; i < response.rows.length; i++) {
                let result = response.rows[i];
                ret.push(this._jsonToProduct(result));
            }
            return ret;
        });
    }
    fetchProductsByCategory(category, limit, offset) {
        return __awaiter(this, void 0, void 0, function* () {
            let response = yield this.client.query(`
        SELECT 
            id, serial_number, name, is_deleted, avatar_id,
            rank, created_time
        FROM "product" INNER JOIN "product_category" cat
        WHERE cat.category = $1 AND is_deleted = FALSE
        ORDER BY rank DESC, created_time DESC
        LIMIT $2
        OFFSET $3
        `, [category, limit, offset]);
            let ret = [];
            for (let i = 0; i < response.rows.length; i++) {
                let result = response.rows[i];
                ret.push(this._jsonToProduct(result));
            }
            return ret;
        });
    }
    fetchProductCategories(productId) {
        return __awaiter(this, void 0, void 0, function* () {
            let response = yield this.client.query(`
            SELECT 
                category
            FROM "product_category"
            WHERE product_id = $1
        `, [productId]);
            let ret = [];
            for (let i = 0; i < response.rows.length; i++) {
                let result = response.rows[i];
                ret.push(this._jsonToProductCategory(result, productId));
            }
            return ret;
        });
    }
    createProductCategory(productId, categories) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = [];
            for (let i = 0; i < categories.length; i++) {
                yield this.client.query(`
                INSERT INTO "product_product_category" (
                    category, 
                    product_id
                ) VALUES ($1, $2)
            `, [categories[i], productId]);
                ret.push({
                    category: categories[i],
                });
            }
            return ret;
        });
    }
    _jsonToProductCategory(json, productId) {
        return {
            category: json['category'],
        };
    }
    updateProductCategories(productId, categories) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = [];
            yield this.connectionFactory.getConnection(this, (connection) => __awaiter(this, void 0, void 0, function* () {
                yield this.client.query(`
                DELETE FROM "product_product_category" WHERE product_id = $1
            `, [productId]);
                ret = yield this.createProductCategory(productId, categories);
            }));
            return ret;
        });
    }
};
ProductRepositoryPostgres = __decorate([
    inversify_1.injectable(),
    __param(0, inversify_1.inject(types_1.TYPES.POSTGRES_DRIVER)),
    __param(1, inversify_1.inject(types_1.TYPES.CONNECTION_FACTORY))
], ProductRepositoryPostgres);
exports.ProductRepositoryPostgres = ProductRepositoryPostgres;
