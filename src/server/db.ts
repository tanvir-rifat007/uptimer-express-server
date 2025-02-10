import { Sequelize } from "sequelize";
import { POSTGRES_DB_URL } from "./config";
import logger from "./logger";

export const sequelize: Sequelize = new Sequelize(POSTGRES_DB_URL, {
  dialect: "postgres",
  logging: false,
  dialectOptions: {
    multipleStatements: true,
  },
});

export async function connectToDB(): Promise<void> {
  try {
    await sequelize.authenticate();
    logger.info("Connection has been established successfully.");

    // Sync all models that are not yet in the database
    await sequelize.sync();
  } catch (err) {
    logger.error("Unable to connect to the database:", err);
  }
}
