"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequelize = void 0;
exports.connectToDB = connectToDB;
const sequelize_1 = require("sequelize");
const config_1 = require("./config");
const logger_1 = __importDefault(require("./logger"));
exports.sequelize = new sequelize_1.Sequelize(config_1.POSTGRES_DB_URL, {
    dialect: "postgres",
    logging: false,
    dialectOptions: {
        multipleStatements: true,
    },
});
async function connectToDB() {
    try {
        await exports.sequelize.authenticate();
        logger_1.default.info("Connection has been established successfully.");
        // Sync all models that are not yet in the database
        await exports.sequelize.sync();
    }
    catch (err) {
        logger_1.default.error("Unable to connect to the database:", err);
    }
}
//# sourceMappingURL=db.js.map