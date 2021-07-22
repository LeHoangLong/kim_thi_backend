"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inversify_config_1 = require("../inversify.config");
const types_1 = require("../types");
const router = express_1.Router();
router.get('/count', (request, response) => {
    inversify_config_1.myContainer.get(types_1.TYPES.IMAGE_VIEW).fetchNumberOfImages(request, response);
});
router.get('/:id', (request, response) => {
    inversify_config_1.myContainer.get(types_1.TYPES.IMAGE_VIEW).fetchImageById(request, response);
});
router.get('/$', (request, response) => {
    inversify_config_1.myContainer.get(types_1.TYPES.IMAGE_VIEW).fetchImages(request, response);
});
router.post('/', (request, response) => {
    inversify_config_1.myContainer.get(types_1.TYPES.IMAGE_VIEW).createImage(request, response);
});
exports.default = router;
