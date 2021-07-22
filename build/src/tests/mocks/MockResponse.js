"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockResponse = void 0;
class MockResponse {
    send(body) {
        return this;
    }
    status(status) {
        return this;
    }
}
exports.MockResponse = MockResponse;
