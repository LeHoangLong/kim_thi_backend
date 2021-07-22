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
exports.PriceRepositoryPostgres = void 0;
const inversify_1 = require("inversify");
const NotFound_1 = require("../exception/NotFound");
const types_1 = require("../types");
const PgError = require('pg-error');
let PriceRepositoryPostgres = class PriceRepositoryPostgres {
    constructor(client, connectionFactory) {
        this.client = client;
        this.connectionFactory = connectionFactory;
    }
    fetchPricesByProductId(productId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let results = yield this.client.query(`
                SELECT 
                    id, unit, default_price, product_id, is_default
                FROM "product_price"
                WHERE product_id = $1 AND is_deleted = FALSE
                ORDER BY id ASC
            `, [productId]);
                let ret = [];
                for (let i = 0; i < results.rowCount; i++) {
                    let result = results.rows[i];
                    let price = {
                        id: result['id'],
                        unit: result['unit'],
                        defaultPrice: result['default_price'],
                        isDeleted: false,
                        priceLevels: [],
                        isDefault: result['is_default']
                    };
                    let priceLevelResult = yield this.client.query(`
                    SELECT
                        min_quantity, price
                    FROM "product_price_level"
                    WHERE product_price_id = $1 AND is_deleted = FALSE
                `, [price.id]);
                    for (let i = 0; i < priceLevelResult.rowCount; i++) {
                        let priceLevelRow = priceLevelResult.rows[i];
                        price.priceLevels.push({
                            minQuantity: priceLevelRow.min_quantity,
                            price: priceLevelRow.price
                        });
                    }
                    ret.push(price);
                }
                return ret;
            }
            catch (exception) {
                throw exception.message;
            }
        });
    }
    fetchPriceById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let results = yield this.client.query(`
                SELECT 
                    id, unit, default_price, product_id, is_default,
                    pl.min_quantity as price_level_min_quantity, pl.price as product_price_level
                FROM "product_price"
                INNER JOIN "product_price_level" pl
                WHERE id = $1 AND is_deleted = FALSE AND pl.product_price_id = id AND pl.is_deleted = FALSE
            `, [id]);
                if (results.rowCount == 0) {
                    throw new NotFound_1.NotFound("product_price", "id", id.toString());
                }
                else {
                    let result = results.rows[0];
                    let ret = {
                        id: result['id'],
                        unit: result['unit'],
                        defaultPrice: result['default_price'],
                        isDeleted: false,
                        priceLevels: [],
                        isDefault: result['is_default']
                    };
                    for (let i = 0; i < results.rowCount; i++) {
                        ret.priceLevels.push({
                            minQuantity: results.rows[i].price_level_min_quantity,
                            price: results.rows[i].price_level_price
                        });
                    }
                    return ret;
                }
            }
            catch (exception) {
                throw exception.message;
            }
        });
    }
    fetchDefaultPriceByProductId(productId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                var result = yield this.client.query(`
                SELECT 
                    id, unit, default_price, product_id
                FROM "product_price"
                WHERE product_id = $1 AND is_deleted = FALSE AND is_default = TRUE
            `, [productId]);
                if (result.rowCount === 0) {
                    console.log('not found');
                    throw new NotFound_1.NotFound("product_price", "product_id", productId.toString());
                }
                else {
                    let row = result.rows[0];
                    let price = {
                        id: row['id'],
                        unit: row['unit'],
                        defaultPrice: row['default_price'],
                        isDeleted: false,
                        priceLevels: [],
                        isDefault: true
                    };
                    let priceLevelResult = yield this.client.query(`
                    SELECT
                        min_quantity, price
                    FROM "product_price_level"
                    WHERE product_price_id = $1 AND is_deleted = FALSE
                `, [price.id]);
                    for (let i = 0; i < priceLevelResult.rowCount; i++) {
                        let priceLevelRow = priceLevelResult.rows[i];
                        price.priceLevels.push({
                            minQuantity: priceLevelRow.min_quantity,
                            price: priceLevelRow.price
                        });
                    }
                    return price;
                }
            }
            catch (exception) {
                throw exception.message;
            }
        });
    }
    deletePrice(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                var result = yield this.client.query(`
                UPDATE "product_price" SET is_deleted = TRUE WHERE id = $1
            `, [id]);
                yield this.client.query(`
                UPDATE "product_price_level" SET is_deleted = TRUE WHERE product_price_id = $1
            `, [id]);
                return result.rowCount;
            }
            catch (exception) {
                throw exception.message;
            }
        });
    }
    createProductPrice(productId, prices) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = [];
            yield this.connectionFactory.getConnection(this, (connection) => __awaiter(this, void 0, void 0, function* () {
                for (let i = 0; i < prices.length; i++) {
                    let price = prices[i];
                    let results = yield connection.query(`
                    INSERT INTO "product_price" (
                        unit, 
                        default_price,
                        product_id,
                        is_default
                    ) VALUES (
                        $1, $2, $3, $4
                    ) RETURNING id
                `, [price.unit, price.defaultPrice, productId, price.isDefault]);
                    let newPrice = {
                        id: results.rows[0].id,
                        unit: price.unit,
                        defaultPrice: price.defaultPrice,
                        isDeleted: false,
                        priceLevels: [],
                        isDefault: price.isDefault,
                    };
                    for (let j = 0; j < price.priceLevels.length; j++) {
                        let priceLevel = price.priceLevels[j];
                        yield connection.query(`
                        INSERT INTO "product_price_level" (
                            product_price_id,
                            min_quantity,
                            price
                        ) VALUES (
                            $1, $2, $3
                        )
                    `, [newPrice.id, priceLevel.minQuantity, priceLevel.price]);
                        newPrice.priceLevels.push(priceLevel);
                    }
                    ret.push(newPrice);
                }
            }));
            return ret;
        });
    }
};
PriceRepositoryPostgres = __decorate([
    inversify_1.injectable(),
    __param(0, inversify_1.inject(types_1.TYPES.POSTGRES_DRIVER)),
    __param(1, inversify_1.inject(types_1.TYPES.CONNECTION_FACTORY))
], PriceRepositoryPostgres);
exports.PriceRepositoryPostgres = PriceRepositoryPostgres;
