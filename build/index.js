"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const Context_1 = require("./middleware/Context");
const types_1 = require("./types");
const UserRoute_1 = __importDefault(require("./routes/UserRoute"));
const ProductRoute_1 = __importDefault(require("./routes/ProductRoute"));
const ImageRoute_1 = __importDefault(require("./routes/ImageRoute"));
const PageRoute_1 = __importDefault(require("./routes/PageRoute"));
const inversify_config_1 = require("./inversify.config");
const express_fileupload_1 = __importDefault(require("express-fileupload"));
var migrate = require('migrate');
var path = require('path');
migrate.load({
    stateStore: './migrations-state/.migrate-development'
}, function (err, set) {
    if (err) {
        throw err;
    }
    else {
        set.up(function () { });
    }
});
const app = express_1.default();
const port = 80;
const jwtAuthentication = inversify_config_1.myContainer.get(types_1.TYPES.JWT_AUTHENTICATOR);
app.set('view engine', 'ejs');
app.use(express_1.default.json());
app.use(cookie_parser_1.default());
app.use(Context_1.generateContext);
app.use(express_fileupload_1.default({
    limits: { fileSize: 50 * 1024 * 1024 },
}));
app.use((req, res, next) => {
    if (!req.path.match(/^(\/?)user\/(login|signup)(\/?)/)) {
        jwtAuthentication.authenticate(req, res, next);
    }
    else {
        next();
    }
});
app.set('views', path.join(__dirname, 'pages/'));
app.use('/backend/user', UserRoute_1.default);
app.use('/backend/products', ProductRoute_1.default);
app.use('/backend/images', ImageRoute_1.default);
app.use('/', PageRoute_1.default);
app.listen(port, () => {
    return console.log(`server is listening on ${port}`);
});
