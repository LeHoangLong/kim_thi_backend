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
exports.ProductCategoryRepositoryPostgres = void 0;
const inversify_1 = require("inversify");
const types_1 = require("../types");
let ProductCategoryRepositoryPostgres = class ProductCategoryRepositoryPostgres {
    constructor(connectionFactory) {
        this.connectionFactory = connectionFactory;
    }
    fetchAllCategories(limit, offset) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = [];
            yield this.connectionFactory.getConnection(this, (connection) => __awaiter(this, void 0, void 0, function* () {
                let response = yield connection.query(`
            SELECT 
            category
            FROM "product_category"
            ORDER BY created_time DESC
            LIMIT $1
            OFFSET $2
            `, [limit, offset]);
                for (let i = 0; i < response.rows.length; i++) {
                    ret.push(this._jsonToProductCategory(response.rows[i]));
                }
            }));
            return ret;
        });
    }
    createProductCategory(category) {
        return __awaiter(this, void 0, void 0, function* () {
            let result;
            yield this.connectionFactory.getConnection(this, (connection) => __awaiter(this, void 0, void 0, function* () {
                let response = yield connection.query(`
                INSERT INTO "product_category" (category)
                VALUES ($1)
            `, [category]);
                result = this._jsonToProductCategory(response.rows[0]);
            }));
            return result;
        });
    }
    deleteProductCategory(category) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = 0;
            yield this.connectionFactory.getConnection(this, (connection) => __awaiter(this, void 0, void 0, function* () {
                let response = yield connection.query(`
                DELETE FROM "product_category" WHERE category = $1
            `, [category]);
                result = response.rowCount;
            }));
            return result;
        });
    }
    fetchProductCategoriesByProductId(productId) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = [];
            yield this.connectionFactory.getConnection(this, (connection) => __awaiter(this, void 0, void 0, function* () {
                let response = yield connection.query(`
                SELECT category
                FROM "product_product_category" 
                WHERE product_id = $1
            `, [productId]);
                for (let i = 0; i < response.rows.length; i++) {
                    result.push(this._jsonToProductCategory(response.rows[i]));
                }
            }));
            return result;
        });
    }
    _jsonToProductCategory(json) {
        return {
            category: json['category'],
        };
    }
};
ProductCategoryRepositoryPostgres = __decorate([
    inversify_1.injectable(),
    __param(0, inversify_1.inject(types_1.TYPES.CONNECTION_FACTORY))
], ProductCategoryRepositoryPostgres);
exports.ProductCategoryRepositoryPostgres = ProductCategoryRepositoryPostgres;
