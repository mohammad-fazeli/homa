import { ipcMain } from "electron";
import { RoomModel } from "../db/models/RoomModel";
import { InstructorModel } from "../db/models/InstructorModel";
import { CourseTemplateModel } from "../db/models/CourseTemplateModel";
import { ClassGroupModel } from "../db/models/ClassGroupModel";
import { HolidayModel } from "../db/models/HolidayModel";
import type {
  AcademySnapshot,
  AcademyHolidayWriteInput,
  ClassGroupGenerateInput,
  ClassGroupWriteInput,
  CourseTemplateWriteInput,
  InstructorWriteInput,
  RoomWriteInput,
} from "../db/types";

function snapshot(): AcademySnapshot {
  const { holidays, closedWeekdays } = HolidayModel.rules();
  return {
    rooms: RoomModel.list(),
    instructors: InstructorModel.list(),
    templates: CourseTemplateModel.list(),
    groups: ClassGroupModel.list(),
    holidays,
    closedWeekdays,
  };
}

export function registerAcademyHandlers() {
  ipcMain.handle("academy:snapshot", (): AcademySnapshot => snapshot());

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

  ipcMain.handle("academy:saveGroup", (_event, data: ClassGroupWriteInput) =>
    ClassGroupModel.save(data)
  );
  ipcMain.handle("academy:deleteGroup", (_event, id: number) =>
    ClassGroupModel.delete(id)
  );
  ipcMain.handle(
    "academy:addGroupMember",
    (_event, groupId: number, userId: number, paidNow?: boolean) =>
      ClassGroupModel.addMember(groupId, userId, paidNow !== false)
  );
  ipcMain.handle(
    "academy:removeGroupMember",
    (_event, groupId: number, userId: number) =>
      ClassGroupModel.removeMember(groupId, userId)
  );
  ipcMain.handle(
    "academy:generateGroupSessions",
    (_event, input: ClassGroupGenerateInput) => ClassGroupModel.generate(input)
  );

  ipcMain.handle("academy:saveHoliday", (_event, data: AcademyHolidayWriteInput) =>
    HolidayModel.save(data)
  );
  ipcMain.handle("academy:deleteHoliday", (_event, id: number) =>
    HolidayModel.delete(id)
  );
  ipcMain.handle("academy:setClosedWeekdays", (_event, days: number[]) => {
    HolidayModel.setClosedWeekdays(days);
    return snapshot();
  });
}
