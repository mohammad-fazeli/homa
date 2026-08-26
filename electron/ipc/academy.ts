import { ipcMain } from "electron";
import { RoomModel } from "../db/models/RoomModel";
import { InstructorModel } from "../db/models/InstructorModel";
import { CourseTemplateModel } from "../db/models/CourseTemplateModel";
import type {
  AcademySnapshot,
  CourseTemplateWriteInput,
  InstructorWriteInput,
  RoomWriteInput,
} from "../db/types";

export function registerAcademyHandlers() {
  ipcMain.handle("academy:snapshot", (): AcademySnapshot => ({
    rooms: RoomModel.list(),
    instructors: InstructorModel.list(),
    templates: CourseTemplateModel.list(),
  }));

  ipcMain.handle("academy:listRooms", () => RoomModel.list());
  ipcMain.handle("academy:saveRoom", (_event, data: RoomWriteInput) =>
    RoomModel.save(data)
  );
  ipcMain.handle("academy:deleteRoom", (_event, id: number) =>
    RoomModel.delete(id)
  );

  ipcMain.handle("academy:listInstructors", () => InstructorModel.list());
  ipcMain.handle(
    "academy:saveInstructor",
    (_event, data: InstructorWriteInput) => InstructorModel.save(data)
  );
  ipcMain.handle("academy:deleteInstructor", (_event, id: number) =>
    InstructorModel.delete(id)
  );

  ipcMain.handle("academy:listTemplates", () => CourseTemplateModel.list());
  ipcMain.handle(
    "academy:saveTemplate",
    (_event, data: CourseTemplateWriteInput) => CourseTemplateModel.save(data)
  );
  ipcMain.handle("academy:deleteTemplate", (_event, id: number) =>
    CourseTemplateModel.delete(id)
  );
}
