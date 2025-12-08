import { User } from "./models/User";
import { Course } from "./models/Course";
import { Session } from "./models/Session";
import { SessionLog } from "./models/SessionLog";

export function setupAssociations() {
  Course.belongsTo(User, { foreignKey: "userId", onDelete: "CASCADE" });
  User.hasMany(Course, { foreignKey: "userId" });

  Session.belongsTo(Course, { foreignKey: "courseId", onDelete: "CASCADE" });
  Course.hasMany(Session, { foreignKey: "courseId" });

  SessionLog.belongsTo(User, { foreignKey: "userId", onDelete: "CASCADE" });
  User.hasMany(SessionLog, { foreignKey: "userId" });
}
