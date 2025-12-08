import { DataTypes, Model } from "sequelize";
import { sequelize } from "..";
import { UserAttributes, UserCreateInput } from "../types";

export class User
  extends Model<UserAttributes, UserCreateInput>
  implements UserAttributes
{
  public id!: number;
  public firstName!: string;
  public lastName!: string;
  public phone!: string;
  public nationalId!: string;
}

User.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    firstName: { type: DataTypes.STRING, allowNull: false },
    lastName: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: false, unique: true },
    nationalId: { type: DataTypes.STRING, allowNull: false, unique: true },
  },
  { sequelize, modelName: "User" }
);
