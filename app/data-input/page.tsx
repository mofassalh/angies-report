"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

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

// Fuzzy match: restaurant name from file → our ID
const RESTAURANT_FUZZY: Record<string, string> = {
  "angies- st albans":      "angies-st-albans",
  "angies-st-albans":       "angies-st-albans",
  "angies st albans":       "angies-st-albans",
  "angie's st albans":      "angies-st-albans",
  "golden flames":          "golden-flames-st-albans",
  "golden flames ":         "golden-flames-st-albans",
  "golden-flames":          "golden-flames-st-albans",
  "angies- fitzroy north":  "angies-fitzroy-north",
  "angies-fitzroy-north":   "angies-fitzroy-north",
  "angies fitzroy north":   "angies-fitzroy-north",
  "angie's fitzroy north":  "angies-fitzroy-north",
  "lamb on nicholson":      "lamb-on-nicholson",
  "lamb on nicholson ":     "lamb-on-nicholson",
  "angies - ascot vale":    "angies-ascot-vale",
  "angies-ascot-vale":      "angies-ascot-vale",
  "angies ascot vale":      "angies-ascot-vale",
  "angie's ascot vale":     "angies-ascot-vale",
  "ascot vale kebabs":      "ascot-vale-kebabs",
  "ascot vale kebabs ":     "ascot-vale-kebabs",
  "ascot-vale-kebabs":      "ascot-vale-kebabs",
  "goolden - ascot vale":   "ascot-vale-kebabs",
  "golden - ascot vale":    "ascot-vale-kebabs",
};

const RESTAURANT_ID_TO_LOCATION: Record<string, string> = {
  "angies-st-albans":         "ST ALBANS",
  "golden-flames-st-albans":  "ST ALBANS",
  "angies-fitzroy-north":     "FITZROY NORTH",
  "lamb-on-nicholson":        "FITZROY NORTH",
  "angies-ascot-vale":        "ASCOT VALE",
  "ascot-vale-kebabs":        "ASCOT VALE",
};

const RESTAURANT_ID_TO_NAME: Record<string, string> = {
  "angies-st-albans":         "ANGIES - ST ALBANS",
  "golden-flames-st-albans":  "GOLDEN FLAMES",
  "angies-fitzroy-north":     "ANGIES - FITZROY NORTH",
  "lamb-on-nicholson":        "LAMB ON NICHOLSON",
  "angies-ascot-vale":        "ANGIES - ASCOT VALE",
  "ascot-vale-kebabs":        "ASCOT VALE KEBABS",
};

const PARTNERS = ["Store", "Uber Eats", "DoorDash", "Menulog"];
const EXPENSE_TYPES = ["Food", "Staff", "Operation"];

// Fuzzy column matching — maps any header variation to our field name
const COLUMN_FUZZY: { field: string; aliases: string[] }[] = [
  { field: "date",           aliases: ["date", "week", "week_start", "week start", "period", "tarikh"] },
  // "resturent's name" in this file = location, "revenue type" = restaurant name
  { field: "location",       aliases: ["location", "loc", "area", "branch", "resturent's name", "resturents name", "restaurant's name", "restaurants name"] },
  { field: "restaurant",     aliases: ["restaurant", "resturent", "resturant", "revenue type", "restaurant name", "resturent name", "resturant name", "restaurant_name", "store name"] },
  { field: "partner",        aliases: ["partner", "delivery partner", "delivery_partner", "channel", "platform", "source"] },
  { field: "orders",         aliases: ["orders", "order", "number of order", "number of orders", "number of order", "no of orders", "transactions", "tx", "count"] },
  { field: "gross_revenue",  aliases: ["gross revenue", "gross_revenue", "gross sales", "gross_sales", "gross", "total sales", "total_sales", "revenue gross"] },
  { field: "net_revenue",    aliases: ["net revenue", "net_revenue", "net sales", "net_sales", "net", "revenue net"] },
  { field: "expense_type",   aliases: ["expense type", "expenses type", "expense_type", "expenses_type", "cost type", "cost_type"] },
  { field: "expense_amount", aliases: ["expense amount", "expenses amount", "expense_amount", "expenses_amount", "cost", "amount", "cost amount"] },
  { field: "food_cost",      aliases: ["food cost", "food_cost", "food", "cogs"] },
  { field: "staff_cost",     aliases: ["staff cost", "staff_cost", "staff", "labour", "labor", "wages"] },
  { field: "operation_cost", aliases: ["operation cost", "operation_cost", "operation", "operations", "overhead"] },
];

function fuzzyMatchColumn(header: string): string | null {
  const h = header.toLowerCase().trim();
  for (const { field, aliases } of COLUMN_FUZZY) {
    if (aliases.some((a) => h === a || h.includes(a) || a.includes(h))) return field;
  }
  return null;
}

function fuzzyMatchRestaurant(name: string): string | null {
  const n = name.toLowerCase().trim();
  return RESTAURANT_FUZZY[n] || null;
}

function getMondayOf(dateStr: string): string {
  // Try to parse various date formats
  let d: Date;
  if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    // DD/MM/YYYY or MM/DD/YYYY
    d = new Date(`${parts[2]}-${parts[1].padStart(2,"0")}-${parts[0].padStart(2,"0")}T00:00:00`);
  } else {
    d = new Date(dateStr.split("T")[0] + "T00:00:00");
  }
  if (isNaN(d.getTime())) return "";
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
}

function weekLabel(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

function fmt(n: number) {
  return "$" + (n || 0).toLocaleString("en-AU", { maximumFractionDigits: 0 });
}

type Tab = "entry" | "upload" | "history";
interface EditContext { week_start: string; }

// ── Multi-select dropdown ─────────────────────────────────────────────────────
function MultiSelect({ label, options, selected, onChange }: {
  label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  function toggle(opt: string) {
    if (selected.includes(opt)) onChange(selected.filter((s) => s !== opt));
    else onChange([...selected, opt]);
  }
  return (
    <div className="relative">
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-left flex items-center justify-between hover:border-[#F5C800] focus:outline-none focus:border-[#F5C800] transition-colors">
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
            <div onClick={() => selected.length === options.length ? onChange([]) : onChange([...options])}
              className="px-3 py-2 text-xs text-[#F5C800] font-semibold cursor-pointer hover:bg-yellow-50 border-b border-gray-100">
              {selected.length === options.length ? "Deselect All" : "Select All"}
            </div>
            {options.map((opt) => (
              <div key={opt} onClick={() => toggle(opt)}
                className="px-3 py-2.5 text-sm cursor-pointer hover:bg-gray-50 flex items-center gap-2.5">
                <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${selected.includes(opt) ? "bg-[#F5C800] border-[#F5C800]" : "border-gray-300"}`}>
                  {selected.includes(opt) && (
                    <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
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

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DataInputPage() {
  const [tab, setTab] = useState<Tab>("entry");
  const [editContext, setEditContext] = useState<EditContext | null>(null);

  function goEdit(week_start: string) {
    setEditContext({ week_start });
    setTab("entry");
  }

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
          <div className="flex gap-0 -mb-px">
            {([
              { key: "entry",   label: "Weekly Entry" },
              { key: "upload",  label: "File Upload" },
              { key: "history", label: "Saved History" },
            ] as { key: Tab; label: string }[]).map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-all ${tab === t.key ? "border-[#F5C800] text-gray-900" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-6 py-8">
        {tab === "entry"   && <EntryTab editContext={editContext} onEditDone={() => setEditContext(null)} />}
        {tab === "upload"  && <UploadTab />}
        {tab === "history" && <HistoryTab onEdit={goEdit} />}
      </div>
    </div>
  );
}

// ── Entry Tab ─────────────────────────────────────────────────────────────────
function EntryTab({ editContext, onEditDone }: { editContext: EditContext | null; onEditDone: () => void }) {
  const [date, setDate] = useState("");
  const [weekStart, setWeekStart] = useState("");
  const [locations, setLocations] = useState<string[]>([]);
  const [restaurants, setRestaurants] = useState<string[]>([]);
  const [partners, setPartners] = useState<string[]>([]);
  const [orders, setOrders] = useState("");
  const [grossRevenue, setGrossRevenue] = useState("");
  const [netRevenue, setNetRevenue] = useState("");
  const [expenseTypes, setExpenseTypes] = useState<string[]>([]);
  const [expenseAmounts, setExpenseAmounts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const availableRestaurants = locations.flatMap((l) => RESTAURANTS_BY_LOCATION[l] || []);

  useEffect(() => {
    setRestaurants((prev) => prev.filter((r) => availableRestaurants.includes(r)));
  }, [locations]);

  useEffect(() => {
    if (date) setWeekStart(getMondayOf(date));
  }, [date]);

  // Load data when editContext arrives
  useEffect(() => {
    if (!editContext) return;
    setIsEditing(true);
    setWeekStart(editContext.week_start);
    setDate(editContext.week_start);
    loadEditData(editContext.week_start);
  }, [editContext]);

  async function loadEditData(ws: string) {
    const { data } = await supabase
      .from("report_weekly_data")
      .select("*")
      .eq("week_start", ws);
    if (!data || data.length === 0) return;

    // Get unique restaurants and partners
    const restNames = [...new Set(data.map((r: any) => r.restaurant_name))];
    const partnerNames = [...new Set(data.map((r: any) => r.partner))];
    const locs = [...new Set(data.map((r: any) => r.location))];

    setLocations(locs as string[]);
    setRestaurants(restNames as string[]);
    setPartners(partnerNames as string[]);

    // Use first row's revenue/orders as representative
    const first = data[0];
    setOrders(String(first.orders || ""));
    setGrossRevenue(String(first.gross_revenue || ""));
    setNetRevenue(String(first.net_revenue || ""));

    // Expenses from first row
    const expTypes: string[] = [];
    const expAmts: Record<string, string> = {};
    if (first.food_cost)      { expTypes.push("Food");      expAmts["Food"]      = String(first.food_cost); }
    if (first.staff_cost)     { expTypes.push("Staff");     expAmts["Staff"]     = String(first.staff_cost); }
    if (first.operation_cost) { expTypes.push("Operation"); expAmts["Operation"] = String(first.operation_cost); }
    setExpenseTypes(expTypes);
    setExpenseAmounts(expAmts);
  }
  function reset() {
    setDate(""); setWeekStart(""); setLocations([]); setRestaurants([]);
    setPartners([]); setOrders(""); setGrossRevenue(""); setNetRevenue("");
    setExpenseTypes([]); setExpenseAmounts({});
    setIsEditing(false);
    onEditDone();
  }

  async function handleSave() {
    if (!weekStart)               return showToast("err", "Date দাও।");
    if (restaurants.length === 0) return showToast("err", "Restaurant select করো।");
    if (partners.length === 0)    return showToast("err", "Delivery partner select করো।");
    setSaving(true);
    const rows: object[] = [];
    for (const restName of restaurants) {
      const restId = RESTAURANT_IDS[restName];
      const loc = Object.entries(RESTAURANTS_BY_LOCATION).find(([, v]) => v.includes(restName))?.[0] || "";
      for (const partner of partners) {
        rows.push({
          restaurant_id:  restId,
          location:       loc,
          restaurant_name: restName,
          week_start:     weekStart,
          partner,
          orders:         parseInt(orders) || 0,
          gross_revenue:  parseFloat(grossRevenue) || 0,
          net_revenue:    parseFloat(netRevenue) || 0,
          food_cost:      parseFloat(expenseAmounts["Food"] || "0") || 0,
          staff_cost:     parseFloat(expenseAmounts["Staff"] || "0") || 0,
          operation_cost: parseFloat(expenseAmounts["Operation"] || "0") || 0,
        });
      }
    }
    const { error } = await supabase.from("report_weekly_data").upsert(rows, { onConflict: "restaurant_id,week_start,partner" });
    setSaving(false);
    if (error) showToast("err", error.message);
    else { showToast("ok", `${rows.length} rows saved!`); reset(); }
  }

  function showToast(type: "ok" | "err", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }

  const totalExpenses = expenseTypes.reduce((sum, t) => sum + (parseFloat(expenseAmounts[t] || "0") || 0), 0);

  return (
    <div className="space-y-4">
      {/* Date */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-6">
        {isEditing && (
          <div className="w-full mb-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 flex items-center justify-between">
            <span>✏️ Editing week of <strong>{weekLabel(weekStart)}</strong></span>
            <button onClick={reset} className="text-xs text-yellow-600 hover:underline">Cancel</button>
          </div>
        )}
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-6">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">Date (সপ্তাহের যেকোনো তারিখ)</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:border-[#F5C800] focus:outline-none" />
        </div>
        {weekStart && (
          <div className="text-sm text-gray-500 pt-4">
            Week of <span className="text-gray-900 font-semibold">{weekLabel(weekStart)}</span>
          </div>
        )}
      </div>

      {/* Location + Restaurant */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 grid grid-cols-2 gap-4">
        <MultiSelect label="Location" options={LOCATIONS} selected={locations} onChange={setLocations} />
        <MultiSelect
          label="Restaurant"
          options={availableRestaurants.length > 0 ? availableRestaurants : Object.values(RESTAURANTS_BY_LOCATION).flat()}
          selected={restaurants}
          onChange={setRestaurants}
        />
      </div>

      {/* Revenue */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Revenue</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <MultiSelect label="Delivery Partner" options={PARTNERS} selected={partners} onChange={setPartners} />
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Number of Orders</label>
            <input type="number" min={0} value={orders} onChange={(e) => setOrders(e.target.value)} placeholder="0"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:border-[#F5C800] focus:outline-none" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Gross Revenue ($)</label>
            <input type="number" min={0} value={grossRevenue} onChange={(e) => setGrossRevenue(e.target.value)} placeholder="0.00"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:border-[#F5C800] focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Net Revenue ($)</label>
            <input type="number" min={0} value={netRevenue} onChange={(e) => setNetRevenue(e.target.value)} placeholder="0.00"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:border-[#F5C800] focus:outline-none" />
          </div>
        </div>
      </div>

      {/* Expenses */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Expenses</h3>
        <div className="mb-4">
          <MultiSelect label="Expense Types" options={EXPENSE_TYPES} selected={expenseTypes} onChange={setExpenseTypes} />
        </div>
        {expenseTypes.length > 0 && (
          <div className="space-y-3">
            {expenseTypes.map((type) => (
              <div key={type} className="flex items-center gap-3">
                <label className="text-sm text-gray-600 w-24">{type} ($)</label>
                <input type="number" min={0} value={expenseAmounts[type] || ""} onChange={(e) => setExpenseAmounts((p) => ({ ...p, [type]: e.target.value }))}
                  placeholder="0.00"
                  className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-[#F5C800] focus:outline-none" />
              </div>
            ))}
            <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
              <span className="text-gray-500">Total Expenses</span>
              <span className="font-semibold text-red-500">{fmt(totalExpenses)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      {(grossRevenue || netRevenue || totalExpenses > 0) && (
        <div className="bg-[#F5C800]/10 border border-[#F5C800]/30 rounded-xl p-4 flex items-center gap-6">
          <div className="flex gap-6 flex-1">
            <div><p className="text-xs text-gray-500">Gross</p><p className="font-bold text-gray-900">{fmt(parseFloat(grossRevenue) || 0)}</p></div>
            <div><p className="text-xs text-gray-500">Net</p><p className="font-bold text-gray-900">{fmt(parseFloat(netRevenue) || 0)}</p></div>
            <div><p className="text-xs text-gray-500">Cost</p><p className="font-bold text-red-500">{fmt(totalExpenses)}</p></div>
            <div><p className="text-xs text-gray-500">Profit</p>
              <p className={`font-bold ${(parseFloat(netRevenue) || 0) - totalExpenses >= 0 ? "text-green-600" : "text-red-500"}`}>
                {fmt((parseFloat(netRevenue) || 0) - totalExpenses)}
              </p>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            {restaurants.length} restaurant × {partners.length} partner = <span className="font-semibold text-gray-700">{restaurants.length * partners.length} rows</span>
          </div>
        </div>
      )}

      <button onClick={handleSave} disabled={saving}
        className="w-full py-3 bg-[#F5C800] text-black font-black rounded-xl hover:bg-yellow-300 disabled:opacity-50 transition-colors text-sm">
        {saving ? "Saving..." : isEditing ? "Update Entry" : "Save Entry"}
      </button>

      {toast && (
        <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl text-sm font-medium shadow-lg z-50 ${toast.type === "ok" ? "bg-green-100 border border-green-300 text-green-800" : "bg-red-100 border border-red-300 text-red-800"}`}>
          {toast.type === "ok" ? "✅ " : "❌ "}{toast.msg}
        </div>
      )}
    </div>
  );
}

// ── Upload Tab ────────────────────────────────────────────────────────────────
interface ParsedRow {
  restaurant_id: string;
  location: string;
  restaurant_name: string;
  week_start: string;
  partner: string;
  orders: number;
  gross_revenue: number;
  net_revenue: number;
  food_cost: number;
  staff_cost: number;
  operation_cost: number;
}

function UploadTab() {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<ParsedRow[]>([]);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [imported, setImported] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = preview.filter((r) =>
    !search || r.restaurant_name.toLowerCase().includes(search.toLowerCase()) ||    r.partner.toLowerCase().includes(search.toLowerCase()) ||
    r.week_start.includes(search)
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === "," && !inQuotes) { result.push(current.trim()); current = ""; }
      else { current += ch; }
    }
    result.push(current.trim());
    return result;
  }

  function parseCSV(text: string): ParsedRow[] {
    const lines = text.replace(/\r/g, "").trim().split("\n").filter((l) => l.trim());
    if (lines.length < 2) return [];

    const rawHeaders = parseCSVLine(lines[0]).map((h) => h.replace(/^"|"$/g, ""));
    const fieldMap: Record<number, string> = {};
    for (let i = 0; i < rawHeaders.length; i++) {
      const matched = fuzzyMatchColumn(rawHeaders[i]);
      if (matched) fieldMap[i] = matched;
    }

    const rowMap: Record<string, ParsedRow> = {};
    const skippedRows: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const vals = parseCSVLine(lines[i]).map((v) => v.replace(/^"|"$/g, "").replace(/,/g, ""));
      if (vals.every((v) => !v)) continue;

      const get = (field: string) => {
        const idx = Object.entries(fieldMap).find(([, f]) => f === field)?.[0];
        return idx !== undefined ? vals[parseInt(idx)]?.trim() || "" : "";
      };

      const rawDate = get("date");
      if (!rawDate) continue;

      const weekStart = getMondayOf(rawDate);
      if (!weekStart) continue;

      // Try restaurant field first, then location field
      const rawRest = get("restaurant") || get("location");
      if (!rawRest) continue;

      const restId = fuzzyMatchRestaurant(rawRest);
      if (!restId) {
        skippedRows.push(`Row ${i + 1}: unknown restaurant "${rawRest}"`);
        continue;
      }

      const rawPartner = get("partner");
      const partner = rawPartner || "Store";
      const key = `${restId}__${weekStart}__${partner}`;

      const expType = get("expense_type").toLowerCase();
      const expAmt = parseFloat(get("expense_amount").replace(/,/g, "")) || 0;

      if (!rowMap[key]) {
        rowMap[key] = {
          restaurant_id:   restId,
          location:        RESTAURANT_ID_TO_LOCATION[restId] || "",
          restaurant_name: RESTAURANT_ID_TO_NAME[restId] || rawRest,
          week_start:      weekStart,
          partner,
          orders:          parseFloat(get("orders")) || 0,
          gross_revenue:   parseFloat(get("gross_revenue").replace(/,/g, "")) || 0,
          net_revenue:     parseFloat(get("net_revenue").replace(/,/g, "")) || 0,
          food_cost:       parseFloat(get("food_cost").replace(/,/g, "")) || 0,
          staff_cost:      parseFloat(get("staff_cost").replace(/,/g, "")) || 0,
          operation_cost:  parseFloat(get("operation_cost").replace(/,/g, "")) || 0,
        };
      }

      // Merge expense rows
      if (expType === "food")      rowMap[key].food_cost      = expAmt;
      if (expType === "staff")     rowMap[key].staff_cost     = expAmt;
      if (expType === "operation") rowMap[key].operation_cost = expAmt;
    }

    setSkipped(skippedRows);
    return Object.values(rowMap);
  }

  async function processFile(file: File) {
    setFileName(file.name);
    setUploading(true);
    setPreview([]);
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length === 0) {
        showToast("err", "কোনো valid row পাওয়া যায়নি।");
        setUploading(false);
        return;
      }
      setPreview(rows);
    } catch (e: any) {
      showToast("err", e.message || "File parse error");
    }
    setUploading(false);
  }

  async function handleImport() {
    if (preview.length === 0) return;
    setUploading(true);
    const { error } = await supabase
      .from("report_weekly_data")
      .upsert(preview, { onConflict: "restaurant_id,week_start,partner" });
    setUploading(false);
    if (error) showToast("err", error.message);
    else {
      showToast("ok", `${preview.length} rows imported!`);
      setImported(true);
      setPreview([]);
      setFileName("");
    }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  }, []);

  function downloadTemplate() {
    const header = "date,resturent name,delivery partner,number of order,gross revenue,net revenue,expenses type,expenses amount";
    const ex1 = "2026-01-04,ANGIES- ST ALBANS,Store,303,7820,7820,Food,5586";
    const ex2 = "2026-01-04,ANGIES- ST ALBANS,Store,303,7820,7820,Staff,2970";
    const ex3 = "2026-01-04,ANGIES- ST ALBANS,Uber Eats,131,5344,2788,,";
    const blob = new Blob([[header, ex1, ex2, ex3].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "angies_template.csv"; a.click();
  }

  return (
    <div className="space-y-5">
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-bold text-gray-800 mb-1">File Upload</h2>
        <p className="text-sm text-gray-500 mb-5">
          Excel এর <strong>Data Input</strong> sheet CSV export করো, অথবা যেকোনো CSV দাও।
          Column name যাই হোক — automatically match করবে।
        </p>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${dragging ? "border-[#F5C800] bg-yellow-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}
        >
          {uploading ? (
            <p className="text-gray-500 text-sm">Processing...</p>
          ) : fileName ? (
            <div>
              <p className="text-2xl mb-2">📄</p>
              <p className="text-gray-700 font-medium text-sm">{fileName}</p>
              <p className="text-gray-400 text-xs mt-1">Click to change file</p>
            </div>
          ) : (
            <div>
              <p className="text-3xl mb-3">📂</p>
              <p className="text-gray-600 font-medium text-sm">CSV file drag করো</p>
              <p className="text-gray-400 text-xs mt-1">অথবা click করে browse করো</p>
            </div>
          )}
          <input ref={inputRef} type="file" accept=".csv,.txt,.xlsx" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }} />
        </div>

        <button onClick={downloadTemplate} className="mt-3 text-sm text-[#F5C800] hover:underline">
          ⬇ Template download করো
        </button>
      </div>

      {/* Skipped rows warning */}
      {skipped.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-yellow-800 mb-2">⚠ {skipped.length} rows skip হয়েছে:</p>
          <ul className="text-xs text-yellow-700 space-y-0.5">
            {skipped.slice(0, 5).map((s, i) => <li key={i}>{s}</li>)}
            {skipped.length > 5 && <li>...and {skipped.length - 5} more</li>}
          </ul>
        </div>
      )}

      {/* Imported success */}
      {imported && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="font-semibold text-green-800">✅ Import successful!</p>
            <p className="text-sm text-green-600 mt-0.5">Data Supabase এ save হয়েছে।</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setImported(false)}
              className="px-4 py-2 border border-green-300 text-green-700 text-sm rounded-lg hover:bg-green-100">
              Upload More
            </button>
            <a href="/report"
              className="px-4 py-2 bg-[#F5C800] text-black font-bold text-sm rounded-lg hover:bg-yellow-300">
              Go to Report →
            </a>
          </div>
        </div>
      )}

      {/* Preview */}
      {preview.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-gray-700 flex-shrink-0">{preview.length} rows ready</p>
            <input
              type="text" placeholder="Search restaurant, partner, date..."
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:border-[#F5C800] focus:outline-none"
            />
            <button onClick={handleImport} disabled={uploading}
              className="px-5 py-2 bg-[#F5C800] text-black font-bold rounded-lg text-sm hover:bg-yellow-300 disabled:opacity-50 flex-shrink-0">
              {uploading ? "Importing..." : "Import Now"}
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
                  <th className="text-right px-4 py-2.5 font-medium">Operation</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((r, i) => (
                  <tr key={i} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-700">{r.restaurant_name}</td>
                    <td className="px-4 py-2 text-gray-500">{weekLabel(r.week_start)}</td>
                    <td className="px-4 py-2 text-gray-500">{r.partner}</td>
                    <td className="px-4 py-2 text-right text-gray-700">{r.orders}</td>
                    <td className="px-4 py-2 text-right text-gray-700">{fmt(r.gross_revenue)}</td>
                    <td className="px-4 py-2 text-right text-gray-700">{fmt(r.net_revenue)}</td>
                    <td className="px-4 py-2 text-right text-gray-500">{r.food_cost ? fmt(r.food_cost) : "—"}</td>
                    <td className="px-4 py-2 text-right text-gray-500">{r.staff_cost ? fmt(r.staff_cost) : "—"}</td>
                    <td className="px-4 py-2 text-right text-gray-500">{r.operation_cost ? fmt(r.operation_cost) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-400">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">← Prev</button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`px-3 py-1.5 text-xs border rounded-lg ${page === p ? "bg-[#F5C800] border-[#F5C800] font-bold" : "border-gray-200 hover:bg-gray-50"}`}>
                      {p}
                    </button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next →</button>
              </div>
            </div>
          )}
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl text-sm font-medium shadow-lg z-50 ${toast.type === "ok" ? "bg-green-100 border border-green-300 text-green-800" : "bg-red-100 border border-red-300 text-red-800"}`}>
          {toast.type === "ok" ? "✅ " : "❌ "}{toast.msg}
        </div>
      )}
    </div>
  );
}

// ── History Tab ───────────────────────────────────────────────────────────────
interface WeekRow {
  week_start: string;
  total_gross: number;
  total_net: number;
  total_cost: number;
  row_count: number;
}

function HistoryTab({ onEdit }: { onEdit: (week_start: string) => void }) {
  const [weeks, setWeeks] = useState<WeekRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  useEffect(() => { loadWeeks(); }, []);

  async function loadWeeks() {
    setLoading(true);
    const { data } = await supabase
      .from("report_weekly_data")
      .select("week_start, gross_revenue, net_revenue, food_cost, staff_cost, operation_cost")
      .order("week_start", { ascending: false });

    if (!data) { setLoading(false); return; }
    const map: Record<string, WeekRow> = {};
    for (const row of data) {
      const ws = row.week_start;
      if (!map[ws]) map[ws] = { week_start: ws, total_gross: 0, total_net: 0, total_cost: 0, row_count: 0 };
      map[ws].total_gross += row.gross_revenue || 0;
      map[ws].total_net   += row.net_revenue || 0;
      map[ws].total_cost  += (row.food_cost || 0) + (row.staff_cost || 0) + (row.operation_cost || 0);
      map[ws].row_count++;
    }
    setWeeks(Object.values(map).sort((a, b) => b.week_start.localeCompare(a.week_start)));
    setLoading(false);
  }

  async function deleteWeek(ws: string) {
    if (!confirm(`Delete week of ${weekLabel(ws)}?`)) return;
    setDeleting(ws);
    const { error } = await supabase.from("report_weekly_data").delete().eq("week_start", ws);
    setDeleting(null);
    if (error) setToast({ type: "err", msg: error.message });
    else { setToast({ type: "ok", msg: "Deleted!" }); loadWeeks(); setTimeout(() => setToast(null), 3000); }
  }

  if (loading) return <div className="text-center py-20 text-gray-400 text-sm">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
          <p className="text-sm font-semibold text-gray-700">{weeks.length} weeks saved</p>
        </div>
        {weeks.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-sm">কোনো data নেই।</div>
        )}
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
            {weeks.map((w) => {
              const profit = w.total_net - w.total_cost;
              return (
                <tr key={w.week_start} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-gray-800">{weekLabel(w.week_start)}</td>
                  <td className="px-4 py-3.5 text-right text-gray-400">{w.row_count}</td>
                  <td className="px-4 py-3.5 text-right text-gray-700">{fmt(w.total_gross)}</td>
                  <td className="px-4 py-3.5 text-right text-gray-700">{fmt(w.total_net)}</td>
                  <td className="px-4 py-3.5 text-right text-red-500">{fmt(w.total_cost)}</td>
                  <td className={`px-4 py-3.5 text-right font-semibold ${profit >= 0 ? "text-green-600" : "text-red-500"}`}>{fmt(profit)}</td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => onEdit(w.week_start)}
                        className="text-xs text-[#F5C800] hover:underline font-medium">
                        Edit
                      </button>
                      <button onClick={() => deleteWeek(w.week_start)} disabled={deleting === w.week_start}
                        className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50">
                        {deleting === w.week_start ? "..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {toast && (
        <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl text-sm font-medium shadow-lg z-50 ${toast.type === "ok" ? "bg-green-100 border border-green-300 text-green-800" : "bg-red-100 border border-red-300 text-red-800"}`}>
          {toast.type === "ok" ? "✅ " : "❌ "}{toast.msg}
        </div>
      )}
    </div>
  );
}
