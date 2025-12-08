import { DataTypes, Model } from "sequelize";
import { sequelize } from "..";
import { CourseAttributes, CourseCreateInput } from "../types";

export class Course
  extends Model<CourseAttributes, CourseCreateInput>
  implements CourseAttributes
{
  public id!: number;
  public userId!: number;
  public cost!: number;
  public sessions!: number;
  public createdAt?: Date;
  public updatedAt?: Date;
}

Course.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    cost: { type: DataTypes.INTEGER, allowNull: false },
    sessions: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  { sequelize, modelName: "Course" }
);
