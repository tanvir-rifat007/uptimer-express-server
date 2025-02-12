import { INotificationDocument } from "@src/interfaces/notification.interface";
import { sequelize } from "@src/server/db";
import { DataTypes, ModelDefined, Optional } from "sequelize";
import { UserModel } from "./user.model";

type NotificationCreationAtrributes = Optional<
  INotificationDocument,
  "id" | "createdAt"
>;

export const NotificationModel = sequelize.define(
  "notifications",
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,

      references: {
        model: UserModel,
        key: "id",
      },
    },
    groupName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    emails: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: Date.now(),
    },
  },
  {
    indexes: [
      {
        fields: ["userId"],
      },
    ],
  }
) as ModelDefined<INotificationDocument, NotificationCreationAtrributes>;
