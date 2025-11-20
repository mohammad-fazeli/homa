import { DataTypes, ModelDefined, Optional } from "sequelize";
import { sequelize } from ".";

export type UserAttributes = {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  nationalId: string;
  sessions: number;
};

type UserCreationAttributes = Optional<UserAttributes, "id">;

export const UserModel: ModelDefined<UserAttributes, UserCreationAttributes> =
  sequelize.define("Users", {
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    phone: {
      type: DataTypes.STRING,
      unique: true,
    },
    nationalId: {
      type: DataTypes.STRING,
      unique: true,
    },
    sessions: DataTypes.NUMBER,
  });
