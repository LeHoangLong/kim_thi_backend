"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var inversify_config_1 = require("../inversify.config");
var types_1 = require("../types");
var router = express_1.Router();
var userAuthorizer = inversify_config_1.myContainer.get(types_1.TYPES.USER_AUTHORIZER);
router.get('/', userAuthorizer.authorize, function (request, response) {
    inversify_config_1.myContainer.get(types_1.TYPES.USER_VIEW).getUserView(request, response);
});
router.post('/login', function (request, response) {
    inversify_config_1.myContainer.get(types_1.TYPES.USER_VIEW).loginView(request, response);
});
exports.default = router;
