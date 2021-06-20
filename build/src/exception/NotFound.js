"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotFound = void 0;
var NotFound = /** @class */ (function () {
    function NotFound(modelName, keyName, keyValue) {
        this.modelName = modelName;
        this.keyName = keyName;
        this.keyValue = keyValue;
    }
    NotFound.prototype.toString = function () {
        return "Model " + this.modelName + " does not have item with field " + this.keyName + " and value " + this.keyValue;
    };
    return NotFound;
}());
exports.NotFound = NotFound;
