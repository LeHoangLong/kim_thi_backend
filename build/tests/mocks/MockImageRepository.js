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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockImageRepository = void 0;
const NotFound_1 = require("../../exception/NotFound");
class MockImageRepository {
    constructor(shouldCreateIfNotFound = true) {
        this.shouldCreateIfNotFound = shouldCreateIfNotFound;
        this.createdImages = new Map();
    }
    fetchImageById(imageId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.createdImages.has(imageId)) {
                return this.createdImages.get(imageId);
            }
            else if (this.shouldCreateIfNotFound) {
                return {
                    id: imageId,
                    isDeleted: false,
                    createdTimeStamp: new Date(),
                };
            }
            else {
                throw new NotFound_1.NotFound("image", "id", imageId);
            }
        });
    }
    createImage(imageId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (imageId === undefined) {
                imageId = this.createdImages.size.toString();
            }
            let newImage = {
                id: imageId,
                createdTimeStamp: new Date(),
                isDeleted: false,
            };
            this.createdImages.set(imageId, newImage);
            return newImage;
        });
    }
    deleteImage(imageId) {
        throw "";
    }
    fetchImages(offset, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = [];
            if (this.shouldCreateIfNotFound) {
                for (let i = 0; i < limit; i++) {
                    ret.push({
                        id: (i + offset).toString(),
                        isDeleted: false,
                        createdTimeStamp: new Date(),
                    });
                }
            }
            else {
                let sortedImaged = Array.from(this.createdImages.values());
                sortedImaged.sort((a, b) => (b.createdTimeStamp.getTime() - a.createdTimeStamp.getTime()));
                return sortedImaged.slice(offset, offset + limit);
            }
            return ret;
        });
    }
    fetchNumberOfImages() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.createdImages.size;
        });
    }
}
exports.MockImageRepository = MockImageRepository;
