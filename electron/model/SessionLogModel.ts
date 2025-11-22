import { ModelDefined, Optional, Sequelize } from "sequelize";

export type SessionLogAttributes = {
  id: number;
  userId: number;
  change: number;
  previousValue: number;
  newValue: number;
  description?: string;
};

type SessionLogCreationAttributes = Optional<SessionLogAttributes, "id">;

export function createSessionLogModel(sequelize: Sequelize, DataTypes: any) {
  const SessionLogModel: ModelDefined<
    SessionLogAttributes,
    SessionLogCreationAttributes
  > = sequelize.define("SessionLogs", {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    change: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    previousValue: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    newValue: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  });
  return SessionLogModel;
}
