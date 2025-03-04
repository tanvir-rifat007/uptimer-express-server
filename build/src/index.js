"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const server_1 = __importDefault(require("./server/server"));
const db_1 = require("./server/db");
const init = async () => {
    const app = (0, express_1.default)();
    const server = new server_1.default(app);
    (0, db_1.connectToDB)().then(() => {
        server.start();
    });
};
init();
//# sourceMappingURL=index.js.map