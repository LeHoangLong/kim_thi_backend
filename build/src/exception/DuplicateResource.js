"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DuplicateResource = void 0;
var DuplicateResource = /** @class */ (function () {
    function DuplicateResource(modelName, keyName, keyValue) {
        this.modelName = modelName;
        this.keyName = keyName;
        this.keyValue = keyValue;
    }
    DuplicateResource.prototype.toString = function () {
        return "Model " + this.modelName + " already have items with field " + this.keyName + " and value " + this.keyValue;
    };
    return DuplicateResource;
}());
exports.DuplicateResource = DuplicateResource;
