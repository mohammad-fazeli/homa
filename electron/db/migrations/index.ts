import { Migration } from "../types";
import { migration001 } from "./001_init";
import { migration002 } from "./002_add_user_average";
import { migration003 } from "./003_normalize_session_dates";
import { migration004 } from "./004_drop_user_average";
import { migration005 } from "./005_academy";
import { migration006 } from "./006_finance";

export const migrations: Migration[] = [
  migration001,
  migration002,
  migration003,
  migration004,
  migration005,
  migration006,
];
