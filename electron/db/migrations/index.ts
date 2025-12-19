// src/database/migrations/index.ts
import { Migration } from "../types";
import { migration001 } from "./001_init";
import { migration002 } from "./002_add_user_average";

export const migrations: Migration[] = [migration001, migration002];
