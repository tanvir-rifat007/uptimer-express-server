"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PORT = exports.CLIENT_URL = exports.SENDER_EMAIL_PASSWORD = exports.SENDER_EMAIL = exports.JWT_TOKEN = exports.SECRET_KEY_TWO = exports.SECRET_KEY_ONE = exports.NODE_ENV = exports.POSTGRES_DB_URL = void 0;
require("dotenv/config");
const env = process.env;
exports.POSTGRES_DB_URL = env.POSTGRES_DB_URL;
exports.NODE_ENV = env.NODE_ENV;
exports.SECRET_KEY_ONE = env.SECRET_KEY_ONE;
exports.SECRET_KEY_TWO = env.SECRET_KEY_TWO;
exports.JWT_TOKEN = env.JWT_TOKEN;
exports.SENDER_EMAIL = env.SENDER_EMAIL;
exports.SENDER_EMAIL_PASSWORD = env.SENDER_EMAIL_PASSWORD;
exports.CLIENT_URL = env.CLIENT_URL;
exports.PORT = env.PORT;
//# sourceMappingURL=config.js.map