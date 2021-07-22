"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inversify_config_1 = require("../inversify.config");
const types_1 = require("../types");
const router = express_1.Router();
const userAuthorizer = inversify_config_1.myContainer.get(types_1.TYPES.USER_AUTHORIZER);
const adminAuthorizer = inversify_config_1.myContainer.get(types_1.TYPES.ADMIN_AUTHORIZER);
router.get('/summaries', userAuthorizer.authorize, adminAuthorizer.authorize, (request, response) => {
    inversify_config_1.myContainer.get(types_1.TYPES.PRODUCT_VIEW).fetchProducts(request, response);
});
router.get('/summaries/count', userAuthorizer.authorize, adminAuthorizer.authorize, (request, response) => {
    inversify_config_1.myContainer.get(types_1.TYPES.PRODUCT_VIEW).fetchProductsCount(request, response);
});
router.post('/', userAuthorizer.authorize, adminAuthorizer.authorize, (request, response) => {
    inversify_config_1.myContainer.get(types_1.TYPES.PRODUCT_VIEW).createProduct(request, response);
});
router.get('/:id', userAuthorizer.authorize, adminAuthorizer.authorize, (request, response) => {
    inversify_config_1.myContainer.get(types_1.TYPES.PRODUCT_VIEW).fetchProductDetailById(request, response);
});
router.put('/:id', userAuthorizer.authorize, adminAuthorizer.authorize, (request, response) => {
    inversify_config_1.myContainer.get(types_1.TYPES.PRODUCT_VIEW).updateProduct(request, response);
});
exports.default = router;
