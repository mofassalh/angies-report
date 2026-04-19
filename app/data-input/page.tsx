"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const LOCATIONS = ["ST ALBANS", "FITZROY NORTH", "ASCOT VALE"];
const RESTAURANTS_BY_LOCATION: Record<string, string[]> = {
  "ST ALBANS":     ["ANGIES - ST ALBANS", "GOLDEN FLAMES"],
  "FITZROY NORTH": ["ANGIES - FITZROY NORTH", "LAMB ON NICHOLSON"],
  "ASCOT VALE":    ["ANGIES - ASCOT VALE", "ASCOT VALE KEBABS"],
};
const RESTAURANT_IDS: Record<string, string> = {
  "ANGIES - ST ALBANS":     "angies-st-albans",
  "GOLDEN FLAMES":          "golden-flames-st-albans",
  "ANGIES - FITZROY NORTH": "angies-fitzroy-north",
  "LAMB ON NICHOLSON":      "lamb-on-nicholson",
  "ANGIES - ASCOT VALE":    "angies-ascot-vale",
  "ASCOT VALE KEBABS":      "ascot-vale-kebabs",
};
const RESTAURANT_FUZZY: Record<string, string> = {
  "angies- st albans": "angies-st-albans",
  "angies st albans": "angies-st-albans",
  "angie's st albans": "angies-st-albans",
  "golden flames": "golden-flames-st-albans",
  "golden flames ": "golden-flames-st-albans",
  "angies- fitzroy north": "angies-fitzroy-north",
  "angies fitzroy north": "angies-fitzroy-north",
  "angie's fitzroy north": "angies-fitzroy-north",
  "lamb on nicholson": "lamb-on-nicholson",
  "lamb on nicholson ": "lamb-on-nicholson",
  "angies - ascot vale": "angies-ascot-vale",
  "angies ascot vale": "angies-ascot-vale",
  "angie's ascot vale": "angies-ascot-vale",
  "ascot vale kebabs": "ascot-vale-kebabs",
  "ascot vale kebabs ": "ascot-vale-kebabs",
  "goolden - ascot vale": "ascot-vale-kebabs",
  "golden - ascot vale": "ascot-vale-kebabs",
};
const ID_TO_LOCATION: Record<string, string> = {
  "angies-st-albans": "ST ALBANS",
  "golden-flames-st-albans": "ST ALBANS",
  "angies-fitzroy-north": "FITZROY NORTH",
  "lamb-on-nicholson": "FITZROY NORTH",
  "angies-ascot-vale": "ASCOT VALE",
  "ascot-vale-kebabs": "ASCOT VALE",
};
const ID_TO_NAME: Record<string, string> = {
  "angies-st-albans": "ANGIES - ST ALBANS",
  "golden-flames-st-albans": "GOLDEN FLAMES",
  "angies-fitzroy-north": "ANGIES - FITZROY NORTH",
  "lamb-on-nicholson": "LAMB ON NICHOLSON",
  "angies-ascot-vale": "ANGIES - ASCOT VALE",
  "ascot-vale-kebabs": "ASCOT VALE KEBABS",
};
const PARTNERS = ["Store", "Uber Eats", "DoorDash", "Menulog"];
const EXPENSE_TYPES = ["Food", "Staff", "Operation"];
const COLUMN_ALIASES: Record<string, string> = {
  "date": "date", "week": "date", "week_start": "date", "period": "date",
  "resturent's name": "location", "resturents name": "location", "restaurant's name": "location",
  "revenue type": "restaurant", "restaurant name": "restaurant", "resturent name": "restaurant",
  "restaurant": "restaurant", "resturent": "restaurant",
  "location": "location", "loc": "location", "area": "location",
  "delivery partner": "partner", "partner": "partner", "channel": "partner", "platform": "partner",
  "number of order": "orders", "number of orders": "orders", "orders": "orders", "transactions": "orders",
  "gross revenue": "gross_revenue", "gross sales": "gross_revenue", "gross": "gross_revenue",
  "net revenue": "net_revenue", "net sales": "net_revenue", "net": "net_revenue",
  "expenses type": "expense_type", "expense type": "expense_type", "cost type": "expense_type",
  "expenses amount": "expense_amount", "expense amount": "expense_amount", "amount": "expense_amount",
  "food cost": "food_cost", "food": "food_cost",
  "staff cost": "staff_cost", "staff": "staff_cost", "labour": "staff_cost",
  "operation cost": "operation_cost", "operation": "operation_cost",
};

type Tab = "entry" | "upload" | "history";
interface EditCtx { week_start: string }
interface UploadRow {
  restaurant_id: string; location: string; restaurant_name: string;
  week_start: string; partner: string; orders: number;
  gross_revenue: number; net_revenue: number;
  food_cost: number; staff_cost: number; operation_cost: number;
}

function toMonday(dateStr: string): string {
  let d: Date;
  if (dateStr.includes("/")) {
    const p = dateStr.split("/");
    d = new Date(`${p[2]}-${p[1].padStart(2,"0")}-${p[0].padStart(2,"0")}T00:00:00`);
  } else {
    d = new Date(dateStr.split("T")[0] + "T00:00:00");
  }
  if (isNaN(d.getTime())) return "";
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d.toISOString().split("T")[0];
}

function wLabel(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

function fm(n: number) {
  return "$" + (n || 0).toLocaleString("en-AU", { maximumFractionDigits: 0 });
}

function parseLine(line: string): string[] {
  const r: string[] = []; let cur = ""; let q = false;
  for (const ch of line) {
    if (ch === '"') q = !q;
    else if (ch === ',' && !q) { r.push(cur.trim()); cur = ""; }
    else cur += ch;
  }
  r.push(cur.trim());
  return r;
}

// ── MultiSelect ───────────────────────────────────────────────────────────────
function MS({ label, options, selected, onChange }: { label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const toggle = (o: string) => onChange(selected.includes(o) ? selected.filter(s => s !== o) : [...selected, o]);
  return (
    <div className="relative">
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-left flex items-center justify-between hover:border-[#F5C800] focus:outline-none">
        <span className={selected.length === 0 ? "text-gray-400" : "text-gray-800"}>
          {selected.length === 0 ? "Select..." : selected.length === options.length ? "All selected" : selected.join(", ")}
        </span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <>
          <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            <div onClick={() => onChange(selected.length === options.length ? [] : [...options])}
              className="px-3 py-2 text-xs text-[#F5C800] font-semibold cursor-pointer hover:bg-yellow-50 border-b border-gray-100">
              {selected.length === options.length ? "Deselect All" : "Select All"}
            </div>
            {options.map(opt => (
              <div key={opt} onClick={() => toggle(opt)} className="px-3 py-2.5 text-sm cursor-pointer hover:bg-gray-50 flex items-center gap-2.5">
                <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${selected.includes(opt) ? "bg-[#F5C800] border-[#F5C800]" : "border-gray-300"}`}>
                  {selected.includes(opt) && <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
                <span className="text-gray-700">{opt}</span>
              </div>
            ))}
          </div>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
        </>
      )}
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ toast }: { toast: { type: "ok" | "err"; msg: string } | null }) {
  if (!toast) return null;
  return (
    <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl text-sm font-medium shadow-lg z-50 ${toast.type === "ok" ? "bg-green-100 border border-green-300 text-green-800" : "bg-red-100 border border-red-300 text-red-800"}`}>
      {toast.type === "ok" ? "✅ " : "❌ "}{toast.msg}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DataInputPage() {
  const [tab, setTab] = useState<Tab>("entry");
  const [editCtx, setEditCtx] = useState<EditCtx | null>(null);
  const tabs: { key: Tab; label: string }[] = [
    { key: "entry", label: "Weekly Entry" },
    { key: "upload", label: "File Upload" },
    { key: "history", label: "Saved History" },
  ];
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-3 py-4">
            <div className="w-8 h-8 bg-[#F5C800] rounded-lg flex items-center justify-center text-black font-black text-sm">A</div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-none">Data Input</h1>
              <p className="text-xs text-gray-400 mt-0.5">Angie's Kebabs & Burgers</p>
            </div>
          </div>
          <div className="flex -mb-px">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-all ${tab === t.key ? "border-[#F5C800] text-gray-900" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-6 py-8">
        {tab === "entry"   && <EntryTab editCtx={editCtx} onDone={() => setEditCtx(null)} />}
        {tab === "upload"  && <UploadTab />}
        {tab === "history" && <HistoryTab onEdit={ws => { setEditCtx({ week_start: ws }); setTab("entry"); }} />}
      </div>
    </div>
  );
}

// ── Entry Tab ─────────────────────────────────────────────────────────────────
function EntryTab({ editCtx, onDone }: { editCtx: EditCtx | null; onDone: () => void }) {
  const [date, setDate] = useState("");
  const [weekStart, setWeekStart] = useState("");
  const [locs, setLocs] = useState<string[]>([]);
  const [rests, setRests] = useState<string[]>([]);
  const [partners, setPartners] = useState<string[]>([]);
  const [orders, setOrders] = useState("");
  const [gross, setGross] = useState("");
  const [net, setNet] = useState("");
  const [expTypes, setExpTypes] = useState<string[]>([]);
  const [expAmts, setExpAmts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const availRests = locs.flatMap(l => RESTAURANTS_BY_LOCATION[l] || []);

  useEffect(() => { setRests(p => p.filter(r => availRests.includes(r))); }, [locs]);
  useEffect(() => { if (date) setWeekStart(toMonday(date)); }, [date]);
  useEffect(() => {
    if (!editCtx) return;
    setEditing(true);
    setDate(editCtx.week_start);
    setWeekStart(editCtx.week_start);
    loadEdit(editCtx.week_start);
  }, [editCtx]);

  async function loadEdit(ws: string) {
    const { data } = await supabase.from("report_weekly_data").select("*").eq("week_start", ws);
    if (!data || !data.length) return;
    setLocs([...new Set(data.map((r: any) => r.location))] as string[]);
    setRests([...new Set(data.map((r: any) => r.restaurant_name))] as string[]);
    setPartners([...new Set(data.map((r: any) => r.partner))] as string[]);
    const f = data[0];
    setOrders(String(f.orders || "")); setGross(String(f.gross_revenue || "")); setNet(String(f.net_revenue || ""));
    const et: string[] = []; const ea: Record<string, string> = {};
    if (f.food_cost)      { et.push("Food");      ea["Food"]      = String(f.food_cost); }
    if (f.staff_cost)     { et.push("Staff");     ea["Staff"]     = String(f.staff_cost); }
    if (f.operation_cost) { et.push("Operation"); ea["Operation"] = String(f.operation_cost); }
    setExpTypes(et); setExpAmts(ea);
  }

  function reset() {
    setDate(""); setWeekStart(""); setLocs([]); setRests([]);
    setPartners([]); setOrders(""); setGross(""); setNet("");
    setExpTypes([]); setExpAmts({}); setEditing(false); onDone();
  }

  function showToast(type: "ok" | "err", msg: string) {
    setToast({ type, msg }); setTimeout(() => setToast(null), 4000);
  }

  async function save() {
    if (!weekStart) return showToast("err", "Date দাও।");
    if (!rests.length) return showToast("err", "Restaurant select করো।");
    if (!partners.length) return showToast("err", "Partner select করো।");
    setSaving(true);
    const rows = rests.flatMap(rn => partners.map(p => ({
      restaurant_id:   RESTAURANT_IDS[rn],
      location:        Object.entries(RESTAURANTS_BY_LOCATION).find(([, v]) => v.includes(rn))?.[0] || "",
      restaurant_name: rn,
      week_start:      weekStart,
      partner:         p,
      orders:          parseInt(orders) || 0,
      gross_revenue:   parseFloat(gross) || 0,
      net_revenue:     parseFloat(net) || 0,
      food_cost:       parseFloat(expAmts["Food"] || "0") || 0,
      staff_cost:      parseFloat(expAmts["Staff"] || "0") || 0,
      operation_cost:  parseFloat(expAmts["Operation"] || "0") || 0,
    })));
    const { error } = await supabase.from("report_weekly_data").upsert(rows, { onConflict: "restaurant_id,week_start,partner" });
    setSaving(false);
    if (error) showToast("err", error.message);
    else { showToast("ok", `${rows.length} rows saved!`); reset(); }
  }

  const totalExp = expTypes.reduce((s, t) => s + (parseFloat(expAmts[t] || "0") || 0), 0);

  return (
    <div className="space-y-4">
      {editing && (
        <div className="px-4 py-2.5 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800 flex justify-between items-center">
          <span>✏️ Editing week of <strong>{wLabel(weekStart)}</strong></span>
          <button onClick={reset} className="text-xs text-yellow-600 hover:underline">Cancel</button>
        </div>
      )}
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-6">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">Date (সপ্তাহের যেকোনো তারিখ)</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:border-[#F5C800] focus:outline-none" />
        </div>
        {weekStart && <p className="text-sm text-gray-500 pt-4">Week of <strong className="text-gray-900">{wLabel(weekStart)}</strong></p>}
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-5 grid grid-cols-2 gap-4">
        <MS label="Location" options={LOCATIONS} selected={locs} onChange={setLocs} />
        <MS label="Restaurant" options={availRests.length ? availRests : Object.values(RESTAURANTS_BY_LOCATION).flat()} selected={rests} onChange={setRests} />
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Revenue</p>
        <div className="grid grid-cols-2 gap-4">
          <MS label="Delivery Partner" options={PARTNERS} selected={partners} onChange={setPartners} />
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Number of Orders</label>
            <input type="number" min={0} value={orders} onChange={e => setOrders(e.target.value)} placeholder="0"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:border-[#F5C800] focus:outline-none" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Gross Revenue ($)</label>
            <input type="number" min={0} value={gross} onChange={e => setGross(e.target.value)} placeholder="0.00"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:border-[#F5C800] focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Net Revenue ($)</label>
            <input type="number" min={0} value={net} onChange={e => setNet(e.target.value)} placeholder="0.00"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:border-[#F5C800] focus:outline-none" />
          </div>
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Expenses</p>
        <MS label="Expense Types" options={EXPENSE_TYPES} selected={expTypes} onChange={setExpTypes} />
        {expTypes.map(t => (
          <div key={t} className="flex items-center gap-3">
            <label className="text-sm text-gray-600 w-24">{t} ($)</label>
            <input type="number" min={0} value={expAmts[t] || ""} onChange={e => setExpAmts(p => ({ ...p, [t]: e.target.value }))}
              placeholder="0.00" className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-[#F5C800] focus:outline-none" />
          </div>
        ))}
        {expTypes.length > 0 && (
          <div className="flex justify-between text-sm pt-1 border-t border-gray-100">
            <span className="text-gray-500">Total Expenses</span>
            <span className="font-semibold text-red-500">{fm(totalExp)}</span>
          </div>
        )}
      </div>
      {(gross || net || totalExp > 0) && (
        <div className="bg-[#F5C800]/10 border border-[#F5C800]/30 rounded-xl p-4 flex items-center justify-between">
          <div className="flex gap-6">
            <div><p className="text-xs text-gray-500">Gross</p><p className="font-bold">{fm(parseFloat(gross)||0)}</p></div>
            <div><p className="text-xs text-gray-500">Net</p><p className="font-bold">{fm(parseFloat(net)||0)}</p></div>
            <div><p className="text-xs text-gray-500">Cost</p><p className="font-bold text-red-500">{fm(totalExp)}</p></div>
            <div><p className="text-xs text-gray-500">Profit</p>
              <p className={`font-bold ${(parseFloat(net)||0)-totalExp >= 0 ? "text-green-600":"text-red-500"}`}>{fm((parseFloat(net)||0)-totalExp)}</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">{rests.length} × {partners.length} = <strong>{rests.length*partners.length} rows</strong></p>
        </div>
      )}
      <button onClick={save} disabled={saving}
        className="w-full py-3 bg-[#F5C800] text-black font-black rounded-xl hover:bg-yellow-300 disabled:opacity-50 text-sm">
        {saving ? "Saving..." : editing ? "Update Entry" : "Save Entry"}
      </button>
      <Toast toast={toast} />
    </div>
  );
}

// ── Upload Tab ────────────────────────────────────────────────────────────────
function UploadTab() {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<UploadRow[]>([]);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [imported, setImported] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const PAGE_SIZE = 20;

  function showToast(type: "ok" | "err", msg: string) {
    setToast({ type, msg }); setTimeout(() => setToast(null), 5000);
  }

  const filtered = rows.filter(r =>
    !search ||
    r.restaurant_name.toLowerCase().includes(search.toLowerCase()) ||
    r.partner.toLowerCase().includes(search.toLowerCase()) ||
    r.week_start.includes(search)
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  function parseCSV(text: string): UploadRow[] {
    const lines = text.replace(/\r/g, "").split("\n").filter(l => l.trim());
    if (lines.length < 2) return [];
    const headers = parseLine(lines[0]).map(h => h.replace(/^"|"$/g,"").toLowerCase().trim());
    const fieldMap: Record<number, string> = {};
    headers.forEach((h, i) => { if (COLUMN_ALIASES[h]) fieldMap[i] = COLUMN_ALIASES[h]; });

    const get = (vals: string[], field: string) => {
      const idx = Object.entries(fieldMap).find(([,f]) => f === field)?.[0];
      return idx !== undefined ? vals[parseInt(idx)]?.replace(/,/g,"").trim() || "" : "";
    };

    const map: Record<string, UploadRow> = {};
    const skip: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const vals = parseLine(lines[i]).map(v => v.replace(/^"|"$/g,""));
      if (vals.every(v => !v)) continue;
      const rawDate = get(vals, "date");
      if (!rawDate) continue;
      const ws = toMonday(rawDate);
      if (!ws) continue;
      const rawRest = get(vals, "restaurant") || get(vals, "location");
      if (!rawRest) continue;
      const restId = RESTAURANT_FUZZY[rawRest.toLowerCase().trim()];
      if (!restId) { skip.push(`Row ${i+1}: "${rawRest}"`); continue; }
      const partner = get(vals, "partner") || "Store";
      const key = `${restId}__${ws}__${partner}`;
      if (!map[key]) {
        map[key] = {
          restaurant_id: restId, location: ID_TO_LOCATION[restId] || "",
          restaurant_name: ID_TO_NAME[restId] || rawRest, week_start: ws, partner,
          orders: parseFloat(get(vals,"orders")) || 0,
          gross_revenue: parseFloat(get(vals,"gross_revenue")) || 0,
          net_revenue: parseFloat(get(vals,"net_revenue")) || 0,
          food_cost: parseFloat(get(vals,"food_cost")) || 0,
          staff_cost: parseFloat(get(vals,"staff_cost")) || 0,
          operation_cost: parseFloat(get(vals,"operation_cost")) || 0,
        };
      }
      const et = get(vals, "expense_type").toLowerCase();
      const ea = parseFloat(get(vals, "expense_amount")) || 0;
      if (et === "food")      map[key].food_cost      = ea;
      if (et === "staff")     map[key].staff_cost     = ea;
      if (et === "operation") map[key].operation_cost = ea;
    }
    setSkipped(skip);
    return Object.values(map);
  }

  async function handleFile(f: File) {
    setFileName(f.name); setLoading(true); setRows([]); setImported(false);
    const text = await f.text();
    const parsed = parseCSV(text);
    if (!parsed.length) showToast("err", "কোনো valid row পাওয়া যায়নি।");
    else setRows(parsed);
    setLoading(false); setPage(1);
  }

  async function doImport() {
    setLoading(true);
    const { error } = await supabase.from("report_weekly_data").upsert(rows, { onConflict: "restaurant_id,week_start,partner" });
    setLoading(false);
    if (error) showToast("err", error.message);
    else { setImported(true); setRows([]); setFileName(""); }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0]; if (f) handleFile(f);
  }, []);

  function dlTemplate() {
    const csv = "date,resturent name,delivery partner,number of order,gross revenue,net revenue,expenses type,expenses amount\n2026-01-04,ANGIES- ST ALBANS,Store,303,7820,7820,Food,5586\n2026-01-04,ANGIES- ST ALBANS,Store,303,7820,7820,Staff,2970\n2026-01-04,ANGIES- ST ALBANS,Uber Eats,131,5344,2788,,";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "angies_template.csv"; a.click();
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-bold text-gray-800 mb-1">File Upload</h2>
        <p className="text-sm text-gray-500 mb-4">CSV file upload করো — column name যাই হোক automatically match করবে।</p>
        <div onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
          onDrop={onDrop} onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${dragging ? "border-[#F5C800] bg-yellow-50" : "border-gray-200 hover:border-gray-300"}`}>
          {loading ? <p className="text-gray-400 text-sm">Processing...</p> :
            fileName ? <div><p className="text-2xl mb-2">📄</p><p className="text-gray-700 font-medium text-sm">{fileName}</p><p className="text-gray-400 text-xs mt-1">Click to change</p></div> :
            <div><p className="text-3xl mb-3">📂</p><p className="text-gray-600 font-medium text-sm">CSV file drag করো</p><p className="text-gray-400 text-xs mt-1">অথবা click করো</p></div>}
          <input ref={inputRef} type="file" accept=".csv,.txt" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </div>
        <button onClick={dlTemplate} className="mt-3 text-sm text-[#F5C800] hover:underline">⬇ Template download করো</button>
      </div>

      {imported && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-center justify-between">
          <div><p className="font-semibold text-green-800">✅ Import successful!</p><p className="text-sm text-green-600 mt-0.5">Data Supabase এ save হয়েছে।</p></div>
          <div className="flex gap-3">
            <button onClick={() => setImported(false)} className="px-4 py-2 border border-green-300 text-green-700 text-sm rounded-lg hover:bg-green-100">Upload More</button>
            <Link href="/report" className="px-4 py-2 bg-[#F5C800] text-black font-bold text-sm rounded-lg hover:bg-yellow-300">Go to Report →</Link>
          </div>
        </div>
      )}

      {skipped.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-yellow-800 mb-1">⚠ {skipped.length} rows skip হয়েছে:</p>
          <ul className="text-xs text-yellow-700 space-y-0.5">{skipped.slice(0,5).map((s,i) => <li key={i}>{s}</li>)}{skipped.length > 5 && <li>...and {skipped.length-5} more</li>}</ul>
        </div>
      )}

      {rows.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
            <p className="text-sm font-semibold text-gray-700 flex-shrink-0">{rows.length} rows</p>
            <input type="text" placeholder="Search..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:border-[#F5C800] focus:outline-none" />
            <button onClick={doImport} disabled={loading}
              className="px-5 py-2 bg-[#F5C800] text-black font-bold rounded-lg text-sm hover:bg-yellow-300 disabled:opacity-50 flex-shrink-0">
              {loading ? "Importing..." : "Import Now"}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-gray-400 border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">Restaurant</th>
                  <th className="text-left px-4 py-2.5 font-medium">Week</th>
                  <th className="text-left px-4 py-2.5 font-medium">Partner</th>
                  <th className="text-right px-4 py-2.5 font-medium">Orders</th>
                  <th className="text-right px-4 py-2.5 font-medium">Gross</th>
                  <th className="text-right px-4 py-2.5 font-medium">Net</th>
                  <th className="text-right px-4 py-2.5 font-medium">Food</th>
                  <th className="text-right px-4 py-2.5 font-medium">Staff</th>
                  <th className="text-right px-4 py-2.5 font-medium">Op.</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((r, i) => (
                  <tr key={i} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-700">{r.restaurant_name}</td>
                    <td className="px-4 py-2 text-gray-500">{wLabel(r.week_start)}</td>
                    <td className="px-4 py-2 text-gray-500">{r.partner}</td>
                    <td className="px-4 py-2 text-right">{r.orders}</td>
                    <td className="px-4 py-2 text-right">{fm(r.gross_revenue)}</td>
                    <td className="px-4 py-2 text-right">{fm(r.net_revenue)}</td>
                    <td className="px-4 py-2 text-right text-gray-400">{r.food_cost ? fm(r.food_cost) : "—"}</td>
                    <td className="px-4 py-2 text-right text-gray-400">{r.staff_cost ? fm(r.staff_cost) : "—"}</td>
                    <td className="px-4 py-2 text-right text-gray-400">{r.operation_cost ? fm(r.operation_cost) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-400">Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, filtered.length)} of {filtered.length}</p>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">← Prev</button>
                {Array.from({length: Math.min(totalPages,7)}, (_,i) => i+1).map(p => (
                  <button key={p} onClick={() => setPage(p)} className={`px-3 py-1.5 text-xs border rounded-lg ${page===p?"bg-[#F5C800] border-[#F5C800] font-bold":"border-gray-200 hover:bg-gray-50"}`}>{p}</button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next →</button>
              </div>
            </div>
          )}
        </div>
      )}
      <Toast toast={toast} />
    </div>
  );
}

// ── History Tab ───────────────────────────────────────────────────────────────
interface WeekRow { week_start: string; total_gross: number; total_net: number; total_cost: number; rows: number; }

function HistoryTab({ onEdit }: { onEdit: (ws: string) => void }) {
  const [weeks, setWeeks] = useState<WeekRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string|null>(null);
  const [toast, setToast] = useState<{ type: "ok"|"err"; msg: string }|null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("report_weekly_data")
      .select("week_start,gross_revenue,net_revenue,food_cost,staff_cost,operation_cost")
      .order("week_start", { ascending: false });
    if (!data) { setLoading(false); return; }
    const map: Record<string, WeekRow> = {};
    for (const r of data) {
      const ws = r.week_start;
      if (!map[ws]) map[ws] = { week_start: ws, total_gross: 0, total_net: 0, total_cost: 0, rows: 0 };
      map[ws].total_gross += r.gross_revenue || 0;
      map[ws].total_net   += r.net_revenue || 0;
      map[ws].total_cost  += (r.food_cost||0) + (r.staff_cost||0) + (r.operation_cost||0);
      map[ws].rows++;
    }
    setWeeks(Object.values(map).sort((a,b) => b.week_start.localeCompare(a.week_start)));
    setLoading(false);
  }

  async function del(ws: string) {
    if (!confirm(`Delete week of ${wLabel(ws)}?`)) return;
    setDeleting(ws);
    const { error } = await supabase.from("report_weekly_data").delete().eq("week_start", ws);
    setDeleting(null);
    if (error) setToast({ type: "err", msg: error.message });
    else { setToast({ type: "ok", msg: "Deleted!" }); load(); setTimeout(() => setToast(null), 3000); }
  }

  if (loading) return <div className="text-center py-20 text-gray-400 text-sm">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
          <p className="text-sm font-semibold text-gray-700">{weeks.length} weeks saved</p>
        </div>
        {weeks.length === 0 && <div className="text-center py-16 text-gray-400 text-sm">কোনো data নেই।</div>}
        <table className="w-full text-sm">
          <thead className="text-xs text-gray-400 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3 font-medium">Week</th>
              <th className="text-right px-4 py-3 font-medium">Rows</th>
              <th className="text-right px-4 py-3 font-medium">Gross</th>
              <th className="text-right px-4 py-3 font-medium">Net</th>
              <th className="text-right px-4 py-3 font-medium">Cost</th>
              <th className="text-right px-4 py-3 font-medium">Profit</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {weeks.map(w => {
              const profit = w.total_net - w.total_cost;
              return (
                <tr key={w.week_start} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3.5 font-medium text-gray-800">{wLabel(w.week_start)}</td>
                  <td className="px-4 py-3.5 text-right text-gray-400">{w.rows}</td>
                  <td className="px-4 py-3.5 text-right text-gray-700">{fm(w.total_gross)}</td>
                  <td className="px-4 py-3.5 text-right text-gray-700">{fm(w.total_net)}</td>
                  <td className="px-4 py-3.5 text-right text-red-500">{fm(w.total_cost)}</td>
                  <td className={`px-4 py-3.5 text-right font-semibold ${profit>=0?"text-green-600":"text-red-500"}`}>{fm(profit)}</td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => onEdit(w.week_start)} className="text-xs text-[#F5C800] font-medium hover:underline">Edit</button>
                      <button onClick={() => del(w.week_start)} disabled={deleting===w.week_start} className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50">
                        {deleting===w.week_start ? "..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Toast toast={toast} />
    </div>
  );
}
