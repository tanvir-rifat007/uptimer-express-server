import { ISSLMonitorDocument } from "@src/interfaces/ssl.interface";
import { sequelize } from "@src/server/db";
import { DataTypes, ModelDefined, Optional } from "sequelize";

type SSLAttributes = Optional<ISSLMonitorDocument, "id">;

const SSLModel: ModelDefined<ISSLMonitorDocument, SSLAttributes> =
  sequelize.define(
    "ssl_monitors",
    {
      notificationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.SMALLINT,
        allowNull: false,
      },
      active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      frequency: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 30,
      },
      alertThreshold: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      url: {
        type: DataTypes.STRING,
      },
      info: {
        type: DataTypes.TEXT,
      },
    },
    {
      indexes: [
        {
          unique: false,
          fields: ["userId"],
        },
      ],
    }
  ) as ModelDefined<ISSLMonitorDocument, SSLAttributes>;

export { SSLModel };
