"use strict";
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
exports.MockProductPriceRepository = void 0;
const ProductPrice_1 = require("../../model/ProductPrice");
class MockProductPriceRepository {
    constructor(pricesByProductId = new Map()) {
        this.pricesByProductId = pricesByProductId;
    }
    fetchPricesByProductId(productId) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = [];
            for (let i = 0; i < 2; i++) {
                ret.push(yield this.fetchPriceById(i));
            }
            return ret;
        });
    }
    fetchPriceById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return {
                id: id,
                unit: ProductPrice_1.EProductUnit.KG,
                isDeleted: false,
                defaultPrice: 100,
                priceLevels: [],
                isDefault: id == 0,
            };
        });
    }
    fetchDefaultPriceByProductId(producId) {
        return __awaiter(this, void 0, void 0, function* () {
            return {
                id: 0,
                unit: ProductPrice_1.EProductUnit.KG,
                isDeleted: false,
                defaultPrice: 100,
                priceLevels: [],
                isDefault: true,
            };
        });
    }
    deletePrice(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return 1;
        });
    }
    createProductPrice(productId) {
        return __awaiter(this, void 0, void 0, function* () {
            this.pricesByProductId.set(productId, [
                {
                    id: 0,
                    unit: ProductPrice_1.EProductUnit.KG,
                    isDeleted: false,
                    defaultPrice: 101,
                    priceLevels: [{
                            minQuantity: 15,
                            price: 50
                        }],
                    isDefault: true,
                }, {
                    id: 1,
                    unit: ProductPrice_1.EProductUnit.KG,
                    isDeleted: false,
                    defaultPrice: 101,
                    priceLevels: [{
                            minQuantity: 15,
                            price: 50
                        }],
                    isDefault: false,
                },
            ]);
            let ret = JSON.parse(JSON.stringify(this.pricesByProductId.get(productId)));
            return ret;
        });
    }
}
exports.MockProductPriceRepository = MockProductPriceRepository;
