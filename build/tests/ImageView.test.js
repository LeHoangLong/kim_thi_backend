"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const sinon_1 = __importDefault(require("sinon"));
const types_1 = require("../types");
const inversify_config_1 = require("../inversify.config");
const MockImageRepository_1 = require("./mocks/MockImageRepository");
const MockBinaryRepository_1 = require("./mocks/MockBinaryRepository");
const MockResponse_1 = require("./mocks/MockResponse");
const chai_1 = __importDefault(require("chai"));
describe('Product view test', function () {
    return __awaiter(this, void 0, void 0, function* () {
        let context = {};
        this.beforeEach(function () {
            let mockResponse = new MockResponse_1.MockResponse();
            var now = new Date();
            var clock = sinon_1.default.useFakeTimers(now);
            const mockImageRepository = new MockImageRepository_1.MockImageRepository();
            const mockBinaryRepository = new MockBinaryRepository_1.MockBinaryRepository();
            let imageRepository = inversify_config_1.myContainer.rebind(types_1.TYPES.IMAGE_REPOSITORY).toConstantValue(mockImageRepository);
            let binaryRepository = inversify_config_1.myContainer.rebind(types_1.TYPES.BINARY_REPOSITORY).toConstantValue(mockBinaryRepository);
            let imageView = inversify_config_1.myContainer.get(types_1.TYPES.IMAGE_VIEW);
            context.imageView = imageView;
            context.imageRepository = imageRepository;
            context.binaryRepository = mockBinaryRepository;
            context.response = mockResponse;
            context.statusSpy = sinon_1.default.spy(context.response, "status");
            context.sendSpy = sinon_1.default.spy(context.response, "send");
            context.now = now;
            context.response = mockResponse;
        });
        it('fetch images', function () {
            return __awaiter(this, void 0, void 0, function* () {
                let request = {
                    body: {
                        offset: 5,
                        limit: 2,
                    }
                };
                yield context.imageView.fetchImages(request, context.response);
                sinon_1.default.assert.calledOnceWithExactly(context.statusSpy, 200);
                sinon_1.default.assert.calledOnceWithExactly(context.sendSpy, [
                    {
                        id: '5',
                        isDeleted: false,
                        createdTimeStamp: context.now,
                        path: 'product_images_5'
                    },
                    {
                        id: '6',
                        isDeleted: false,
                        createdTimeStamp: context.now,
                        path: 'product_images_6'
                    }
                ]);
            });
        });
        it('create image', function () {
            return __awaiter(this, void 0, void 0, function* () {
                let request = {
                    files: {
                        image: {
                            data: Buffer.from([0, 1, 2]),
                        }
                    }
                };
                const mockImageRepository = new MockImageRepository_1.MockImageRepository(true);
                let imageRepository = inversify_config_1.myContainer.rebind(types_1.TYPES.IMAGE_REPOSITORY).toConstantValue(mockImageRepository);
                yield context.imageView.createImage(request, context.response);
                sinon_1.default.assert.calledOnceWithExactly(context.statusSpy, 201);
                sinon_1.default.assert.calledOnceWithExactly(context.sendSpy, {
                    id: '0',
                    isDeleted: false,
                    createdTimeStamp: context.now,
                    path: 'product_images_0'
                });
                chai_1.default.expect(context.binaryRepository.savedBinary.size).to.equals(1);
                chai_1.default.expect(context.binaryRepository.savedBinary.get('product_images_0').length).to.equals(3);
                chai_1.default.expect(context.binaryRepository.savedBinary.get('product_images_0')[0]).to.equals(0);
                chai_1.default.expect(context.binaryRepository.savedBinary.get('product_images_0')[1]).to.equals(1);
                chai_1.default.expect(context.binaryRepository.savedBinary.get('product_images_0')[2]).to.equals(2);
                let request_2 = {};
                let response_2 = new MockResponse_1.MockResponse();
                let response2_statusSpy = sinon_1.default.spy(response_2, "status");
                let response2_sendSpy = sinon_1.default.spy(response_2, "send");
                yield context.imageView.fetchNumberOfImages(request_2, response_2);
                sinon_1.default.assert.calledOnceWithExactly(response2_statusSpy, 200);
                sinon_1.default.assert.calledOnceWithExactly(response2_sendSpy, 1);
            });
        });
    });
});
