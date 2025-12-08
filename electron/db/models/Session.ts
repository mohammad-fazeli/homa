import { DataTypes, Model } from "sequelize";
import { sequelize } from "..";
import { SessionAttributes, SessionCreateInput } from "../types";

export class Session
  extends Model<SessionAttributes, SessionCreateInput>
  implements SessionAttributes
{
  public id!: number;
  public courseId!: number;
  public date!: Date;
  public used!: boolean;
  public usedAt!: Date | null;
  public createdAt?: Date;
  public updatedAt?: Date;
}

Session.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    courseId: { type: DataTypes.INTEGER, allowNull: false },
    date: { type: DataTypes.DATE, allowNull: false },
    used: { type: DataTypes.BOOLEAN, defaultValue: false },
    usedAt: { type: DataTypes.DATE, allowNull: true },
  },
  { sequelize, modelName: "Session" }
);
