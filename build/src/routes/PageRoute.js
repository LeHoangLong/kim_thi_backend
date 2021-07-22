"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PageView_1 = require("../view/PageView");
const router = express_1.Router();
router.get('/search', PageView_1.productSearchPage);
router.get('/products/:productId', PageView_1.productDetailPage);
router.get('/', PageView_1.productSummaryPage);
exports.default = router;
