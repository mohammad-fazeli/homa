import { dialog, ipcMain } from "electron";
import { db } from "../db/connection";
import { PaymentModel } from "../db/models/PaymentModel";
import { UserModel } from "../db/models/UserModel";
import type {
  CustomerImportCommitResult,
  CustomerImportDraft,
  CustomerImportExisting,
} from "../../shared/import-customers";
import {
  previewCustomerImport,
  readyImportDrafts,
} from "../../shared/import-customers";
import {
  readSpreadsheetTable,
  writeCustomerImportTemplate,
} from "../lib/spreadsheet";
import { saveCourseForUser } from "./users";

let lastPreviewPath: string | null = null;

export function registerImportHandlers() {
  ipcMain.handle("import:preview", async () => {
    const result = await dialog.showOpenDialog({
      title: "وارد کردن مشتریان از Excel",
      filters: [
        { name: "Excel و CSV", extensions: ["xlsx", "xls", "csv"] },
        { name: "همه فایل‌ها", extensions: ["*"] },
      ],
      properties: ["openFile"],
    });
    if (result.canceled || !result.filePaths[0]) {
      return { cancelled: true as const };
    }

    const filePath = result.filePaths[0];
    const table = readSpreadsheetTable(filePath);
    const preview = previewCustomerImport(table, loadExistingKeys());
    lastPreviewPath = filePath;
    return {
      cancelled: false as const,
      filePath,
      fileName: filePath.split(/[/\\]/).pop() ?? filePath,
      preview,
    };
  });

  ipcMain.handle("import:commit", async (): Promise<CustomerImportCommitResult> => {
    if (!lastPreviewPath) {
      throw new Error("ابتدا یک فایل را انتخاب و پیش‌نمایش کنید");
    }
    const table = readSpreadsheetTable(lastPreviewPath);
    const preview = previewCustomerImport(table, loadExistingKeys());
    const drafts = readyImportDrafts(preview);
    if (!drafts.length) {
      throw new Error("ردیف معتبری برای ورود نیست");
    }

    const importOne = db.transaction((draft: CustomerImportDraft) => {
      insertImportedCustomer(draft);
    });

    let imported = 0;
    let skipped = 0;
    const failed: CustomerImportCommitResult["failed"] = [];

    for (const draft of drafts) {
      try {
        importOne(draft);
        imported += 1;
      } catch (err) {
        const message = err instanceof Error ? err.message : "ثبت ناموفق بود";
        if (message.includes("قبلاً")) skipped += 1;
        else failed.push({ rowNumber: draft.rowNumber, message });
      }
    }

    lastPreviewPath = null;
    return { imported, skipped, failed };
  });

  ipcMain.handle("import:template", async () => {
    const result = await dialog.showSaveDialog({
      title: "ذخیره قالب ورود مشتریان",
      defaultPath: "homa-import-customers.xlsx",
      filters: [
        { name: "Excel", extensions: ["xlsx"] },
        { name: "CSV", extensions: ["csv"] },
      ],
    });
    if (result.canceled || !result.filePath) {
      return { cancelled: true as const };
    }
    writeCustomerImportTemplate(result.filePath);
    return { ok: true as const, path: result.filePath };
  });
}

function loadExistingKeys(): CustomerImportExisting {
  const rows = db
    .prepare(`SELECT phone, nationalId, uidCart FROM Users`)
    .all() as Array<{
    phone: string;
    nationalId: string;
    uidCart: string | null;
  }>;
  return {
    phones: rows.map((row) => row.phone),
    nationalIds: rows.map((row) => row.nationalId),
    cards: rows
      .map((row) => row.uidCart)
      .filter((card): card is string => Boolean(card && card.trim())),
  };
}

function insertImportedCustomer(draft: CustomerImportDraft) {
  const created = UserModel.create({
    firstName: draft.firstName,
    lastName: draft.lastName,
    phone: draft.phone,
    nationalId: draft.nationalId,
    uidCart: draft.uidCart,
    notes: draft.notes,
  });
  if (!created) throw new Error("ثبت کاربر ناموفق بود");

  let courseId: number | null = null;
  if (draft.course) {
    courseId = saveCourseForUser(created.id, {
      cost: draft.course.cost,
      sessions: draft.course.sessions,
      title: draft.course.title,
      notes: draft.course.notes,
      paidNow: false,
    });
  }

  if (draft.paidAmount > 0) {
    PaymentModel.create({
      userId: created.id,
      courseId,
      amount: draft.paidAmount,
      method: "cash",
      note: "واردات از اکسل",
    });
  }
}
