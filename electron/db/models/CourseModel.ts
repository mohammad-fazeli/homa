import { Course } from "./Course";
import { CourseCreateInput, CourseResult } from "../types";

export const CourseModel = {
  async create(data: CourseCreateInput): Promise<CourseResult> {
    const course = await Course.create(data);
    return course.toJSON() as CourseResult;
  },
};
