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
exports.MockProductRepository = void 0;
const NotFound_1 = require("../../exception/NotFound");
class MockProductRepository {
    constructor() {
        this.notFoundId = [];
        this.products = new Map();
    }
    fetchAllCategories(limit, offset) {
        throw new Error("Method not implemented.");
    }
    deleteProductCategories(productId) {
        throw new Error("Method not implemented.");
    }
    updateProductCategories(productId, categories) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = [];
            for (let i = 0; i < categories.length; i++) {
                ret.push({
                    category: categories[i],
                });
            }
            return ret;
        });
    }
    fetchProductsCountWithName(name) {
        throw new Error("Method not implemented.");
    }
    findProductsByName(name, offset, limit) {
        throw new Error("Method not implemented.");
    }
    fetchProductCategories(productId) {
        return __awaiter(this, void 0, void 0, function* () {
            return [
                {
                    category: "cat_1",
                },
                {
                    category: "cat_2",
                },
            ];
        });
    }
    fetchProductsByCategory(category, limit, offset) {
        throw new Error("Method not implemented.");
    }
    createProductCategory(productId, categories) {
        throw new Error("Method not implemented.");
    }
    createProduct(product) {
        return __awaiter(this, void 0, void 0, function* () {
            if (product.id === null) {
                product.id = this.products.size;
            }
            this.products.set(product.id, product);
            return product;
        });
    }
    deleteProduct(id) {
        return __awaiter(this, void 0, void 0, function* () {
            this.products.delete(id);
            return 1;
        });
    }
    fetchNumberOfProducts() {
        return __awaiter(this, void 0, void 0, function* () {
            return 15;
        });
    }
    fetchProductById(productId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.notFoundId.indexOf(productId) != -1) {
                throw new NotFound_1.NotFound("product", "id", productId.toString());
            }
            return {
                id: productId,
                serialNumber: productId.toString(),
                name: 'name_' + productId,
                isDeleted: false,
                avatarId: '0',
                createdTimeStamp: new Date(),
                rank: 0,
            };
        });
    }
    fetchProducts(offset, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = [];
            for (let i = 0; i < limit; i++) {
                ret.push({
                    id: i + offset,
                    serialNumber: (i + offset).toString(),
                    name: 'name_' + (i + offset).toString(),
                    isDeleted: false,
                    avatarId: '0',
                    createdTimeStamp: new Date(),
                    rank: 0,
                });
            }
            return ret;
        });
    }
}
exports.MockProductRepository = MockProductRepository;
