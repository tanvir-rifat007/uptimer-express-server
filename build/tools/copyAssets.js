"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
fs_extra_1.default.copySync("src/emails", "build/src/emails");
//# sourceMappingURL=copyAssets.js.map