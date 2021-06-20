"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var cookie_parser_1 = __importDefault(require("cookie-parser"));
var Context_1 = require("./middleware/Context");
var types_1 = require("./types");
var UserRoute_1 = __importDefault(require("./routes/UserRoute"));
var inversify_config_1 = require("./inversify.config");
var app = express_1.default();
var port = 80;
var jwtAuthentication = inversify_config_1.myContainer.get(types_1.TYPES.JWT_AUTHENTICATOR);
app.use(express_1.default.json());
app.use(cookie_parser_1.default());
app.use(Context_1.generateContext);
app.use(function (req, res, next) {
    if (!req.path.match(/^(\/?)user\/(login|signup)(\/?)/)) {
        jwtAuthentication.authenticate(req, res, next);
    }
    else {
        next();
    }
});
app.use('/user', UserRoute_1.default);
app.listen(port, function () {
    return console.log("server is listening on " + port);
});
