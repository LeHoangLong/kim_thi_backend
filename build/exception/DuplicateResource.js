"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DuplicateResource = void 0;
class DuplicateResource {
    constructor(modelName, keyName, keyValue) {
        this.modelName = modelName;
        this.keyName = keyName;
        this.keyValue = keyValue;
    }
    toString() {
        return `Model ${this.modelName} already have items with field ${this.keyName} and value ${this.keyValue}`;
    }
}
exports.DuplicateResource = DuplicateResource;
