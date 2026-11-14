// نسخة احتياطية يومية لبرنامج تكاليف الفراولة: JSON كامل (يتسترجع في البرنامج) + ملخص إكسيل، في Storage (serp-backups)
// action=cron (من pg_cron، بيشتغل بس لما الساعة 23 بتوقيت القاهرة) · action=run (يدوي) · action=latest (روابط آخر نسخة)
import postgres from "npm:postgres@3.4.4";
import * as XLSX from "npm:xlsx@0.18.5";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import "./core.js";
const ERP = (globalThis as any).ERP;
const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!, { prepare: false, max: 2 });
const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const BUCKET = "serp-backups";
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json" } });
async function sha(t: string) { const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t)); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join(""); }
function cairo(d = new Date()) { const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(d).map((x) => [x.type, x.value])); return { day: `${p.year}-${p.month}-${p.day}`, dmy: `${p.day}-${p.month}-${p.year}`, hour: +p.hour, time: `${p.hour}:${p.minute}` }; }
const AR: any = { factories: "المصانع", varieties: "الأصناف", items: "المستلزمات", parties: "الحسابات", purchases: "فواتير الخام", transports: "النقل", payments: "الدفعات", supplyIn: "وارد المستلزمات", transfers: "التحويلات", runs: "التشغيلات", sales: "المبيعات" };
const r2 = (x: number) => Math.round((x || 0) * 100) / 100;

async function buildBackup(ws: { id: string; name: string }) {
  const rows = await sql`select coll,id,data,deleted,updated_at from serp.records where ws=${ws.id}`;
  const seed = ERP.seed(), D: any = {}, archived: any = {};
  ERP.COLLS.forEach((c: string) => { D[c] = []; archived[c] = []; });
  for (const r of rows) { if (!D[r.coll]) continue; (r.deleted ? archived : D)[r.coll].push(r.data); }
  // البذور (المصانع، الأصناف، المستلزمات، فوسجا) مش بتترفع غير لو اتعدلت — نكمّلها هنا عشان النسخة تبقى كاملة
  const allIds = new Set(rows.map((r: any) => r.coll + ":" + r.id));
  ERP.COLLS.forEach((c: string) => seed[c].forEach((v: any) => { if (!allIds.has(c + ":" + v.id)) D[c].push(v); }));
  const C = ERP.compute(D), now = new Date(), cz = cairo(now);
  const out = { app: "alrashed-strawberry-erp", version: "server-daily", exportedAt: now.toISOString(), workspace: ws.name, data: D, archived };
  const nm = (c: string, id: string) => (D[c].find((x: any) => x.id === id) || {}).name || "";
  const P = ERP.PTYPES, f = ERP.dmy;
  const wb = XLSX.utils.book_new(); wb.Workbook = { Views: [{ RTL: true }] } as any;
  const add = (name: string, aoa: any[][]) => { const s = XLSX.utils.aoa_to_sheet(aoa); s["!cols"] = aoa[0].map(() => ({ wch: 18 })); XLSX.utils.book_append_sheet(wb, s, name); };
  let pay = 0, rec = 0; D.parties.forEach((p: any) => { const b = (C.BAL[p.id] || {}).bal || 0; if (["raw", "supply", "transport", "service"].includes(p.type)) pay -= b; else rec += b; });
  let stF = 0, stV = 0; Object.values(C.R).forEach((r: any) => { stF += r.stockFin; stV += r.stockVal; });
  add("ملخص", [["شركة الراشد للتجارة — نسخة احتياطية يومية", ""], ["التاريخ (القاهرة)", f(cz.day) + " " + cz.time], ["مساحة العمل", ws.name], ["مستحق للموردين (ج)", r2(pay)], ["مستحق على العملاء (ج)", r2(rec)], ["مخزون إنتاج نهائي (كجم)", r2(stF)], ["قيمة المخزون بالتكلفة (ج)", r2(stV)],
    ...ERP.COLLS.filter((c: string) => c !== "settings").map((c: string) => ["عدد " + (AR[c] || c), D[c].length]), ["سجلات مؤرشفة (محذوفة)", Object.values(archived).reduce((a: number, x: any) => a + x.length, 0)], ["طريقة الفرزة", C.method === "joint" ? "توزيع بالوزن" : "خصم صافي بيع الفرزة"]]);
  add("الحسابات", [["الاسم", "النوع", "رصيد افتتاحي", "عملة الافتتاحي", "تاريخ الافتتاحي", "مدين (عليه)", "دائن (له)", "الرصيد", ""], ...D.parties.map((p: any) => { const b = C.BAL[p.id] || { dr: 0, cr: 0, bal: 0 }, o = ERP.openInfo(p); return [p.name, P[p.type] || p.type, o ? r2(o.amt) + " " + (o.side === "c" ? "له" : "عليه") : "", o ? (o.usd ? "USD × " + o.rate : "EGP") : "", o && o.date ? f(o.date) : "", r2(b.dr), r2(b.cr), r2(Math.abs(b.bal)), Math.abs(b.bal) < 0.005 ? "" : b.bal > 0 ? "عليه" : "له"]; })]);
  add("المخزون الافتتاحي", [["الصنف", "المخزن", "الكمية", "تكلفة الوحدة", "القيمة", "التاريخ"], ...D.items.flatMap((it: any) => (it.openStock || []).map((l: any) => [it.name, nm("factories", l.locId), +l.qty || 0, +l.cost || 0, r2((+l.qty || 0) * (+l.cost || 0)), l.date ? f(l.date) : "أول المدة"]))]);
  add("التشغيلات", [["#", "التاريخ", "المصنع", "الصنف", "خام كجم", "نهائي كجم", "فرزة كجم", "هالك كجم", "إجمالي التكلفة", "ج/طن صادر", "الحالة"], ...D.runs.map((r: any) => { const x = C.R[r.id]; return [r.no, f(r.date), nm("factories", r.factoryId), nm("varieties", r.varietyId), r2(x.rawKg), r2(x.fin), r2(x.farz), r2(x.waste), r2(x.total), r2(x.perTon), x.costLabel]; })]);
  add("تكلفة لكل مورد", [["تشغيلة", "المورد", "خام كجم", "نهائي كجم", "التكلفة", "ج/طن صادر"], ...D.runs.flatMap((r: any) => C.R[r.id].rows.map((s: any) => [r.no, s.name, r2(s.kg), r2(s.fin), r2(s.finCost), r2(s.perTon)]))]);
  add("المبيعات", [["#", "التاريخ", "العميل", "النوع", "رقم الفاتورة", "الحاويات", "كجم", "العملة", "القيمة", "الإيراد ج", "التكلفة", "المصروفات", "الربح"], ...D.sales.map((s: any) => { const x = C.SL[s.id]; return [s.no, f(s.date), nm("parties", s.customerId), x.kind === "farz" ? "فرزة" : "تصدير", x.invNo || "", x.cont ? x.lines.map((l: any) => l.cont + (l.bl ? " / " + l.bl : "") + " — " + l.tons.toFixed(3) + " طن").join("\n") : "", r2(x.kg), x.cur, r2(x.amount), r2(x.rev), r2(x.cogs), r2(x.exp), r2(x.profit)]; })]);
  add("فواتير الخام", [["#", "التاريخ", "المورد", "العربية", "تذكرة الميزان", "صافي الميزان كجم", "خصم %", "سعر", "القيمة", "باقي كجم"], ...D.purchases.map((p: any) => { const x = C.P[p.id]; return [p.no, f(p.date), nm("parties", p.supplierId), p.plate || "", p.ticketNo || "", r2(x.net), x.d, x.price, r2(x.amount), r2(x.remain)]; })]);
  add("الدفعات", [["#", "التاريخ", "الحساب", "النوع", "الطريقة", "العملة", "المبلغ", "المرجع"], ...D.payments.map((p: any) => [p.no, f(p.date), nm("parties", p.partyId), p.dir === "in" ? "تحصيل" : "دفعة", p.method === "transfer" ? "تحويل" : "كاش", p.cur || "EGP", p.amount, p.ref || ""])]);
  add("حركات الحسابات", [["الحساب", "التاريخ", "البيان", "مدين", "دائن", "الرصيد"], ...D.parties.flatMap((p: any) => (C.L[p.id] || []).map((e: any) => [p.name, f(e.date), e.desc, r2(e.dr), r2(e.cr), r2(e.bal)]))]);
  const xlsx = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  const jtxt = JSON.stringify(out, null, 1);
  const base = `${ws.id}/${cz.day}/alrashed-erp-backup-${cz.dmy}`;
  const u1 = await sb.storage.from(BUCKET).upload(base + ".json", new Blob([jtxt], { type: "application/json" }), { upsert: true, contentType: "application/json" });
  if (u1.error) throw u1.error;
  const u2 = await sb.storage.from(BUCKET).upload(base + ".xlsx", new Blob([xlsx]), { upsert: true, contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  if (u2.error) throw u2.error;
  const n = rows.length;
  // الإيميل: محتاج مزود إرسال (RESEND_API_KEY في أسرار الـ Edge Functions). من غيره بنسجل إنه ما اتبعتش.
  let status = "no-email-provider", to = "";
  const rk = Deno.env.get("RESEND_API_KEY");
  if (rk) {
    to = (await sql`select v from serp.config where k='backup_email'`)[0]?.v || "";
    const b64 = (u8: Uint8Array) => { let s = ""; for (let i = 0; i < u8.length; i += 32768) s += String.fromCharCode(...u8.subarray(i, i + 32768)); return btoa(s); };
    const res = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: "Bearer " + rk, "Content-Type": "application/json" }, body: JSON.stringify({ from: Deno.env.get("RESEND_FROM") || "onboarding@resend.dev", to: [to], subject: `نسخة احتياطية — تكاليف الفراولة ${cz.dmy.replace(/-/g, "/")}`, text: `النسخة الاحتياطية اليومية لبرنامج تكاليف الفراولة (${f(cz.day)} ${cz.time} بتوقيت القاهرة). المرفقات: ملف JSON كامل (يتسترجع من شاشة النسخة الاحتياطية في البرنامج) وملخص إكسيل.`, attachments: [{ filename: `alrashed-erp-backup-${cz.dmy}.json`, content: b64(new TextEncoder().encode(jtxt)) }, { filename: `alrashed-erp-backup-${cz.dmy}.xlsx`, content: b64(new Uint8Array(xlsx)) }] }) });
    status = res.ok ? "sent" : "email-failed " + res.status;
  }
  await sql`insert into serp.backups(ws,day,json_path,xlsx_path,records,bytes,emailed_to,email_status) values(${ws.id},${cz.day},${base + ".json"},${base + ".xlsx"},${n},${jtxt.length + xlsx.byteLength},${to},${status})`;
  return { workspace: ws.name, day: cz.day, records: n, json: base + ".json", xlsx: base + ".xlsx", email: status };
}

Deno.serve(async (req) => {
  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const url = new URL(req.url), action = (body as any).action || url.searchParams.get("action") || "latest";
    const cfg = Object.fromEntries((await sql`select k,v from serp.config`).map((r: any) => [r.k, r.v]));
    const cronOk = cfg.cron_token && req.headers.get("x-cron-token") === cfg.cron_token;
    const secretOk = !!req.headers.get("x-backup-secret") && (await sha(req.headers.get("x-backup-secret")!)) === cfg.backup_secret_hash;
    if (!cronOk && !secretOk) return json({ ok: false, error: "unauthorized" }, 401);
    const incTest = !!(body as any).include_test;
    const wss = (await sql`select id,name from serp.workspaces order by created_at`).filter((w: any) => incTest || !String(w.name).startsWith("تجريبي"));
    if (action === "cron" || action === "run") {
      const cz = cairo();
      if (action === "cron" && cz.hour !== 23) return json({ ok: true, skipped: "not 23:00 Cairo", cairo: cz });
      const done = [];
      for (const w of wss) {
        done.push(await buildBackup(w));
      }
      return json({ ok: true, done });
    }
    if (action === "latest") {
      const out = [];
      for (const w of wss) {
        const b = (await sql`select *, day::text as day from serp.backups where ws=${w.id} order by created_at desc limit 1`)[0];
        if (!b) { out.push({ workspace: w.name, none: true }); continue; }
        const s1 = await sb.storage.from(BUCKET).createSignedUrl(b.json_path, 86400), s2 = await sb.storage.from(BUCKET).createSignedUrl(b.xlsx_path, 86400);
        out.push({ workspace: w.name, day: b.day, created_at: b.created_at, records: b.records, email_status: b.email_status, json_name: b.json_path.split("/").pop(), xlsx_name: b.xlsx_path.split("/").pop(), json_url: s1.data?.signedUrl, xlsx_url: s2.data?.signedUrl });
      }
      return json({ ok: true, latest: out });
    }
    return json({ ok: false, error: "unknown action" }, 400);
  } catch (e) { return json({ ok: false, error: String((e as any)?.message || e) }, 500); }
});
