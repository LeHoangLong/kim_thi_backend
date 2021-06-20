"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateContext = void 0;
//must be at the front of middleware chain
function generateContext(request, response, next) {
    request.context = {};
    next();
}
exports.generateContext = generateContext;
