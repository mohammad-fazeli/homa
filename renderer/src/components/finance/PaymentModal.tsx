import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import Modal from "../Modal";
import { useBillingStore } from "../../store/billing";
import type { PaymentKind, PaymentMethod, UserFindByIdResult, UserFindAllItem } from "../../global";
import {
  PAYMENT_KIND_LABELS,
  PAYMENT_KINDS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  parseToman,
} from "@shared/finance";
import { dateInputToIso, formatMoney, toDateInputValue } from "../../lib/format";

export default function PaymentModal() {
  const draft = useBillingStore((s) => s.draft);
  const closePayment = useBillingStore((s) => s.closePayment);
  const savePayment = useBillingStore((s) => s.savePayment);

  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<UserFindAllItem[]>([]);
  const [user, setUser] = useState<UserFindByIdResult | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [courseId, setCourseId] = useState<number | "">("");
  const [kind, setKind] = useState<PaymentKind>("payment");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [amount, setAmount] = useState("");
  const [paidOn, setPaidOn] = useState(toDateInputValue());
  const [note, setNote] = useState("");
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!draft) return;
    setUserId(draft.userId ?? null);
    setCourseId(draft.courseId ?? "");
    setKind(draft.kind ?? "payment");
    setMethod(draft.method ?? "cash");
    setAmount(draft.amount ? String(draft.amount) : "");
    setPaidOn(toDateInputValue(draft.paidAt));
    setNote(draft.note ?? "");
    setReference(draft.reference ?? "");
    setQuery("");
    setHits([]);
    setError("");
    if (draft.userId) {
      void window.electronAPI?.getUser(draft.userId).then((row) => {
        if (row) setUser(row);
      });
    } else {
      setUser(null);
    }
  }, [draft]);

  useEffect(() => {
    if (!draft || userId) return;
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      const result = await window.electronAPI?.getUsers(1, 8, q, "all");
      setHits(result?.data ?? []);
    }, 220);
    return () => window.clearTimeout(timer);
  }, [query, userId, draft]);

  const remaining = useMemo(() => {
    if (!user) return 0;
    if (courseId === "") return user.debt;
    return user.courses.find((course) => course.id === courseId)?.debt ?? 0;
  }, [user, courseId]);

  if (!draft) return null;

  const pickUser = async (id: number) => {
    const row = await window.electronAPI?.getUser(id);
    if (!row) return;
    setUser(row);
    setUserId(row.id);
    setHits([]);
    setQuery("");
    if (row.courses.length === 1) setCourseId(row.courses[0].id);
  };

  const submit = async () => {
    const value = parseToman(amount);
    if (!userId) {
      setError("مشتری را انتخاب کنید");
      return;
    }
    if (value <= 0) {
      setError("مبلغ را وارد کنید");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const payload = {
        userId,
        courseId: courseId === "" ? null : Number(courseId),
        amount: value,
        method,
        kind,
        note: note.trim() || null,
        reference: reference.trim() || null,
        paidAt: dateInputToIso(paidOn),
      };
      if (draft.paymentId) {
        await savePayment({ id: draft.paymentId, ...payload });
      } else {
        await savePayment(payload);
      }
      toast.success(kind === "refund" ? "استرداد ثبت شد" : kind === "discount" ? "تخفیف ثبت شد" : "دریافت ثبت شد");
    } catch (err) {
      const message = err instanceof Error ? err.message : "ثبت سند ناموفق بود";
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal onClose={closePayment}>
      <div className="relative bg-surface rounded-3xl p-6 w-[34rem] max-w-[92vw] space-y-4">
        <div>
          <p className="text-xs text-gold font-medium">صندوق</p>
          <h2 className="text-lg font-bold text-ink">
            {draft.paymentId ? "ویرایش سند مالی" : "ثبت دریافت / استرداد / تخفیف"}
          </h2>
        </div>

        {!userId ? (
          <div className="space-y-2">
            <label className="text-sm text-muted">مشتری</label>
            <input
              className="w-full rounded-2xl border border-line px-3 py-2.5 bg-paper"
              placeholder="جستجو با نام، تلفن یا کد ملی"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            {hits.length > 0 && (
              <div className="border border-line rounded-2xl overflow-hidden">
                {hits.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="w-full text-right px-3 py-2.5 hover:bg-paper flex items-center justify-between"
                    onClick={() => void pickUser(item.id)}
                  >
                    <span>
                      {item.firstName} {item.lastName}
                    </span>
                    <span className="text-xs text-muted" dir="ltr">
                      {item.phone}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-line px-3 py-2.5 flex items-center justify-between">
            <div>
              <div className="font-medium">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-xs text-muted">
                بدهی {formatMoney(user?.debt ?? 0)}
                {(user?.credit ?? 0) > 0 ? ` · بستانکار ${formatMoney(user?.credit ?? 0)}` : ""}
              </div>
            </div>
            {!draft.userId && (
              <button className="text-sm text-brand" onClick={() => { setUser(null); setUserId(null); }}>
                تغییر
              </button>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {PAYMENT_KINDS.map((item) => (
            <button
              key={item}
              type="button"
              className={`chip ${kind === item ? "chip-on" : ""}`}
              onClick={() => setKind(item)}
            >
              {PAYMENT_KIND_LABELS[item]}
            </button>
          ))}
        </div>

        {kind !== "discount" && (
          <div className="flex flex-wrap gap-2">
            {PAYMENT_METHODS.map((item) => (
              <button
                key={item}
                type="button"
                className={`chip ${method === item ? "chip-on" : ""}`}
                onClick={() => setMethod(item)}
              >
                {PAYMENT_METHOD_LABELS[item]}
              </button>
            ))}
          </div>
        )}

        {user && user.courses.length > 0 && (
          <select
            className="w-full rounded-2xl border border-line px-3 py-2.5 bg-paper"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">بدون تخصیص به دوره</option>
            {user.courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title} · مانده {formatMoney(course.debt)}
              </option>
            ))}
          </select>
        )}

        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-sm text-muted">مبلغ (تومان)</span>
            <input
              className="w-full rounded-2xl border border-line px-3 py-2.5 bg-paper"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="numeric"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-muted">تاریخ</span>
            <input
              type="date"
              className="w-full rounded-2xl border border-line px-3 py-2.5 bg-paper"
              value={paidOn}
              onChange={(e) => setPaidOn(e.target.value)}
            />
          </label>
        </div>

        {remaining > 0 && kind === "payment" && (
          <div className="flex flex-wrap gap-2">
            <button type="button" className="chip" onClick={() => setAmount(String(remaining))}>
              کل مانده {formatMoney(remaining)}
            </button>
            <button
              type="button"
              className="chip"
              onClick={() => setAmount(String(Math.ceil(remaining / 2)))}
            >
              نصف مانده
            </button>
          </div>
        )}

        {method !== "cash" && kind !== "discount" && (
          <input
            className="w-full rounded-2xl border border-line px-3 py-2.5 bg-paper"
            placeholder="شماره پیگیری / چک"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
        )}

        <input
          className="w-full rounded-2xl border border-line px-3 py-2.5 bg-paper"
          placeholder="توضیح (اختیاری)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="btn btn-ghost" onClick={closePayment}>
            انصراف
          </button>
          <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void submit()}>
            {busy ? "در حال ثبت..." : "ثبت سند"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
