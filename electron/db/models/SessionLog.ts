import { DataTypes, Model } from "sequelize";
import { sequelize } from "..";
import { User } from "./User";

export class SessionLog extends Model {}

SessionLog.init(
  {
    change: { type: DataTypes.INTEGER, allowNull: false },
    previousValue: { type: DataTypes.INTEGER, allowNull: false },
    newValue: { type: DataTypes.INTEGER, allowNull: false },
    description: { type: DataTypes.STRING },
  },
  { sequelize, modelName: "SessionLog", timestamps: true }
);
