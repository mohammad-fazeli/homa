import { app } from "electron";
import { DataTypes, Sequelize } from "sequelize";
import path from "path";
import { createUserModel } from "./UserModel";
import { createSessionLogModel } from "./SessionLogModel";

const databasePath = path.join(app.getPath("userData"), "database.sqlite");

export const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: databasePath,
  logging: false,
});

export const UserModel = createUserModel(sequelize, DataTypes);
export const SessionLogModel = createSessionLogModel(sequelize, DataTypes);

UserModel.hasMany(SessionLogModel, {
  foreignKey: "userId",
  as: "logs",
});

SessionLogModel.belongsTo(UserModel, {
  foreignKey: "userId",
});
