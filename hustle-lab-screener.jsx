import { useState, useMemo } from "react";

const T = {
  bg: "#0a0a0a", surface: "#111111", border: "#1e1e1e", borderBright: "#2a2a2a",
  accent: "#c8f135", accentDim: "#8aaa1f", accentGlow: "rgba(200,241,53,0.10)",
  text: "#f0f0f0", textMuted: "#555555", textDim: "#888888",
  red: "#f87171", amber: "#fbbf24", green: "#4ade80", blue: "#38bdf8",
};

const INDUSTRIES = {
  hvac:            { label: "HVAC Services",             sdeL: 2.5, sdeH: 4.5, margin: 0.18, recurring: 3, pe: 4, labor: 4, recession: 4 },
  plumbing:        { label: "Plumbing",                  sdeL: 2.5, sdeH: 4.0, margin: 0.20, recurring: 3, pe: 4, labor: 4, recession: 4 },
  electrical:      { label: "Electrical Contracting",    sdeL: 2.5, sdeH: 4.0, margin: 0.18, recurring: 2, pe: 3, labor: 4, recession: 4 },
  pestControl:     { label: "Pest Control",              sdeL: 3.0, sdeH: 6.0, margin: 0.28, recurring: 5, pe: 5, labor: 3, recession: 5 },
  landscaping:     { label: "Landscaping",               sdeL: 2.5, sdeH: 4.0, margin: 0.16, recurring: 4, pe: 5, labor: 5, recession: 3 },
  roofing:         { label: "Roofing Contractors",       sdeL: 2.0, sdeH: 3.5, margin: 0.15, recurring: 1, pe: 5, labor: 4, recession: 4 },
  carWash:         { label: "Car Wash",                  sdeL: 4.0, sdeH: 7.0, margin: 0.35, recurring: 4, pe: 5, labor: 1, recession: 3 },
  laundromat:      { label: "Laundromat",                sdeL: 2.5, sdeH: 4.5, margin: 0.30, recurring: 5, pe: 3, labor: 1, recession: 5 },
  autoRepair:      { label: "Auto Repair",               sdeL: 2.0, sdeH: 3.5, margin: 0.17, recurring: 3, pe: 3, labor: 4, recession: 4 },
  homeCleaning:    { label: "Home Cleaning",             sdeL: 2.0, sdeH: 4.0, margin: 0.18, recurring: 5, pe: 3, labor: 5, recession: 3 },
  restoration:     { label: "Restoration Services",      sdeL: 2.5, sdeH: 4.5, margin: 0.22, recurring: 2, pe: 5, labor: 4, recession: 5 },
  homeCare:        { label: "Home Care Services",        sdeL: 2.5, sdeH: 5.0, margin: 0.16, recurring: 5, pe: 5, labor: 5, recession: 5 },
  commercialClean: { label: "Commercial Cleaning",       sdeL: 2.0, sdeH: 3.5, margin: 0.16, recurring: 5, pe: 4, labor: 5, recession: 5 },
  gasStation:      { label: "Gas Station / C-Store",     sdeL: 3.0, sdeH: 5.0, margin: 0.08, recurring: 4, pe: 4, labor: 3, recession: 4 },
  restaurant:      { label: "Restaurant / Food Service", sdeL: 1.5, sdeH: 3.0, margin: 0.10, recurring: 2, pe: 3, labor: 5, recession: 2 },
  septic:          { label: "Septic & Drain Services",   sdeL: 2.5, sdeH: 4.0, margin: 0.25, recurring: 5, pe: 4, labor: 3, recession: 5 },
  movingStorage:   { label: "Moving & Storage",          sdeL: 2.0, sdeH: 3.5, margin: 0.15, recurring: 1, pe: 2, labor: 5, recession: 2 },
};

const GRADE_CONFIG = {
  Diamond: { color: "#38bdf8", icon: "💎" },
  Polished: { color: "#c8f135", icon: "✦" },
  Rough:    { color: "#fbbf24", icon: "◈" },
  Pass:     { color: "#f87171", icon: "✕" },
};

const CRITERIA = [
  { key: "cashFlow",   label: "Cash Flow & SDE",    subtitle: "The Engine",        weight: 25 },
  { key: "valuation",  label: "Valuation Multiple",  subtitle: "The Price Tag",     weight: 25 },
  { key: "transfer",   label: "Transferability",     subtitle: "The Handoff",       weight: 20 },
  { key: "moat",       label: "Moat & Market",       subtitle: "The Defensibility", weight: 15 },
  { key: "upside",     label: "Upside Potential",    subtitle: "The Opportunity",   weight: 15 },
];

const num  = v => parseFloat(String(v).replace(/[$,]/g, "")) || 0;
const fmt  = n => (!n || isNaN(n)) ? "—" : "$" + Math.round(n).toLocaleString();
const fmtX = n => isNaN(n) ? "—" : n.toFixed(2) + "x";
const fmtP = n => isNaN(n) ? "—" : (n * 100).toFixed(1) + "%";
const getGrade = s => s >= 85 ? "Diamond" : s >= 65 ? "Polished" : s >= 40 ? "Rough" : "Pass";

// ── SHARED UI ─────────────────────────────────────────────────────────────────
function Input({ label, value, onChange, hint, prefix = "$", mono = true }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", fontSize: 10, color: T.textMuted, letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: 5, fontWeight: 600 }}>{label}</label>}
      <div style={{ position: "relative" }}>
        {prefix && <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: T.textMuted, fontSize: 13, pointerEvents: "none" }}>{prefix}</span>}
        <input type="text" inputMode="numeric" value={value} placeholder="0" onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            width: "100%", boxSizing: "border-box", paddingLeft: prefix ? 22 : 10, paddingRight: 10, paddingTop: 9, paddingBottom: 9,
            background: focused ? "#141414" : T.bg, border: `1px solid ${focused ? T.accent : T.border}`,
            borderRadius: 7, color: T.text, fontSize: 14, outline: "none",
            transition: "border-color 0.15s, background 0.15s",
            fontFamily: mono ? "'DM Mono', monospace" : "inherit",
          }} />
      </div>
      {hint && <p style={{ fontSize: 10, color: T.textMuted, margin: "4px 0 0", lineHeight: 1.5 }}>{hint}</p>}
    </div>
  );
}

function Textarea({ label, value, onChange, hint, rows = 4 }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", fontSize: 10, color: T.textMuted, letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: 5, fontWeight: 600 }}>{label}</label>}
      <textarea value={value} rows={rows} onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder={hint}
        style={{
          width: "100%", boxSizing: "border-box", padding: "10px 12px",
          background: focused ? "#141414" : T.bg, border: `1px solid ${focused ? T.accent : T.border}`,
          borderRadius: 7, color: T.text, fontSize: 13, outline: "none",
          resize: "vertical", lineHeight: 1.6, transition: "border-color 0.15s, background 0.15s",
          fontFamily: "inherit",
        }} />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", fontSize: 10, color: T.textMuted, letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: 5, fontWeight: 600 }}>{label}</label>}
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: "100%", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 7, padding: "9px 10px", color: T.text, fontSize: 14, outline: "none", cursor: "pointer" }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Slider({ label, value, onChange, min, max, step = 1, display }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
        <label style={{ fontSize: 10, color: T.textMuted, letterSpacing: "0.09em", textTransform: "uppercase", fontWeight: 600 }}>{label}</label>
        <span style={{ fontSize: 13, color: T.accent, fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>{display(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: T.accent, cursor: "pointer" }} />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
        <span style={{ fontSize: 9, color: T.textMuted }}>{display(min)}</span>
        <span style={{ fontSize: 9, color: T.textMuted }}>{display(max)}</span>
      </div>
    </div>
  );
}

function Stat({ label, value, accent, warn, green: g }) {
  return (
    <div style={{ background: accent ? T.accentGlow : T.surface, border: `1px solid ${accent ? T.accent : warn ? T.red + "66" : g ? T.green + "44" : T.border}`, borderRadius: 8, padding: "13px 14px" }}>
      <div style={{ fontSize: 9, color: T.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 19, fontWeight: 800, color: accent ? T.accent : warn ? T.red : g ? T.green : T.text, fontFamily: "'DM Mono', monospace" }}>{value}</div>
    </div>
  );
}

function GradeChip({ grade, large }) {
  const c = GRADE_CONFIG[grade]; if (!c) return null;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: c.color + "18", border: `1px solid ${c.color}`, borderRadius: 6, padding: large ? "6px 14px" : "3px 10px", fontSize: large ? 15 : 12, fontWeight: 700, color: c.color, letterSpacing: "0.05em", textTransform: "uppercase" }}>
      {c.icon} {grade}
    </span>
  );
}

function Divider({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "20px 0" }}>
      {label && <span style={{ fontSize: 9, color: T.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, whiteSpace: "nowrap" }}>{label}</span>}
      <div style={{ flex: 1, borderTop: `1px solid ${T.border}` }} />
    </div>
  );
}

function SectionHead({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <h2 style={{ margin: "0 0 5px", fontSize: 20, fontWeight: 900, color: T.text, letterSpacing: "-0.02em" }}>{title}</h2>
      {subtitle && <p style={{ margin: 0, fontSize: 13, color: T.textDim, lineHeight: 1.55 }}>{subtitle}</p>}
    </div>
  );
}

// ── DATA INTEGRITY PANEL (NEW) ────────────────────────────────────────────────
function DataIntegrityPanel({ report }) {
  const hasPenalties = report.penaltiesApplied?.length > 0;
  const marginFlag = report.marginCheck?.includes("FLAG");

  if (!hasPenalties && !marginFlag) return (
    <div style={{ background: T.green + "10", border: `1px solid ${T.green}33`, borderRadius: 8, padding: "12px 14px", marginBottom: 10 }}>
      <div style={{ fontSize: 10, color: T.green, letterSpacing: "0.09em", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>✓ Data Integrity</div>
      <p style={{ margin: 0, fontSize: 12, color: T.textDim }}>Key fields present. No penalties applied. Margin check passed.</p>
    </div>
  );

  return (
    <div style={{ background: T.amber + "10", border: `1px solid ${T.amber}44`, borderRadius: 8, padding: "14px 16px", marginBottom: 10 }}>
      <div style={{ fontSize: 10, color: T.amber, letterSpacing: "0.09em", textTransform: "uppercase", fontWeight: 700, marginBottom: 10 }}>⚠ Data Integrity Flags</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: hasPenalties ? 10 : 0 }}>
        <div>
          <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>Implied Multiple</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: T.text, fontFamily: "'DM Mono', monospace" }}>{report.impliedMultiple || "N/A"}</div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>Margin Check</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: marginFlag ? T.red : T.green, fontFamily: "'DM Mono', monospace" }}>{report.marginCheck || "N/A"}</div>
        </div>
      </div>
      {hasPenalties && (
        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 10 }}>
          <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Score Caps Applied</div>
          {report.penaltiesApplied.map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 4 }}>
              <span style={{ color: T.red, fontSize: 11, marginTop: 1 }}>▼</span>
              <span style={{ fontSize: 11, color: T.textDim, lineHeight: 1.5 }}>{p}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── RETURN STACK CALCULATOR ───────────────────────────────────────────────────
function ReturnStack({ report }) {
  const [askingPrice, setAskingPrice] = useState("");
  const [downPct, setDownPct]         = useState(10);
  const [exitMultiple, setExitMultiple] = useState(4.0);
  const [exitYear, setExitYear]       = useState(5);
  const [sbaRate, setSbaRate]         = useState(10.5);

  const sdeVal    = num(report?.sde?.replace(/[^0-9.]/g, "") || "0");
  const priceVal  = num(askingPrice);
  const downAmt   = priceVal * (downPct / 100);
  const loanAmt   = priceVal - downAmt;
  const mRate     = sbaRate / 100 / 12;
  const nPmt      = 10 * 12;
  const monthlyPmt = loanAmt > 0 ? loanAmt * (mRate * Math.pow(1+mRate,nPmt)) / (Math.pow(1+mRate,nPmt)-1) : 0;
  const annualDebt = monthlyPmt * 12;
  const yr1CF     = sdeVal - annualDebt;
  const cocReturn = downAmt > 0 ? yr1CF / downAmt : NaN;
  const payback   = yr1CF > 0 ? downAmt / yr1CF : NaN;

  const ebitda    = sdeVal * 0.65;
  const exitVal   = ebitda * exitMultiple;
  const pmtsMade  = exitYear * 12;
  let loanBal     = loanAmt;
  for (let i = 0; i < pmtsMade; i++) {
    const intPmt  = loanBal * mRate;
    loanBal       = Math.max(0, loanBal - (monthlyPmt - intPmt));
  }
  const equityAtExit = exitVal - loanBal;

  let irr = NaN;
  if (downAmt > 0 && equityAtExit > 0) {
    let r = 0.3;
    for (let iter = 0; iter < 100; iter++) {
      let npv = -downAmt;
      let dnpv = 0;
      for (let t = 1; t <= exitYear; t++) {
        const cf = t < exitYear ? yr1CF : yr1CF + equityAtExit;
        npv  += cf / Math.pow(1+r, t);
        dnpv -= t * cf / Math.pow(1+r, t+1);
      }
      const step = npv / dnpv;
      r -= step;
      if (Math.abs(step) < 0.0001) break;
    }
    irr = r;
  }

  const multL = 3.0, multH = 6.0;
  const fairL = sdeVal * multL;
  const fairH = sdeVal * multH;
  const priceVsFair = priceVal > 0 && fairL > 0
    ? priceVal <= fairL ? "below" : priceVal <= fairH ? "within" : "above"
    : null;

  const hasData = priceVal > 0 && sdeVal > 0;

  return (
    <div style={{ background: T.surface, border: `1px solid ${T.borderBright}`, borderRadius: 10, padding: "18px", marginBottom: 14 }}>
      <div style={{ fontSize: 10, color: T.accent, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700, marginBottom: 14 }}>
        ◈ Valuation & Return Stack
      </div>
      <Input label="Asking Price" value={askingPrice} onChange={setAskingPrice} hint="Enter from the listing to unlock return analysis" />
      {priceVal > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Slider label="Down Payment" value={downPct} onChange={setDownPct} min={5} max={30} step={5} display={v => v + "%"} />
            <Slider label="SBA Rate" value={sbaRate} onChange={setSbaRate} min={8} max={13} step={0.25} display={v => v.toFixed(2) + "%"} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Slider label="Exit Multiple" value={exitMultiple} onChange={setExitMultiple} min={2.5} max={7.0} step={0.5} display={v => v.toFixed(1) + "x EBITDA"} />
            <Slider label="Exit Year" value={exitYear} onChange={setExitYear} min={3} max={10} step={1} display={v => "Yr " + v} />
          </div>
        </>
      )}
      {hasData && (
        <>
          <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "12px 14px", marginBottom: 10 }}>
            <div style={{ fontSize: 9, color: T.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>Multiple-Based Fair Value</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.textDim, fontFamily: "'DM Mono', monospace" }}>{fmt(fairL)}</span>
              <div style={{ flex: 1, height: 4, background: T.border, borderRadius: 2, position: "relative" }}>
                <div style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, background: `linear-gradient(90deg, ${T.accentDim}, ${T.accent})`, borderRadius: 2 }} />
                {priceVal > fairL && priceVal < fairH && (
                  <div style={{
                    position: "absolute", top: "50%", transform: "translate(-50%, -50%)",
                    left: `${((priceVal - fairL) / (fairH - fairL)) * 100}%`,
                    width: 10, height: 10, borderRadius: "50%", background: "#fff", border: `2px solid ${T.amber}`,
                  }} />
                )}
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.accent, fontFamily: "'DM Mono', monospace" }}>{fmt(fairH)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 10, color: T.textMuted }}>
                Asking: <span style={{ fontFamily: "'DM Mono', monospace", color: T.text, fontWeight: 700 }}>{fmt(priceVal)}</span>
                {" "}({fmtX(priceVal / sdeVal)} SDE)
              </span>
              {priceVsFair && (
                <span style={{ fontSize: 10, fontWeight: 700, color: priceVsFair === "below" ? T.green : priceVsFair === "within" ? T.amber : T.red, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {priceVsFair === "below" ? "▼ Below Fair Value" : priceVsFair === "within" ? "◉ Within Range" : "▲ Above Fair Value"}
                </span>
              )}
            </div>
          </div>

          <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "12px 14px", marginBottom: 10 }}>
            <div style={{ fontSize: 9, color: T.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>SBA Financing Snapshot</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <div>
                <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.07em" }}>Down Payment</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: T.text, fontFamily: "'DM Mono', monospace" }}>{fmt(downAmt)}</div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.07em" }}>Monthly Pmt</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: T.text, fontFamily: "'DM Mono', monospace" }}>{fmt(monthlyPmt)}</div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.07em" }}>Annual Debt</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: T.text, fontFamily: "'DM Mono', monospace" }}>{fmt(annualDebt)}</div>
              </div>
            </div>
          </div>

          <div style={{ background: T.accentGlow, border: `1px solid ${T.accent}44`, borderRadius: 8, padding: "14px", marginBottom: 10 }}>
            <div style={{ fontSize: 9, color: T.accentDim, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700, marginBottom: 12 }}>Return Stack</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
              <div style={{ background: T.bg, borderRadius: 7, padding: "10px 12px" }}>
                <div style={{ fontSize: 9, color: T.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Yr 1 Cash After Debt</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: yr1CF > 0 ? T.green : T.red, fontFamily: "'DM Mono', monospace" }}>{fmt(yr1CF)}</div>
                <div style={{ fontSize: 10, color: T.textDim, marginTop: 2 }}>{fmt(yr1CF / 12)}/mo</div>
              </div>
              <div style={{ background: T.bg, borderRadius: 7, padding: "10px 12px" }}>
                <div style={{ fontSize: 9, color: T.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Cash-on-Cash Return</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: cocReturn > 1 ? T.green : cocReturn > 0.5 ? T.amber : T.red, fontFamily: "'DM Mono', monospace" }}>
                  {isNaN(cocReturn) ? "—" : (cocReturn * 100).toFixed(0) + "%"}
                </div>
                <div style={{ fontSize: 10, color: T.textDim, marginTop: 2 }}>on {fmt(downAmt)} equity</div>
              </div>
              <div style={{ background: T.bg, borderRadius: 7, padding: "10px 12px" }}>
                <div style={{ fontSize: 9, color: T.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Equity Payback</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: payback < 2 ? T.green : payback < 4 ? T.amber : T.red, fontFamily: "'DM Mono', monospace" }}>
                  {isNaN(payback) || payback <= 0 ? "—" : payback.toFixed(1) + " yrs"}
                </div>
                <div style={{ fontSize: 10, color: T.textDim, marginTop: 2 }}>to recover down pmt</div>
              </div>
              <div style={{ background: T.bg, borderRadius: 7, padding: "10px 12px" }}>
                <div style={{ fontSize: 9, color: T.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>IRR at Exit (Yr {exitYear})</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: !isNaN(irr) && irr > 0.3 ? T.green : !isNaN(irr) && irr > 0.15 ? T.amber : T.red, fontFamily: "'DM Mono', monospace" }}>
                  {isNaN(irr) || irr <= 0 ? "—" : (irr * 100).toFixed(0) + "%"}
                </div>
                <div style={{ fontSize: 10, color: T.textDim, marginTop: 2 }}>{exitMultiple}x EBITDA exit</div>
              </div>
            </div>
            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 9, color: T.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>Implied Exit Value (Yr {exitYear})</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: T.accent, fontFamily: "'DM Mono', monospace" }}>{fmt(exitVal)}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 9, color: T.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>Equity at Exit</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: T.green, fontFamily: "'DM Mono', monospace" }}>{fmt(equityAtExit)}</div>
                </div>
              </div>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 10, color: T.textMuted, lineHeight: 1.5 }}>
            IRR assumes flat SDE, 10-yr SBA loan, and stated exit multiple. EBITDA estimated at 65% of SDE. For modeling purposes only.
          </p>
        </>
      )}
    </div>
  );
}

// ── UPDATED SYSTEM PROMPT ─────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are the CFO Deal Filter for The Hustle Lab — a rigorous small business acquisition analyst. You score deals using the Lab Report™ framework with industry-anchored priors. You are skeptical by default. Most listings are incomplete. Most deals are Rough or Pass. Do NOT inflate scores to seem helpful.

Return ONLY valid JSON, no preamble, no markdown fences.

════════════════════════════════════════════
STEP 1 — IDENTIFY INDUSTRY & APPLY PENALTIES
════════════════════════════════════════════
First, identify the closest matching industry from this list:
car_wash | pest_control | laundromat | septic_drain | restoration | hvac | plumbing | home_cleaning | commercial_cleaning | home_care | electrical | auto_repair | landscaping | gas_station | moving_storage | roofing | restaurant

Then apply INFORMATION QUALITY PENALTIES before scoring anything:
- SDE not stated anywhere → Cash Flow HARD CAP 12/25, Valuation HARD CAP 10/25
- Asking price not stated → Valuation HARD CAP 12/25
- Revenue not stated → Cash Flow −2
- Years in business not stated → Transferability −1
- Reason for selling not stated → Transferability −1
- Only 1 year of financials referenced → Cash Flow −2
- ALL THREE missing (SDE + revenue + asking) → total score HARD CAP 45/100

════════════════════════════════════════════
STEP 2 — SCORE EACH CRITERION FROM INDUSTRY BASE
════════════════════════════════════════════

─── CRITERION 1: CASH FLOW & SDE (0–25) ───
Start from the industry base score. Adjust based on listing signals. Hard caps from Step 1 override everything.

Industry base scores:
car_wash=21 | pest_control=20 | laundromat=20 | septic_drain=19 | restoration=18 |
hvac=17 | plumbing=17 | home_cleaning=16 | electrical=16 | auto_repair=16 |
commercial_cleaning=15 | home_care=15 | landscaping=15 | moving_storage=14 |
roofing=14 | gas_station=12 | restaurant=10

Margin benchmarks (cross-check stated SDE ÷ revenue):
car_wash=35% | laundromat=30% | pest_control=28% | septic_drain=25% |
restoration=22% | plumbing=20% | hvac=18% | home_cleaning=18% | electrical=18% |
auto_repair=17% | home_care=16% | commercial_cleaning=16% | landscaping=16% |
moving_storage=15% | roofing=15% | restaurant=10% | gas_station=8%

Cash Flow adjustment signals:
+2: SDE explicitly stated with P&L or tax return reference
+2: Revenue AND SDE both stated AND implied margin is within 3pts of benchmark
+2: 3+ years of financials mentioned
−1: Only 1 year of financials
−2: SDE described as "adjusted" or "recast" with no detail on what was adjusted
−3: Implied margin is MORE than 5pts above benchmark with no explanation
−3: Declining revenue trend mentioned or implied

─── CRITERION 2: VALUATION MULTIPLE (0–25) ───
Calculate: Asking Price ÷ SDE = implied multiple. Compare to industry range. Formula-driven.

Industry multiple ranges (low × to high ×):
car_wash=4.0–7.0 | pest_control=3.0–6.0 | home_care=2.5–5.0 | hvac=2.5–4.5 |
laundromat=2.5–4.5 | restoration=2.5–4.5 | plumbing=2.5–4.0 | septic_drain=2.5–4.0 |
electrical=2.5–4.0 | landscaping=2.5–4.0 | gas_station=3.0–5.0 |
home_cleaning=2.0–4.0 | commercial_cleaning=2.0–3.5 | auto_repair=2.0–3.5 |
roofing=2.0–3.5 | moving_storage=2.0–3.5 | restaurant=1.5–3.0

Scoring bands:
At or below low multiple → 22–25
Between low and midpoint → 17–21
Between midpoint and high → 12–16
Above high multiple → 6–11
Cannot calculate → apply hard caps from Step 1

─── CRITERION 3: TRANSFERABILITY (0–20) ───
Default skeptical. Silence on management structure COSTS points. Positive signals must be explicitly stated.

Industry base scores:
laundromat=17 | car_wash=16 | pest_control=14 | commercial_cleaning=14 |
home_cleaning=13 | septic_drain=13 | hvac=12 | plumbing=12 | landscaping=12 |
home_care=11 | auto_repair=11 | electrical=11 | restoration=11 |
gas_station=10 | roofing=9 | moving_storage=9 | restaurant=6

Adjustment signals:
+4: Manager or GM explicitly stated as running day-to-day
+3: Owner explicitly absentee or semi-absentee
+2: Trained staff mentioned AND low turnover referenced
+1: Lease transferable AND long remaining term (5+ yrs) stated
+1: SBA pre-qualified
+1: Owner offers transition/training period stated
−2: Silence on management structure
−2: Lease assignment not mentioned OR short remaining term
−2: License complexity present
−3: Owner IS the license holder, no succession plan
−3: Owner described as working 50+ hours/week or "hands-on"
−3: Key customer concentration — 1–2 accounts = majority of revenue

─── CRITERION 4: MOAT & MARKET (0–15) ───
Structural recurring revenue + barrier-to-entry. Silence on recurring in a recurring industry costs points.

Industry base scores:
pest_control=13 | home_care=13 | laundromat=12 | septic_drain=12 |
commercial_cleaning=11 | hvac=11 | car_wash=10 | plumbing=10 |
home_cleaning=10 | restoration=9 | landscaping=9 | auto_repair=8 |
electrical=8 | gas_station=8 | roofing=5 | moving_storage=5 | restaurant=4

Adjustment signals:
+2: Recurring contracts explicitly mentioned with % of revenue
+2: Named commercial accounts OR government contracts
+2: 5+ year average customer tenure mentioned
+1: Licensed technicians on staff (not just owner)
+1: Route density or geographic concentration mentioned
+1: Franchise brand with protected territory
−2: No mention of recurring revenue in a recurring-revenue industry (hvac, pest_control, commercial_cleaning, home_care)
−3: Single customer >30% of revenue
−1: Highly competitive local market mentioned

─── CRITERION 5: UPSIDE POTENTIAL (0–15) ───
Must reference a specific measurable gap. Generic "add marketing" = 0 points.

Industry base scores + primary lever:
hvac=12 (maintenance contract undermonetization) | pest_control=12 (route density + commercial) |
home_care=11 (Medicaid waiver + territory) | car_wash=11 (membership conversion + fleet) |
landscaping=11 (commercial contract conversion) | commercial_cleaning=10 (adjacent verticals) |
home_cleaning=10 (subscription conversion) | laundromat=9 (wash-dry-fold + delivery) |
plumbing=9 (maintenance plan penetration) | auto_repair=9 (fleet + detailing) |
septic_drain=9 (inspection + preventive contracts) | restoration=8 (adjuster relationships) |
gas_station=8 (c-store margin + food) | electrical=8 (commercial + solar/EV) |
roofing=7 (gutters/siding + inspections) | moving_storage=6 (packing + storage) | restaurant=5 (catering + delivery)

Adjustment signals:
+2: Margin measurably below industry benchmark (quantify the gap)
+2: No website or weak digital presence in a digital-friendly industry
+2: Owner retiring/distracted/motivated (management reset upside)
+2: Underpenetrated geography with specific named opportunity
+1: Specific underutilized asset mentioned
+1: Revenue flat or declining under current owner
+1: Macro tailwind directly applicable
−2: Revenue at ceiling for market size
−2: Highly competitive market, no differentiation path
−1: Upside is capital-intensive only
0: Generic "add marketing / social media / hire staff" — not a signal

════════════════════════════════════════════
STEP 3 — RATIONALE FORMAT (REQUIRED)
════════════════════════════════════════════
Each criterion rationale MUST follow:
"Base score for [industry] is [X]/[max] given [one-line reason]. [What signal moved it and by how much.] [One sentence on what this means for a buyer.]"

════════════════════════════════════════════
STEP 4 — SMART BUYER MOVE & REEL HOOK
════════════════════════════════════════════
smartBuyerMove: ONE sentence. Must include specific number or condition. Format: "Submit LOI at $[X] with [condition] — at [Y]% down your cash-on-cash return is approximately [Z]% in year one."
reelHook: Under 12 words. Punchy. Curiosity-driven. No hashtags.

════════════════════════════════════════════
OUTPUT — RETURN ONLY THIS JSON
════════════════════════════════════════════
{
  "businessName": "Short descriptive name",
  "industry": "Industry label",
  "industryKey": "industry_key",
  "askingPrice": "e.g. $800,000 or Not Stated",
  "revenue": "Annual revenue or Not Stated",
  "sde": "SDE as string or Not Stated",
  "impliedMultiple": "e.g. 3.2x or N/A",
  "marginCheck": "e.g. 21% vs 18% benchmark — within range OR 31% vs 18% benchmark — FLAG",
  "penaltiesApplied": ["list penalties applied, empty array if none"],
  "criteria": {
    "cashFlow":  { "score": <0-25>, "base": <industry base>, "rationale": "Step 3 format" },
    "valuation": { "score": <0-25>, "base": <formula-driven>, "rationale": "Step 3 format" },
    "transfer":  { "score": <0-20>, "base": <industry base>, "rationale": "Step 3 format" },
    "moat":      { "score": <0-15>, "base": <industry base>, "rationale": "Step 3 format" },
    "upside":    { "score": <0-15>, "base": <industry base>, "rationale": "Step 3 format" }
  },
  "strengths": [
    { "label": "Specific strength", "detail": "One sentence — specific to this deal" },
    { "label": "Specific strength", "detail": "One sentence — specific to this deal" },
    { "label": "Specific strength", "detail": "One sentence — specific to this deal" }
  ],
  "risks": [
    { "label": "Specific risk", "severity": "High|Medium|Low", "detail": "One sentence — specific to this deal" },
    { "label": "Specific risk", "severity": "High|Medium|Low", "detail": "One sentence — specific to this deal" },
    { "label": "Specific risk", "severity": "High|Medium|Low", "detail": "One sentence — specific to this deal" }
  ],
  "labVerdict": "2–3 sentences. Direct. Reference the grade and what would move it up one tier.",
  "smartBuyerMove": "ONE sentence. Specific number or condition.",
  "reelHook": "Under 12 words. No hashtags."
}`;

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab]         = useState("lab");
  const [listing, setListing] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport]   = useState(null);
  const [error, setError]     = useState("");
  const [copied, setCopied]   = useState(false);
  const [sdePassthrough, setSdePassthrough] = useState(0);

  const run = async () => {
    if (!listing.trim()) return;
    setLoading(true); setError(""); setReport(null);
    try {
      const res  = await fetch("https://spring-scene-373d.chadwondra1.workers.dev", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-5", max_tokens: 2500,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: `Score this listing:\n\n${listing}` }],
        }),
      });
      const data  = await res.json();
      console.log("DATA:", JSON.stringify(data).slice(0, 500));
      const text  = data.content?.map(b => b.text || "").join("") || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const clean = jsonMatch ? jsonMatch[0] : text.trim();
      console.log("CLEAN:", clean.slice(0, 500));
      const parsed = JSON.parse(clean);
      setReport(parsed);
    } catch { setError("Couldn't parse the listing. Paste more detail and try again."); }
    setLoading(false);
  };

  const totalScore = report ? Object.values(report.criteria).reduce((s, c) => s + (c.score || 0), 0) : 0;
  const grade      = report ? getGrade(totalScore) : null;
  const gc         = grade  ? GRADE_CONFIG[grade]  : null;

  const copyReport = () => {
    if (!report) return;
    const lines = [
      `LAB REPORT™ — ${report.businessName}`,
      `The Hustle Lab (@hustlelabco)`,
      ``,
      `GRADE: ${grade} | SCORE: ${totalScore}/100`,
      `Asking: ${report.askingPrice} | Revenue: ${report.revenue} | SDE: ${report.sde}`,
      `Implied Multiple: ${report.impliedMultiple} | Margin Check: ${report.marginCheck}`,
      report.penaltiesApplied?.length > 0 ? `Penalties: ${report.penaltiesApplied.join("; ")}` : `Data Integrity: No penalties applied`,
      ``,
      `── CRITERIA ──`,
      ...CRITERIA.map(c => `${c.label}: ${report.criteria[c.key]?.score}/${c.weight} (base: ${report.criteria[c.key]?.base})\n  ${report.criteria[c.key]?.rationale}`),
      ``,
      `── STRENGTHS ──`,
      ...(report.strengths || []).map((s, i) => `${i+1}. ${s.label}: ${s.detail}`),
      ``,
      `── TOP RISKS ──`,
      ...(report.risks || []).map((r, i) => `${i+1}. [${r.severity}] ${r.label}: ${r.detail}`),
      ``,
      `── LAB VERDICT ──`,
      report.labVerdict,
      ``,
      `── SMART BUYER MOVE ──`,
      report.smartBuyerMove,
      ``,
      `── REEL HOOK ──`,
      `"${report.reelHook}"`,
      ``,
      `For educational purposes only. Not financial advice. hustlelabco.com`,
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const TABS = [
    { id: "lab",  icon: "🧪", label: "Lab Report" },
    { id: "sde",  icon: "∑",  label: "SDE" },
    { id: "val",  icon: "◈",  label: "Valuation" },
    { id: "sba",  icon: "⬡",  label: "SBA Loan" },
    { id: "more", icon: "+",  label: "More" },
  ];

  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", color: T.text }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, background: T.bg, zIndex: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, background: T.accent, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 900, color: "#000" }}>H</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, color: T.text, letterSpacing: "-0.02em", lineHeight: 1 }}>Hustle Lab</div>
            <div style={{ fontSize: 9, color: T.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>Deal Tools</div>
          </div>
        </div>
        <a href="https://instagram.com/hustlelabco" target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: T.accent, textDecoration: "none", fontWeight: 700 }}>@hustlelabco ↗</a>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, position: "sticky", top: 57, background: T.bg, zIndex: 19, overflowX: "auto" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, minWidth: 60, padding: "10px 6px", background: "transparent", border: "none", cursor: "pointer",
            borderBottom: `2px solid ${tab === t.id ? T.accent : "transparent"}`,
            color: tab === t.id ? T.accent : T.textMuted,
            fontSize: 10, fontWeight: tab === t.id ? 700 : 500, letterSpacing: "0.03em", textTransform: "uppercase",
            transition: "all 0.15s", display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
          }}>
            <span style={{ fontSize: 14 }}>{t.icon}</span><span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "22px 18px", maxWidth: 600, margin: "0 auto" }}>

        {/* ── LAB REPORT TAB ── */}
        {tab === "lab" && (
          <div>
            <SectionHead title="AI Lab Report™" subtitle="Paste any listing — get a full CFO Deal Filter score anchored to industry benchmarks." />

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
              {CRITERIA.map(c => (
                <div key={c.key} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 8px", fontSize: 10, color: T.textDim }}>
                  <span style={{ color: T.accent, fontWeight: 700 }}>{c.weight}pts</span> {c.label}
                </div>
              ))}
            </div>

            {/* Scoring method badge */}
            <div style={{ background: T.accentGlow, border: `1px solid ${T.accent}33`, borderRadius: 8, padding: "10px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14 }}>⚙</span>
              <p style={{ margin: 0, fontSize: 11, color: T.textDim, lineHeight: 1.5 }}>
                <span style={{ color: T.accent, fontWeight: 700 }}>Industry-anchored scoring. </span>
                Each criterion starts from a benchmark for the business type, then adjusts based on listing signals. Missing data suppresses scores — no free passes.
              </p>
            </div>

            <Textarea label="Paste Business Listing" value={listing} onChange={setListing} hint="Paste the full listing from BizBuySell, BizQuest, or any broker — more detail = better analysis." rows={8} />

            <button onClick={run} disabled={loading || !listing.trim()} style={{
              width: "100%", padding: "13px", background: loading ? "transparent" : T.accent,
              border: `1px solid ${loading ? T.border : T.accent}`, borderRadius: 8,
              color: loading ? T.textDim : "#000", fontSize: 14, fontWeight: 900,
              cursor: loading ? "not-allowed" : "pointer", transition: "all 0.15s",
            }}>
              {loading ? "Running CFO Deal Filter..." : "Generate Lab Report™ →"}
            </button>

            {error && <div style={{ marginTop: 12, background: T.red + "15", border: `1px solid ${T.red}44`, borderRadius: 8, padding: "12px 14px" }}><p style={{ margin: 0, fontSize: 13, color: T.red }}>{error}</p></div>}

            {loading && (
              <div style={{ marginTop: 20, textAlign: "center", padding: "30px 0" }}>
                <div style={{ fontSize: 28, marginBottom: 10, display: "inline-block", animation: "spin 1.2s linear infinite" }}>⚙</div>
                <p style={{ fontSize: 13, color: T.textDim }}>Running the CFO Deal Filter...</p>
                <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
              </div>
            )}

            {report && grade && gc && (() => {
              const severityColor = { High: T.red, Medium: T.amber, Low: T.green };
              return (
                <div style={{ marginTop: 20 }}>
                  <Divider />

                  {/* Report header */}
                  <div style={{ background: gc.color + "12", border: `1px solid ${gc.color}44`, borderRadius: 12, padding: "20px", marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 10, color: T.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Lab Report™</div>
                        <div style={{ fontSize: 20, fontWeight: 900, color: T.text }}>{report.businessName}</div>
                        <div style={{ fontSize: 12, color: T.textDim, marginTop: 2 }}>{report.industry}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <GradeChip grade={grade} large />
                        <div style={{ fontSize: 30, fontWeight: 900, color: gc.color, fontFamily: "'DM Mono', monospace", marginTop: 6 }}>
                          {totalScore}<span style={{ fontSize: 14, color: T.textMuted }}>/100</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
                      {[["Asking", report.askingPrice], ["Revenue", report.revenue], ["SDE", report.sde], ["Multiple", report.impliedMultiple]].map(([l, v]) => (
                        <div key={l}>
                          <div style={{ fontSize: 9, color: T.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>{l}</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, fontFamily: "'DM Mono', monospace" }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Data Integrity Panel — NEW */}
                  <DataIntegrityPanel report={report} />

                  {/* Score bar */}
                  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "14px 16px", marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 10, color: T.textMuted, letterSpacing: "0.09em", textTransform: "uppercase", fontWeight: 600 }}>Overall Score</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: gc.color, fontFamily: "'DM Mono', monospace" }}>{totalScore}/100</span>
                    </div>
                    <div style={{ height: 8, background: T.border, borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${totalScore}%`, background: `linear-gradient(90deg, ${T.accentDim}, ${gc.color})`, borderRadius: 4, transition: "width 0.6s ease" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                      {[["Pass","0"],["Rough","40"],["Polished","65"],["Diamond","85"],["","100"]].map(([l,v]) => (
                        <div key={v} style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 8, color: T.textMuted }}>{l}</div>
                          <div style={{ fontSize: 8, color: T.textMuted }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Criteria scores */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
                    {CRITERIA.map(c => {
                      const d = report.criteria[c.key]; if (!d) return null;
                      const pct = (d.score / c.weight) * 100;
                      const barColor = pct >= 70 ? T.green : pct >= 45 ? T.amber : T.red;
                      return (
                        <div key={c.key} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "14px 16px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <div>
                              <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{c.label}</span>
                              <span style={{ fontSize: 10, color: T.textMuted, marginLeft: 6 }}>{c.subtitle}</span>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <span style={{ fontSize: 15, fontWeight: 800, color: barColor, fontFamily: "'DM Mono', monospace" }}>
                                {d.score}<span style={{ fontSize: 10, color: T.textMuted }}>/{c.weight}</span>
                              </span>
                              {d.base && <div style={{ fontSize: 9, color: T.textMuted, marginTop: 1 }}>base {d.base}</div>}
                            </div>
                          </div>
                          <div style={{ height: 4, background: T.border, borderRadius: 2, marginBottom: 8, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 2 }} />
                          </div>
                          <p style={{ margin: 0, fontSize: 12, color: T.textDim, lineHeight: 1.65 }}>{d.rationale}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Strengths */}
                  {report.strengths?.length > 0 && (
                    <div style={{ background: T.surface, border: `1px solid ${T.green}33`, borderRadius: 8, padding: "14px 16px", marginBottom: 10 }}>
                      <div style={{ fontSize: 10, color: T.green, letterSpacing: "0.09em", textTransform: "uppercase", fontWeight: 700, marginBottom: 12 }}>✦ Top 3 Strengths</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {report.strengths.map((s, i) => (
                          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                            <div style={{ width: 22, height: 22, borderRadius: "50%", background: T.green + "20", border: `1px solid ${T.green}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 10, fontWeight: 800, color: T.green }}>{i+1}</div>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 2 }}>{s.label}</div>
                              <div style={{ fontSize: 11, color: T.textDim, lineHeight: 1.55 }}>{s.detail}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Risks */}
                  {report.risks?.length > 0 && (
                    <div style={{ background: T.surface, border: `1px solid ${T.red}33`, borderRadius: 8, padding: "14px 16px", marginBottom: 10 }}>
                      <div style={{ fontSize: 10, color: T.red, letterSpacing: "0.09em", textTransform: "uppercase", fontWeight: 700, marginBottom: 12 }}>⚠ Top 3 Risks</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {report.risks.map((r, i) => {
                          const sc = severityColor[r.severity] || T.amber;
                          return (
                            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                              <div style={{ width: 22, height: 22, borderRadius: "50%", background: sc + "20", border: `1px solid ${sc}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 10, fontWeight: 800, color: sc }}>{i+1}</div>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                                  <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{r.label}</span>
                                  <span style={{ fontSize: 9, fontWeight: 700, color: sc, background: sc + "18", border: `1px solid ${sc}44`, borderRadius: 4, padding: "1px 6px", letterSpacing: "0.06em", textTransform: "uppercase" }}>{r.severity}</span>
                                </div>
                                <div style={{ fontSize: 11, color: T.textDim, lineHeight: 1.55 }}>{r.detail}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Return Stack */}
                  <ReturnStack report={report} />

                  {/* Lab Verdict */}
                  <div style={{ background: gc.color + "10", border: `1px solid ${gc.color}44`, borderRadius: 8, padding: "14px 16px", marginBottom: 10 }}>
                    <div style={{ fontSize: 10, color: gc.color, letterSpacing: "0.09em", textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>Lab Verdict</div>
                    <p style={{ margin: 0, fontSize: 13, color: T.text, lineHeight: 1.7, fontWeight: 500 }}>{report.labVerdict}</p>
                  </div>

                  {/* Smart Buyer Move */}
                  <div style={{ background: T.accentGlow, border: `1px solid ${T.accent}`, borderRadius: 8, padding: "16px", marginBottom: 14 }}>
                    <div style={{ fontSize: 10, color: T.accentDim, letterSpacing: "0.09em", textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>⚡ Smart Buyer Move</div>
                    <p style={{ margin: 0, fontSize: 14, color: T.accent, fontWeight: 800, lineHeight: 1.55 }}>{report.smartBuyerMove}</p>
                  </div>

                  {/* Reel Hook */}
                  <div style={{ background: T.surface, border: `1px solid ${T.borderBright}`, borderRadius: 8, padding: "14px 16px", marginBottom: 14 }}>
                    <div style={{ fontSize: 10, color: T.textMuted, letterSpacing: "0.09em", textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>📱 Reel Hook</div>
                    <p style={{ margin: 0, fontSize: 15, color: T.text, fontWeight: 800, lineHeight: 1.4 }}>"{report.reelHook}"</p>
                  </div>

                  {/* Copy */}
                  <button onClick={copyReport} style={{
                    width: "100%", padding: "12px", background: "transparent", border: `1px solid ${copied ? T.green : T.accent}`,
                    borderRadius: 8, color: copied ? T.green : T.accent, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
                  }}>
                    {copied ? "✓ Copied to Clipboard" : "Copy Full Lab Report™"}
                  </button>
                  <p style={{ margin: "10px 0 0", fontSize: 10, color: T.textMuted, textAlign: "center" }}>For educational purposes only. Not financial or investment advice.</p>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── SDE TAB ── */}
        {tab === "sde" && (() => {
          const fields = { netProfit: "", ownerSalary: "", ownerBenefits: "", ownerPerks: "", depreciation: "", amortization: "", interest: "", taxes: "", oneTime: "", nonRecurring: "", other: "" };
          const AddBacks = [
            { k: "ownerSalary",   l: "Owner Salary & Compensation",    h: "Full W2 or draws" },
            { k: "ownerBenefits", l: "Owner Health & Life Insurance",   h: "Benefits run through business" },
            { k: "ownerPerks",    l: "Owner Perks (auto, meals, etc.)", h: "Personal expenses expensed" },
            { k: "depreciation",  l: "Depreciation",                    h: "Non-cash — always add back" },
            { k: "amortization",  l: "Amortization",                    h: "Intangible amortization" },
            { k: "interest",      l: "Interest Expense",                h: "Debt new owner won't carry" },
            { k: "taxes",         l: "Income Taxes",                    h: "Entity-level taxes" },
            { k: "oneTime",       l: "One-Time Expenses",               h: "Non-recurring items" },
            { k: "nonRecurring",  l: "Non-Recurring Revenue (Remove)",  h: "One-time windfalls — enter negative" },
            { k: "other",         l: "Other Add-Backs",                 h: "Anything else" },
          ];
          const SDEInner = () => {
            const [f, setF] = useState(fields);
            const s = k => v => { const n = {...f,[k]:v}; setF(n); const sdeV = num(n.netProfit) + AddBacks.reduce((a,b) => a+num(n[b.k]),0); setSdePassthrough(sdeV); };
            const netP = num(f.netProfit), total = AddBacks.reduce((a,b) => a+num(f[b.k]),0), sde = netP+total;
            return (
              <div>
                <SectionHead title="SDE Calculator" subtitle="Reconstruct true owner earnings. The foundation of every small business valuation." />
                <Input label="Net Profit (After Tax)" value={f.netProfit} onChange={s("netProfit")} hint="Bottom-line from P&L — your starting point" />
                <Divider label="Add-Backs" />
                {AddBacks.map(a => <Input key={a.k} label={a.l} value={f[a.k]} onChange={s(a.k)} hint={a.h} />)}
                {(netP !== 0 || total !== 0) && (
                  <>
                    <Divider />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                      <Stat label="Net Profit" value={fmt(netP)} /><Stat label="Total Add-Backs" value={fmt(total)} />
                    </div>
                    <div style={{ background: T.accentGlow, border: `1px solid ${T.accent}`, borderRadius: 10, padding: "22px 20px", textAlign: "center", marginBottom: 14 }}>
                      <div style={{ fontSize: 10, color: T.accentDim, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>Reconstructed SDE</div>
                      <div style={{ fontSize: 44, fontWeight: 900, color: T.accent, fontFamily: "'DM Mono', monospace" }}>{fmt(sde)}</div>
                      <div style={{ fontSize: 11, color: T.textDim, marginTop: 5 }}>Annual economic benefit to owner-operator</div>
                    </div>
                    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "12px 14px" }}>
                      <p style={{ margin: 0, fontSize: 12, color: T.textDim, lineHeight: 1.7 }}><span style={{ color: T.accent, fontWeight: 700 }}>Lab Note →</span> SDE of {fmt(sde)} is now pre-filled in the Valuation tab.</p>
                    </div>
                  </>
                )}
              </div>
            );
          };
          return <SDEInner />;
        })()}

        {/* ── VALUATION TAB ── */}
        {tab === "val" && (() => {
          const ValInner = () => {
            const [industry, setIndustry] = useState("hvac");
            const [sde, setSde]           = useState(sdePassthrough > 0 ? String(sdePassthrough) : "");
            const [asking, setAsking]     = useState("");
            const [recurPct, setRecurPct] = useState(25);
            const [ownerDep, setOwnerDep] = useState(3);
            const [growth, setGrowth]     = useState(3);
            const [years, setYears]       = useState(10);
            const ind = INDUSTRIES[industry], sdeVal = num(sde), askVal = num(asking);
            const qualAdj = useMemo(() => { let a=0; if(recurPct>=70)a+=0.35;else if(recurPct>=40)a+=0.15; if(ownerDep<=2)a+=0.30;else if(ownerDep>=4)a-=0.30; if(growth>=4)a+=0.20;else if(growth<=2)a-=0.15; if(years>=15)a+=0.15;else if(years<=3)a-=0.20; return a; }, [recurPct,ownerDep,growth,years]);
            const multL=Math.max(1.0,ind.sdeL+qualAdj), multH=Math.max(1.5,ind.sdeH+qualAdj), multM=(multL+multH)/2;
            const fairL=sdeVal*multL, fairM=sdeVal*multM, fairH=sdeVal*multH;
            const askX=askVal>0&&sdeVal>0?askVal/sdeVal:NaN;
            const grade2 = useMemo(()=>{ if(isNaN(askX)||sdeVal===0)return null; if(askX<=multL*0.85)return"Diamond"; if(askX<=multM)return"Polished"; if(askX<=multH*1.1)return"Rough"; return"Pass"; },[askX,multL,multM,multH,sdeVal]);
            const gn = { Diamond:"Priced below fair value. Strong buy signal — act fast.", Polished:"Fairly priced. Upside exists with operational improvements.", Rough:"At or above fair value. Negotiate hard or walk.", Pass:"Significantly overpriced. Hard pass without major reduction." };
            return (
              <div>
                <SectionHead title="Valuation Calculator" subtitle="Estimate fair market value using industry SDE multiples adjusted for deal quality." />
                <Select label="Industry" value={industry} onChange={setIndustry} options={Object.entries(INDUSTRIES).map(([k,v])=>({value:k,label:v.label}))} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <Input label="Annual SDE" value={sde} onChange={setSde} hint={sdePassthrough>0?"Pre-filled from SDE tab":"Use SDE tab if needed"} />
                  <Input label="Asking Price" value={asking} onChange={setAsking} hint="From listing (optional)" />
                </div>
                <Divider label="Quality Adjustments" />
                <Slider label="Recurring Revenue %" value={recurPct} onChange={setRecurPct} min={0} max={100} step={5} display={v=>v+"%"} />
                <Slider label="Owner Dependency" value={ownerDep} onChange={setOwnerDep} min={1} max={5} step={1} display={v=>["","Manager-Run","Low","Moderate","High","Fully Dependent"][v]} />
                <Slider label="Revenue Trend" value={growth} onChange={setGrowth} min={1} max={5} step={1} display={v=>["","Declining","Flat","Stable","Strong Growth","Hyper Growth"][v]} />
                <Slider label="Years in Business" value={years} onChange={setYears} min={1} max={40} step={1} display={v=>v+" yrs"} />
                {sdeVal>0&&(<>
                  <Divider />
                  <div style={{ background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:"14px 16px",marginBottom:12 }}>
                    <div style={{ fontSize:10,color:T.textMuted,letterSpacing:"0.09em",textTransform:"uppercase",fontWeight:600,marginBottom:8 }}>Adjusted Multiple — {ind.label}</div>
                    <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                      <span style={{ fontSize:18,fontWeight:800,color:T.textDim,fontFamily:"'DM Mono',monospace" }}>{multL.toFixed(1)}x</span>
                      <div style={{ flex:1,height:5,background:T.border,borderRadius:3,overflow:"hidden" }}><div style={{ height:"100%",background:`linear-gradient(90deg,${T.accentDim},${T.accent})`,borderRadius:3 }}/></div>
                      <span style={{ fontSize:18,fontWeight:800,color:T.accent,fontFamily:"'DM Mono',monospace" }}>{multH.toFixed(1)}x</span>
                    </div>
                    {qualAdj!==0&&<p style={{ margin:"7px 0 0",fontSize:11,color:qualAdj>0?T.green:T.amber }}>{qualAdj>0?"▲":"▼"} Quality adj: {qualAdj>0?"+":""}{qualAdj.toFixed(2)}x vs. base</p>}
                  </div>
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12 }}>
                    <Stat label="Fair Low" value={fmt(fairL)}/><Stat label="Fair Mid" value={fmt(fairM)} accent/><Stat label="Fair High" value={fmt(fairH)}/>
                  </div>
                  {askVal>0&&<div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12 }}>
                    <Stat label="Asking Multiple" value={fmtX(askX)} warn={askX>multH}/>
                    <Stat label={askVal<=fairM?"Discount to Mid":"Premium to Mid"} value={askVal<=fairM?fmt(fairM-askVal)+" ↓":fmt(askVal-fairM)+" ↑"} warn={askVal>fairM} green={askVal<=fairM}/>
                  </div>}
                  {grade2&&<div style={{ background:T.surface,border:`1px solid ${T.borderBright}`,borderRadius:10,padding:"16px 18px" }}>
                    <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:10 }}><span style={{ fontSize:10,color:T.textMuted,letterSpacing:"0.09em",textTransform:"uppercase",fontWeight:600 }}>Lab Verdict</span><GradeChip grade={grade2}/></div>
                    <p style={{ margin:0,fontSize:13,color:T.textDim,lineHeight:1.65 }}>{gn[grade2]}</p>
                  </div>}
                </>)}
              </div>
            );
          };
          return <ValInner />;
        })()}

        {/* ── SBA TAB ── */}
        {tab === "sba" && (() => {
          const SBAInner = () => {
            const [price,setPrice]=useState(""); const [sde,setSde]=useState(""); const [downPct,setDownPct]=useState(10); const [extraEq,setExtraEq]=useState(""); const [rate,setRate]=useState(10.5); const [term,setTerm]=useState(10); const [sellAmt,setSellAmt]=useState(""); const [sellRate,setSellRate]=useState(6.0); const [sellTerm,setSellTerm]=useState(5); const [showAmort,setShowAmort]=useState(false);
            const priceV=num(price),sdeV=num(sde),downAmt=priceV*(downPct/100),extraV=num(extraEq),sellV=num(sellAmt),sbaAmt=Math.max(0,priceV-downAmt-extraV-sellV),mRate=rate/100/12,nPmt=term*12;
            const pmt=(p,r,n)=>r===0?p/n:p*(r*Math.pow(1+r,n))/(Math.pow(1+r,n)-1);
            const sbaMo=sbaAmt>0?pmt(sbaAmt,mRate,nPmt):0,sellMo=sellV>0?pmt(sellV,sellRate/100/12,sellTerm*12):0,annualDebt=(sbaMo+sellMo)*12,dscr=sdeV>0&&annualDebt>0?sdeV/annualDebt:NaN,retained=sdeV>0?sdeV-annualDebt:NaN,totalInt=sbaMo*nPmt-sbaAmt;
            let dc=T.green,dl="Strong"; if(!isNaN(dscr)){if(dscr<1.0){dc=T.red;dl="Cash Flow Negative";}else if(dscr<1.25){dc=T.amber;dl="Tight";}else if(dscr<1.5)dc="#84cc16";}
            const amortRows=useMemo(()=>{ if(!showAmort||sbaAmt<=0)return[]; const rows=[];let bal=sbaAmt; for(let m=1;m<=nPmt;m++){const i=bal*mRate,p=sbaMo-i;bal=Math.max(0,bal-p);if(m<=12||m===nPmt)rows.push({m,pmt:sbaMo,i,p,bal});else if(m===13)rows.push(null);}return rows; },[showAmort,sbaAmt,sbaMo,mRate,nPmt]);
            return (
              <div>
                <SectionHead title="SBA Loan Calculator" subtitle="Model SBA 7(a) financing with seller carry — payments, DSCR, retained cash flow." />
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}><Input label="Purchase Price" value={price} onChange={setPrice}/><Input label="SDE (for DSCR)" value={sde} onChange={setSde} hint="Annual SDE"/></div>
                <Slider label="Down Payment" value={downPct} onChange={setDownPct} min={5} max={50} step={1} display={v=>v+"%"+(priceV>0?" — "+fmt(priceV*v/100):"")}/>
                <Input label="Additional Equity Injection" value={extraEq} onChange={setExtraEq} hint="Optional — working capital, escrow"/>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,alignItems:"start" }}>
                  <Slider label="Interest Rate" value={rate} onChange={setRate} min={7} max={14} step={0.25} display={v=>v.toFixed(2)+"%"}/>
                  <div style={{ marginBottom:18 }}>
                    <label style={{ display:"block",fontSize:10,color:T.textMuted,letterSpacing:"0.09em",textTransform:"uppercase",marginBottom:7,fontWeight:600 }}>Loan Term</label>
                    <div style={{ display:"flex",gap:6 }}>{[7,10,25].map(t=><button key={t} onClick={()=>setTerm(t)} style={{ flex:1,padding:"9px 0",borderRadius:7,cursor:"pointer",fontSize:13,fontWeight:700,background:term===t?T.accent:"transparent",color:term===t?"#000":T.textDim,border:`1px solid ${term===t?T.accent:T.border}`,transition:"all 0.15s" }}>{t}yr</button>)}</div>
                  </div>
                </div>
                <Divider label="Seller Note (Optional)"/>
                <Input label="Seller Note Amount" value={sellAmt} onChange={setSellAmt} hint="Seller-financed portion"/>
                {sellV>0&&<div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}><Slider label="Seller Rate" value={sellRate} onChange={setSellRate} min={3} max={12} step={0.25} display={v=>v.toFixed(2)+"%"}/><Slider label="Seller Term" value={sellTerm} onChange={setSellTerm} min={2} max={10} step={1} display={v=>v+" yrs"}/></div>}
                {priceV>0&&<>
                  <Divider/>
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12 }}>
                    <Stat label="SBA Loan" value={fmt(sbaAmt)}/><Stat label="Cash In" value={fmt(downAmt+extraV)}/><Stat label="SBA Monthly" value={fmt(sbaMo)}/>{sellV>0&&<Stat label="Seller Mo." value={fmt(sellMo)}/>}<Stat label="Annual Debt" value={fmt(annualDebt)}/><Stat label="Total Interest" value={fmt(totalInt)}/>
                  </div>
                  <div style={{ background:T.surface,border:`1px solid ${isNaN(dscr)?T.border:dscr>=1.25?T.green+"44":T.red+"44"}`,borderRadius:10,padding:"20px",marginBottom:14 }}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14 }}>
                      <div><div style={{ fontSize:10,color:T.textMuted,letterSpacing:"0.09em",textTransform:"uppercase",fontWeight:600,marginBottom:5 }}>DSCR</div><div style={{ fontSize:40,fontWeight:900,color:dc,fontFamily:"'DM Mono',monospace" }}>{isNaN(dscr)?"—":dscr.toFixed(2)+"x"}</div></div>
                      {!isNaN(dscr)&&<div style={{ background:dc+"20",border:`1px solid ${dc}`,borderRadius:6,padding:"4px 10px" }}><span style={{ fontSize:11,fontWeight:700,color:dc,letterSpacing:"0.05em",textTransform:"uppercase" }}>{dl}</span></div>}
                    </div>
                    {!isNaN(retained)&&<div style={{ borderTop:`1px solid ${T.border}`,paddingTop:14 }}><div style={{ fontSize:10,color:T.textMuted,letterSpacing:"0.09em",textTransform:"uppercase",fontWeight:600,marginBottom:4 }}>Retained Annual Cash Flow</div><div style={{ fontSize:28,fontWeight:900,color:retained>=0?T.green:T.red,fontFamily:"'DM Mono',monospace" }}>{retained>=0?"+":""}{fmt(retained)}/yr</div><div style={{ fontSize:11,color:T.textDim,marginTop:3 }}>{fmt(retained/12)}/mo after debt service</div></div>}
                    <p style={{ margin:"12px 0 0",fontSize:11,color:T.textMuted,lineHeight:1.6 }}>SBA lenders require DSCR ≥ 1.25x. Below 1.0x = deal doesn't cash flow.</p>
                  </div>
                  {sbaAmt>0&&<><button onClick={()=>setShowAmort(s=>!s)} style={{ width:"100%",padding:"10px",background:"transparent",border:`1px solid ${T.border}`,borderRadius:8,color:T.textDim,cursor:"pointer",fontSize:13,fontWeight:600,transition:"all 0.15s" }}>{showAmort?"▲ Hide":"▼ Show"} Amortization Schedule</button>
                  {showAmort&&amortRows.length>0&&<div style={{ marginTop:10,overflowX:"auto" }}><table style={{ width:"100%",borderCollapse:"collapse",fontSize:12 }}><thead><tr style={{ borderBottom:`1px solid ${T.border}` }}>{["Mo","Payment","Principal","Interest","Balance"].map(h=><th key={h} style={{ padding:"6px 8px",color:T.textMuted,textAlign:"right",fontWeight:600,fontSize:9,letterSpacing:"0.08em",textTransform:"uppercase" }}>{h}</th>)}</tr></thead><tbody>{amortRows.map((r,i)=>r===null?<tr key="e"><td colSpan={5} style={{ textAlign:"center",color:T.textMuted,padding:"8px" }}>· · ·</td></tr>:<tr key={r.m} style={{ background:i%2===0?T.surface:"transparent" }}><td style={{ padding:"6px 8px",color:T.textMuted,textAlign:"right",fontFamily:"'DM Mono',monospace" }}>{r.m}</td><td style={{ padding:"6px 8px",color:T.text,textAlign:"right",fontFamily:"'DM Mono',monospace" }}>{fmt(r.pmt)}</td><td style={{ padding:"6px 8px",color:T.green,textAlign:"right",fontFamily:"'DM Mono',monospace" }}>{fmt(r.p)}</td><td style={{ padding:"6px 8px",color:T.red,textAlign:"right",fontFamily:"'DM Mono',monospace" }}>{fmt(r.i)}</td><td style={{ padding:"6px 8px",color:T.textDim,textAlign:"right",fontFamily:"'DM Mono',monospace" }}>{fmt(r.bal)}</td></tr>)}</tbody></table></div>}</>}
                </>}
              </div>
            );
          };
          return <SBAInner />;
        })()}

        {/* ── MORE TAB ── */}
        {tab === "more" && (
          <div>
            <SectionHead title="More Tools" subtitle="The full Hustle Lab toolkit — coming soon for members." />
            <div style={{ display:"flex",flexDirection:"column",gap:10,marginBottom:24 }}>
              {[
                { icon:"⚖️", label:"Deal Structure Calculator",  desc:"Model SBA + seller note + earnout + equity rollover in one view" },
                { icon:"🔍", label:"Industry Comparison Tool",   desc:"Compare 3 industries side-by-side on multiples, margins, PE interest" },
                { icon:"💸", label:"Acquisition Cost Estimator", desc:"All-in closing costs — SBA fees, QoE, legal, broker, working capital" },
                { icon:"✅", label:"Due Diligence Checklist",    desc:"Interactive DD tracker across 8 categories" },
                { icon:"📊", label:"Industry Deep Dive Library", desc:"Full research reports on 12+ industries with M&A comps" },
                { icon:"📬", label:"Weekly Deal Breakdowns",     desc:"Curated listings scored weekly using the Lab Report™ framework" },
              ].map((t,i)=>(
                <div key={i} style={{ background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"14px 16px",display:"flex",alignItems:"flex-start",gap:12,opacity:0.7 }}>
                  <div style={{ fontSize:20,flexShrink:0,marginTop:1 }}>{t.icon}</div>
                  <div style={{ flex:1 }}><div style={{ fontSize:13,fontWeight:700,color:T.text,marginBottom:3 }}>{t.label}</div><div style={{ fontSize:11,color:T.textDim,lineHeight:1.5 }}>{t.desc}</div></div>
                  <div style={{ flexShrink:0,background:"#1a1a1a",border:`1px solid ${T.border}`,borderRadius:5,padding:"2px 8px",fontSize:9,color:T.textMuted,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginTop:2 }}>🔒 Members</div>
                </div>
              ))}
            </div>
            <div style={{ background:"linear-gradient(135deg,#0f1a00 0%,#111 100%)",border:"1px solid rgba(200,241,53,0.25)",borderRadius:12,padding:"28px 22px",textAlign:"center" }}>
              <div style={{ display:"inline-block",background:T.accentGlow,border:`1px solid ${T.accent}`,borderRadius:20,padding:"3px 14px",fontSize:10,color:T.accent,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:14 }}>Hustle Lab · Members Access</div>
              <h3 style={{ margin:"0 0 10px",color:T.text,fontSize:18,fontWeight:900,lineHeight:1.3 }}>The Full Lab Report™ Suite</h3>
              <p style={{ margin:"0 0 22px",color:T.textDim,fontSize:13,lineHeight:1.65,maxWidth:340,marginLeft:"auto",marginRight:"auto" }}>All locked tools + weekly scored deal breakdowns + industry research — everything you need to find, analyze, and close your first acquisition.</p>
              <div style={{ display:"flex",flexDirection:"column",gap:8,maxWidth:260,margin:"0 auto" }}>
                <a href="https://instagram.com/hustlelabco" target="_blank" rel="noopener noreferrer" style={{ display:"block",padding:"13px 20px",background:T.accent,borderRadius:8,color:"#000",fontSize:14,fontWeight:900,cursor:"pointer",textDecoration:"none",textAlign:"center" }}>Follow @hustlelabco →</a>
                <p style={{ margin:0,fontSize:10,color:T.textMuted }}>Waitlist opens on Instagram first</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop:`1px solid ${T.border}`,padding:"16px 20px",textAlign:"center",marginTop:20 }}>
        <p style={{ margin:0,fontSize:11,color:T.textMuted,lineHeight:1.8 }}>
          Built by <a href="https://instagram.com/hustlelabco" style={{ color:T.accent,textDecoration:"none",fontWeight:700 }}>The Hustle Lab</a> · For educational purposes only. Not financial or investment advice.
        </p>
      </div>
    </div>
  );
}
