import { app } from "electron";
import { Sequelize } from "sequelize";
import path from "path";

const databasePath = path.join(app.getPath("userData"), "database.sqlite");

export const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: databasePath,
  logging: false,
});

export * from "./UserModel";
