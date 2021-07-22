"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotFound = void 0;
class NotFound {
    constructor(modelName, keyName, keyValue) {
        this.modelName = modelName;
        this.keyName = keyName;
        this.keyValue = keyValue;
    }
    toString() {
        return `Model ${this.modelName} does not have item with field ${this.keyName} and value ${this.keyValue}`;
    }
}
exports.NotFound = NotFound;
