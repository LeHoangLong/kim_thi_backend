"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductImageController = void 0;
const inversify_1 = require("inversify");
const types_1 = require("../types");
let ProductImageController = class ProductImageController {
    constructor(imageRepository, binaryRepository) {
        this.imageRepository = imageRepository;
        this.binaryRepository = binaryRepository;
    }
    createImage(data) {
        return __awaiter(this, void 0, void 0, function* () {
            let image = yield this.imageRepository.createImage();
            try {
                yield this.binaryRepository.save("product_images", image.id, data);
                return Object.assign(Object.assign({}, image), { path: this.binaryRepository.getPath("product_images", image.id) });
            }
            catch (exception) {
                this.imageRepository.deleteImage(image.id);
                throw exception;
            }
        });
    }
    fetchImageWithPath(imageId) {
        return __awaiter(this, void 0, void 0, function* () {
            let image = yield this.imageRepository.fetchImageById(imageId);
            let path = yield this.binaryRepository.getPath("product_images", image.id);
            return Object.assign(Object.assign({}, image), { path: path });
        });
    }
    fetchImagesWithPath(offset, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            let images = yield this.imageRepository.fetchImages(offset, limit);
            let imagesWithPath = [];
            for (let i = 0; i < images.length; i++) {
                let image = images[i];
                let path = yield this.binaryRepository.getPath("product_images", image.id);
                imagesWithPath.push(Object.assign(Object.assign({}, image), { path: path }));
            }
            return imagesWithPath;
        });
    }
    fetcNumberOfImages() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.imageRepository.fetchNumberOfImages();
        });
    }
    fetchImageById(imageId) {
        return __awaiter(this, void 0, void 0, function* () {
            let image = yield this.imageRepository.fetchImageById(imageId);
            let path = yield this.binaryRepository.getPath("product_images", image.id);
            return Object.assign(Object.assign({}, image), { path });
        });
    }
};
ProductImageController = __decorate([
    inversify_1.injectable(),
    __param(0, inversify_1.inject(types_1.TYPES.IMAGE_REPOSITORY)),
    __param(1, inversify_1.inject(types_1.TYPES.BINARY_REPOSITORY))
], ProductImageController);
exports.ProductImageController = ProductImageController;
