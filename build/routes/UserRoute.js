"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inversify_config_1 = require("../inversify.config");
const types_1 = require("../types");
const router = express_1.Router();
const userAuthorizer = inversify_config_1.myContainer.get(types_1.TYPES.USER_AUTHORIZER);
router.get('/', userAuthorizer.authorize, (request, response) => {
    inversify_config_1.myContainer.get(types_1.TYPES.USER_VIEW).getUserView(request, response);
});
router.post('/login', (request, response) => {
    inversify_config_1.myContainer.get(types_1.TYPES.USER_VIEW).loginView(request, response);
});
exports.default = router;
