"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
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
exports.BinaryRepositoryFileSystem = void 0;
const fs_1 = __importDefault(require("fs"));
const inversify_1 = require("inversify");
let BinaryRepositoryFileSystem = class BinaryRepositoryFileSystem {
    save(namespace, id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            let path = this.getPath(namespace, id);
            let result = yield new Promise((resolve, reject) => {
                let splitPath = path.split('/');
                splitPath.pop();
                let joinedPath = splitPath.join("/");
                if (!fs_1.default.existsSync(joinedPath)) {
                    fs_1.default.mkdirSync(joinedPath);
                }
                fs_1.default.writeFile(path, data, { flag: 'w' }, (error) => {
                    if (error != null) {
                        resolve(true);
                    }
                    else {
                        resolve(false);
                    }
                });
            });
            return result;
        });
    }
    getPath(namespace, id) {
        return `public/products/images/${namespace}/${id}`;
    }
};
BinaryRepositoryFileSystem = __decorate([
    inversify_1.injectable()
], BinaryRepositoryFileSystem);
exports.BinaryRepositoryFileSystem = BinaryRepositoryFileSystem;
