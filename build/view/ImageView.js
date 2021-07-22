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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageView = void 0;
require("reflect-metadata");
const inversify_1 = require("inversify");
const types_1 = require("../types");
const config_1 = __importDefault(require("../config"));
const NotFound_1 = require("../exception/NotFound");
let ImageView = class ImageView {
    constructor(imageController) {
        this.imageController = imageController;
    }
    fetchImageById(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let image = yield this.imageController.fetchImageById(request.params.id);
                return response.status(200).send(image);
            }
            catch (exception) {
                if (exception instanceof NotFound_1.NotFound) {
                    return response.status(404).send();
                }
                else {
                    return response.status(500).send(exception);
                }
            }
        });
    }
    fetchImages(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('fetch images');
            let limit = request.body.limit;
            let offset = request.body.offset;
            if (limit === undefined) {
                limit = config_1.default.pagination.defaultSize;
            }
            if (offset === undefined) {
                offset = 0;
            }
            let imagesWithPath = yield this.imageController.fetchImagesWithPath(offset, limit);
            return response.status(200).send(imagesWithPath);
        });
    }
    createImage(request, response) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (request.files !== undefined) {
                let data = (_a = request.files['image']) === null || _a === void 0 ? void 0 : _a.data;
                if (data === undefined) {
                    return response.status(400).send();
                }
                else {
                    let image = yield this.imageController.createImage(data);
                    return response.status(201).send(image);
                }
            }
            else {
                return response.status(400).send();
            }
        });
    }
    fetchNumberOfImages(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('fetchNumberOfImages');
            let numberOfImages = yield this.imageController.fetcNumberOfImages();
            return response.status(200).send(numberOfImages);
        });
    }
};
ImageView = __decorate([
    inversify_1.injectable(),
    __param(0, inversify_1.inject(types_1.TYPES.PRODUCT_IMAGE_CONTROLLER))
], ImageView);
exports.ImageView = ImageView;
