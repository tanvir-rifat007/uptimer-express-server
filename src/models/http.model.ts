import { IHeartbeat } from "@src/interfaces/heartbeat.interface";
import { sequelize } from "@src/server/db";
import { DataTypes, ModelDefined, Optional } from "sequelize";

type HttpAttributes = Optional<IHeartbeat, "id">;

const HttpModel = sequelize.define(
  "http_heartbeats",
  {
    monitorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.SMALLINT,
      allowNull: false,
    },
    code: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    message: {
      type: DataTypes.STRING,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    reqHeaders: {
      type: DataTypes.TEXT,
    },
    resHeaders: {
      type: DataTypes.TEXT,
    },
    reqBody: {
      type: DataTypes.TEXT,
    },
    resBody: {
      type: DataTypes.TEXT,
    },
    responseTime: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    indexes: [
      {
        unique: false,
        fields: ["monitorId"],
      },
    ],
  }
) as ModelDefined<IHeartbeat, HttpAttributes>;

export { HttpModel };
