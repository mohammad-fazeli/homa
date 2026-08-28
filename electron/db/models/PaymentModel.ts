import { db } from "../connection";
import type {
  CashReport,
  DebtorRow,
  MethodBreakdownItem,
  PaymentAttributes,
  PaymentCreateInput,
  PaymentKind,
  PaymentListFilter,
  PaymentListResult,
  PaymentMethod,
  PaymentUpdateInput,
} from "../types";
import {
  agingBucket,
  appliedSql,
  cashInSql,
  daysBetween,
  DEBT_AGING_LABELS,
  discountSql,
  isPaymentKind,
  isPaymentMethod,
  PAYMENT_METHODS,
  refundSql,
  settleAccount,
} from "../../../shared/finance";

const SELECT_PAYMENT = `
  SELECT p.*, u.firstName, u.lastName, u.phone, c.title AS courseTitle
  FROM Payments p
  JOIN Users u ON u.id = p.userId
  LEFT JOIN Courses c ON c.id = p.courseId
`;

function mapPayment(row: any): PaymentAttributes {
  return {
    id: row.id,
    userId: row.userId,
    courseId: row.courseId ?? null,
    amount: Number(row.amount) || 0,
    method: isPaymentMethod(row.method) ? row.method : "cash",
    kind: isPaymentKind(row.kind) ? row.kind : "payment",
    note: row.note ?? null,
    reference: row.reference ?? null,
    paidAt: row.paidAt,
    userFullName: row.firstName ? `${row.firstName} ${row.lastName}` : undefined,
    userPhone: row.phone ?? undefined,
    courseTitle: row.courseTitle ?? null,
  };
}

function assertUser(userId: number) {
  const row = db.prepare(`SELECT id FROM Users WHERE id = ?`).get(userId);
  if (!row) throw new Error("مشتری پیدا نشد");
}

function assertCourse(userId: number, courseId: number | null | undefined) {
  if (courseId == null) return;
  const row = db
    .prepare(`SELECT id, userId FROM Courses WHERE id = ?`)
    .get(courseId) as { id: number; userId: number } | undefined;
  if (!row) throw new Error("دوره پیدا نشد");
  if (row.userId !== userId) throw new Error("این دوره متعلق به این مشتری نیست");
}

function normalizeAmount(value: unknown) {
  const amount = Math.trunc(Number(value) || 0);
  if (amount <= 0) throw new Error("مبلغ باید بزرگ‌تر از صفر باشد");
  return amount;
}

function normalizeKind(value?: string | null): PaymentKind {
  return isPaymentKind(value ?? "") ? (value as PaymentKind) : "payment";
}

function normalizeMethod(value?: string | null): PaymentMethod {
  return isPaymentMethod(value ?? "") ? (value as PaymentMethod) : "cash";
}

function loadById(id: number): PaymentAttributes {
  const row = db.prepare(`${SELECT_PAYMENT} WHERE p.id = ?`).get(id);
  if (!row) throw new Error("پرداخت پیدا نشد");
  return mapPayment(row);
}

function localDayKey(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildWhere(filter: PaymentListFilter = {}) {
  const clauses: string[] = [];
  const params: Array<string | number> = [];

  if (filter.userId) {
    clauses.push("p.userId = ?");
    params.push(filter.userId);
  }
  if (filter.courseId) {
    clauses.push("p.courseId = ?");
    params.push(filter.courseId);
  }
  if (filter.method && filter.method !== "all") {
    clauses.push("p.method = ?");
    params.push(filter.method);
  }
  if (filter.kind && filter.kind !== "all") {
    clauses.push("IFNULL(p.kind, 'payment') = ?");
    params.push(filter.kind);
  }
  if (filter.from) {
    clauses.push("datetime(p.paidAt) >= datetime(?)");
    params.push(filter.from);
  }
  if (filter.to) {
    clauses.push("datetime(p.paidAt) < datetime(?)");
    params.push(filter.to);
  }
  const term = filter.search?.trim();
  if (term) {
    const like = `%${term}%`;
    clauses.push(
      `(u.firstName LIKE ? OR u.lastName LIKE ? OR (u.firstName || ' ' || u.lastName) LIKE ? OR u.phone LIKE ? OR IFNULL(p.note, '') LIKE ? OR IFNULL(p.reference, '') LIKE ?)`
    );
    params.push(like, like, like, like, like, like);
  }

  return {
    sql: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    params,
  };
}

export const PaymentModel = {
  list(limit = 50, userId?: number): PaymentAttributes[] {
    return this.listFiltered({ limit, userId }).data;
  },

  listFiltered(filter: PaymentListFilter = {}): PaymentListResult {
    const cap = Math.min(5000, Math.max(1, Number(filter.limit) || 80));
    const offset = Math.max(0, Number(filter.offset) || 0);
    const where = buildWhere(filter);

    const total = (
      db
        .prepare(
          `SELECT COUNT(*) AS count FROM Payments p JOIN Users u ON u.id = p.userId ${where.sql}`
        )
        .get(...where.params) as { count: number }
    ).count;

    const totals = db
      .prepare(
        `
        SELECT
          COALESCE(SUM(${cashInSql("p")}), 0) AS collected,
          COALESCE(SUM(${refundSql("p")}), 0) AS refunded,
          COALESCE(SUM(${discountSql("p")}), 0) AS discounted
        FROM Payments p
        JOIN Users u ON u.id = p.userId
        ${where.sql}
      `
      )
      .get(...where.params) as {
      collected: number;
      refunded: number;
      discounted: number;
    };

    const data = db
      .prepare(
        `
        ${SELECT_PAYMENT}
        ${where.sql}
        ORDER BY datetime(p.paidAt) DESC, p.id DESC
        LIMIT ? OFFSET ?
      `
      )
      .all(...where.params, cap, offset)
      .map(mapPayment);

    return {
      data,
      total,
      collected: totals.collected,
      refunded: totals.refunded,
      discounted: totals.discounted,
      net: totals.collected - totals.refunded,
    };
  },

  findById(id: number) {
    return loadById(id);
  },

  sumByCourse(courseId: number): number {
    const row = db
      .prepare(
        `SELECT COALESCE(SUM(${appliedSql()}), 0) AS sum FROM Payments WHERE courseId = ?`
      )
      .get(courseId) as { sum: number };
    return row.sum;
  },

  sumByUser(userId: number): number {
    const row = db
      .prepare(
        `SELECT COALESCE(SUM(${appliedSql()}), 0) AS sum FROM Payments WHERE userId = ?`
      )
      .get(userId) as { sum: number };
    return row.sum;
  },

  cashBetween(from: string, to: string) {
    const row = db
      .prepare(
        `
        SELECT
          COALESCE(SUM(${cashInSql()}), 0) AS collected,
          COALESCE(SUM(${refundSql()}), 0) AS refunded,
          COALESCE(SUM(${discountSql()}), 0) AS discounted,
          COUNT(*) AS count
        FROM Payments
        WHERE datetime(paidAt) >= datetime(?) AND datetime(paidAt) < datetime(?)
      `
      )
      .get(from, to) as {
      collected: number;
      refunded: number;
      discounted: number;
      count: number;
    };
    return { ...row, net: row.collected - row.refunded };
  },

  methodBreakdown(from?: string, to?: string): MethodBreakdownItem[] {
    const clauses = [`IFNULL(kind, 'payment') = 'payment'`];
    const params: string[] = [];
    if (from) {
      clauses.push("datetime(paidAt) >= datetime(?)");
      params.push(from);
    }
    if (to) {
      clauses.push("datetime(paidAt) < datetime(?)");
      params.push(to);
    }
    const rows = db
      .prepare(
        `
        SELECT method, COUNT(*) AS count, COALESCE(SUM(amount), 0) AS amount
        FROM Payments
        WHERE ${clauses.join(" AND ")}
        GROUP BY method
      `
      )
      .all(...params) as Array<{ method: string; count: number; amount: number }>;

    return PAYMENT_METHODS.map((method) => {
      const row = rows.find((item) => item.method === method);
      return { method, count: row?.count ?? 0, amount: row?.amount ?? 0 };
    }).filter((item) => item.count > 0 || item.amount > 0);
  },

  listDebtors(): DebtorRow[] {
    const users = db
      .prepare(
        `
        SELECT
          u.id AS userId,
          u.firstName,
          u.lastName,
          u.phone,
          COALESCE((SELECT SUM(cost) FROM Courses WHERE userId = u.id), 0) AS contracted,
          COALESCE((SELECT SUM(${appliedSql()}) FROM Payments WHERE userId = u.id), 0) AS applied,
          COALESCE((SELECT SUM(${cashInSql()}) FROM Payments WHERE userId = u.id), 0) AS collected,
          COALESCE((SELECT SUM(${discountSql()}) FROM Payments WHERE userId = u.id), 0) AS discounted,
          COALESCE((SELECT SUM(${refundSql()}) FROM Payments WHERE userId = u.id), 0) AS refunded,
          (SELECT MAX(paidAt) FROM Payments WHERE userId = u.id) AS lastPaidAt
        FROM Users u
      `
      )
      .all() as any[];

    const courses = db
      .prepare(
        `
        SELECT
          c.id, c.userId, c.title, c.cost, c.createdAt,
          COALESCE((SELECT SUM(${appliedSql()}) FROM Payments p WHERE p.courseId = c.id), 0) AS applied
        FROM Courses c
      `
      )
      .all() as any[];

    const coursesByUser = new Map<number, DebtorRow["courses"]>();
    for (const course of courses) {
      const paidAmount = Number(course.applied) || 0;
      const item = {
        id: course.id,
        title: course.title || "دوره",
        cost: Number(course.cost) || 0,
        paidAmount,
        debt: Math.max(0, Number(course.cost) - paidAmount),
        createdAt: course.createdAt ?? null,
      };
      const list = coursesByUser.get(course.userId) ?? [];
      list.push(item);
      coursesByUser.set(course.userId, list);
    }

    return users
      .map((user) => {
        const contracted = Number(user.contracted) || 0;
        const applied = Number(user.applied) || 0;
        const { debt, credit } = settleAccount(contracted, applied);
        const userCourses = coursesByUser.get(user.userId) ?? [];
        const oldestUnpaidAt =
          userCourses
            .filter((course) => course.debt > 0 && course.createdAt)
            .map((course) => String(course.createdAt))
            .sort()[0] ?? null;
        return {
          userId: user.userId,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          contracted,
          applied,
          collected: Number(user.collected) || 0,
          discounted: Number(user.discounted) || 0,
          refunded: Number(user.refunded) || 0,
          debt,
          credit,
          lastPaidAt: user.lastPaidAt ?? null,
          oldestUnpaidAt,
          courses: userCourses,
        } satisfies DebtorRow;
      })
      .filter((row) => row.debt > 0 || row.credit > 0)
      .sort((a, b) => b.debt - a.debt || b.credit - a.credit);
  },

  aging() {
    const buckets: Record<"d0" | "d30" | "d60" | "d90", { count: number; amount: number }> = {
      d0: { count: 0, amount: 0 },
      d30: { count: 0, amount: 0 },
      d60: { count: 0, amount: 0 },
      d90: { count: 0, amount: 0 },
    };
    for (const row of this.listDebtors()) {
      if (row.debt <= 0) continue;
      const start = row.oldestUnpaidAt ? new Date(row.oldestUnpaidAt) : new Date();
      const bucket = agingBucket(daysBetween(start));
      buckets[bucket].count += 1;
      buckets[bucket].amount += row.debt;
    }
    return (Object.keys(buckets) as Array<keyof typeof buckets>).map((bucket) => ({
      bucket,
      label: DEBT_AGING_LABELS[bucket],
      count: buckets[bucket].count,
      amount: buckets[bucket].amount,
    }));
  },

  rangeReport(from: string, to: string): CashReport {
    const listed = this.listFiltered({ from, to, limit: 5000 });
    const byDayMap = new Map<string, CashReport["byDay"][number]>();
    for (const payment of listed.data) {
      const date = localDayKey(payment.paidAt);
      const current = byDayMap.get(date) ?? {
        date,
        collected: 0,
        refunded: 0,
        discounted: 0,
        net: 0,
        count: 0,
      };
      if (payment.kind === "refund") current.refunded += payment.amount;
      else if (payment.kind === "discount") current.discounted += payment.amount;
      else current.collected += payment.amount;
      current.count += 1;
      current.net = current.collected - current.refunded;
      byDayMap.set(date, current);
    }
    return {
      from,
      to,
      collected: listed.collected,
      refunded: listed.refunded,
      discounted: listed.discounted,
      net: listed.net,
      count: listed.total,
      byMethod: this.methodBreakdown(from, to),
      byDay: [...byDayMap.values()].sort((a, b) => a.date.localeCompare(b.date)),
      payments: listed.data,
    };
  },

  create(data: PaymentCreateInput): PaymentAttributes {
    assertUser(data.userId);
    assertCourse(data.userId, data.courseId);
    const result = db
      .prepare(
        `
        INSERT INTO Payments (userId, courseId, amount, method, kind, note, reference, paidAt, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `
      )
      .run(
        data.userId,
        data.courseId ?? null,
        normalizeAmount(data.amount),
        normalizeMethod(data.method),
        normalizeKind(data.kind),
        data.note?.trim() || null,
        data.reference?.trim() || null,
        data.paidAt || new Date().toISOString()
      );
    return loadById(Number(result.lastInsertRowid));
  },

  update(data: PaymentUpdateInput): PaymentAttributes {
    const current = loadById(data.id);
    const courseId = data.courseId === undefined ? current.courseId : data.courseId;
    assertCourse(current.userId, courseId);
    db.prepare(
      `
      UPDATE Payments
      SET courseId = ?, amount = ?, method = ?, kind = ?, note = ?, reference = ?, paidAt = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `
    ).run(
      courseId ?? null,
      normalizeAmount(data.amount ?? current.amount),
      normalizeMethod(data.method ?? current.method),
      normalizeKind(data.kind ?? current.kind),
      data.note === undefined ? current.note : data.note?.trim() || null,
      data.reference === undefined ? current.reference : data.reference?.trim() || null,
      data.paidAt || current.paidAt,
      data.id
    );
    return loadById(data.id);
  },

  delete(id: number) {
    return db.prepare(`DELETE FROM Payments WHERE id = ?`).run(id).changes;
  },
};
