import { useState, useRef, useCallback, useEffect } from "react";

// Load jsPDF dynamically
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src; s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function generatePDF(report) {
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210; const H = 297;
  const grade = getGrade(report.totalScore);
  const gradeText = grade.label.replace(/[💎✨🪨🚫]\s?/, "");
  const gradeColor =
    gradeText === "DIAMOND"  ? [0, 210, 180]  :
    gradeText === "POLISHED" ? [220, 170, 30] :
    gradeText === "ROUGH"    ? [220, 110, 40] : [210, 50, 80];

  doc.setFillColor(10, 10, 18);
  doc.rect(0, 0, W, H, "F");
  doc.setFillColor(...gradeColor);
  doc.rect(0, 0, W, 2, "F");
  doc.setFillColor(18, 18, 28);
  doc.rect(0, 2, W, 36, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 120);
  doc.text("THE HUSTLE LAB  ·  LAB REPORT™", 14, 12);
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text(report.businessName || "Unnamed Business", 14, 24);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(130, 130, 150);
  const meta = [report.industry, report.askingPrice, report.annualSDE ? `SDE ${report.annualSDE}` : null, report.sdeMultiple && report.sdeMultiple !== "N/A" ? report.sdeMultiple : null].filter(Boolean).join("  ·  ");
  doc.text(meta, 14, 32);
  const cx = 185, cy = 20;
  doc.setFillColor(...gradeColor);
  doc.circle(cx, cy, 14, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(10, 10, 18);
  doc.text(String(report.totalScore), cx, cy + 2, { align: "center" });
  doc.setFontSize(6);
  doc.text("/100", cx, cy + 7, { align: "center" });
  doc.setFontSize(7);
  doc.text(gradeText, cx, cy + 12, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 100);
  doc.text(report.dateScreened || new Date().toLocaleDateString(), 14, 41);

  let y = 50;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...gradeColor);
  doc.text("SCORES", 14, y);
  y += 5;

  CRITERIA.forEach((c) => {
    const val = report.scores[c.id] || 0;
    const pct = val / c.max;
    const barW = 90;
    const barColor = pct >= 0.8 ? [0,210,180] : pct >= 0.6 ? [220,170,30] : pct >= 0.4 ? [220,110,40] : [210,50,80];
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(200, 200, 210);
    doc.text(c.label, 14, y);
    doc.setFillColor(30, 30, 45);
    doc.roundedRect(70, y - 3.5, barW, 4, 1, 1, "F");
    doc.setFillColor(...barColor);
    doc.roundedRect(70, y - 3.5, barW * pct, 4, 1, 1, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...barColor);
    doc.text(`${val}/${c.max}`, 168, y, { align: "right" });
    if (report.rationale?.[c.id]) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(6.5);
      doc.setTextColor(100, 100, 120);
      const lines = doc.splitTextToSize(report.rationale[c.id], 152);
      doc.text(lines, 14, y + 4);
      y += 4 + lines.length * 3.5;
    } else {
      y += 7;
    }
  });

  y += 4;
  doc.setDrawColor(30, 30, 50);
  doc.line(14, y, W - 14, y);
  y += 6;

  if (report.keyRisks) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(210, 50, 80);
    doc.text("KEY RISKS", 14, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(180, 180, 190);
    const riskLines = doc.splitTextToSize(report.keyRisks, 182);
    doc.text(riskLines, 14, y);
    y += riskLines.length * 3.8 + 5;
  }

  if (report.verdict) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...gradeColor);
    doc.text("LAB VERDICT", 14, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(200, 200, 210);
    const vLines = doc.splitTextToSize(report.verdict, 182);
    doc.text(vLines, 14, y);
    y += vLines.length * 3.8 + 5;
  }

  if (report.reelHook) {
    doc.setFillColor(18, 28, 26);
    const hookLines = doc.splitTextToSize(`"${report.reelHook}"`, 170);
    const boxH = hookLines.length * 4 + 10;
    doc.roundedRect(14, y, W - 28, boxH, 2, 2, "F");
    doc.setFillColor(...gradeColor);
    doc.roundedRect(14, y, 2, boxH, 1, 1, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(...gradeColor);
    doc.text("REEL HOOK", 20, y + 5);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(220, 220, 230);
    doc.text(hookLines, 20, y + 10);
    y += boxH + 6;
  }

  doc.setFillColor(14, 14, 22);
  doc.rect(0, H - 10, W, 10, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(60, 60, 80);
  doc.text("THE HUSTLE LAB  ·  HUSTLELABCO.COM  ·  NOT FINANCIAL ADVICE", W / 2, H - 4, { align: "center" });

  const filename = `lab-report-${(report.businessName || "deal").toLowerCase().replace(/\s+/g,"-")}.pdf`;
  doc.save(filename);
}

// ── Export helpers ────────────────────────────────────────────────────────────
const HEADERS = [
  "Date Screened", "Business Name", "Industry", "Asking Price", "Annual SDE", "SDE Multiple",
  "Cash Flow & SDE", "Valuation Multiple", "Transferability", "Moat & Market", "Upside Potential",
  "Total Score", "Grade",
  "CF Rationale", "Multiple Rationale", "Transferability Rationale", "Moat Rationale", "Upside Rationale",
  "Key Risks", "Verdict", "Reel Hook"
];

function reportToRow(r) {
  const grade = getGrade(r.totalScore).label.replace(/[💎✨🪨🚫]\s?/, "");
  return [
    r.dateScreened || new Date().toLocaleDateString(),
    r.businessName, r.industry, r.askingPrice,
    r.annualSDE || "", r.sdeMultiple || "",
    r.scores.cashflow, r.scores.multiple, r.scores.transferability, r.scores.moat, r.scores.upside,
    r.totalScore, grade,
    r.rationale?.cashflow || "", r.rationale?.multiple || "",
    r.rationale?.transferability || "", r.rationale?.moat || "", r.rationale?.upside || "",
    r.keyRisks || "", r.verdict || "", r.reelHook || ""
  ].map(v => `"${String(v).replace(/"/g, '""')}"`);
}

function buildTSV(reports) {
  return [HEADERS, ...reports.map(r => reportToRow(r).map(v => v.replace(/^"|"$/g, "").replace(/""/g, '"')))]
    .map(row => row.join("\t")).join("\n");
}

function buildRow(report) {
  return reportToRow(report).map(v => v.replace(/^"|"$/g, "").replace(/""/g, '"')).join("\t");
}

const CRITERIA = [
  { id: "cashflow",        label: "Cash Flow & SDE",    max: 20, description: "Owner earnings, add-backs, margin quality" },
  { id: "multiple",        label: "Valuation Multiple", max: 20, description: "Price/SDE vs. industry benchmark" },
  { id: "transferability", label: "Transferability",    max: 20, description: "Owner dependency, systems, staff retention" },
  { id: "moat",            label: "Moat & Market",      max: 20, description: "Competition, recurring revenue, defensibility" },
  { id: "upside",          label: "Upside Potential",   max: 20, description: "Growth levers, digital gap, pricing power" },
];

function getGrade(score) {
  if (score >= 85) return { label: "💎 DIAMOND", color: "#00f5d4", bg: "rgba(0,245,212,0.08)" };
  if (score >= 65) return { label: "✨ POLISHED", color: "#f0c040", bg: "rgba(240,192,64,0.08)" };
  if (score >= 40) return { label: "🪨 ROUGH",   color: "#ff8c42", bg: "rgba(255,140,66,0.08)" };
  return               { label: "🚫 PASS",       color: "#ff4d6d", bg: "rgba(255,77,109,0.08)" };
}

function ScoreBar({ value, max }) {
  const pct = (value / max) * 100;
  const color = value >= 16 ? "#00f5d4" : value >= 12 ? "#f0c040" : value >= 8 ? "#ff8c42" : "#ff4d6d";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{
          width: `${pct}%`, height: "100%", background: color, borderRadius: 3,
          transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: `0 0 8px ${color}80`
        }} />
      </div>
      <span style={{ fontFamily: "monospace", fontSize: 13, color, minWidth: 40 }}>{value}/{max}</span>
    </div>
  );
}

function ExportModal({ text, title, onClose }) {
  const taRef = useRef(null);
  const selectAll = () => { if (taRef.current) { taRef.current.select(); } };
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20
    }} onClick={onClose}>
      <div style={{
        background: "#13131a", border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 14, padding: 24, width: "100%", maxWidth: 640,
        boxShadow: "0 24px 80px rgba(0,0,0,0.6)"
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, color: "#fff" }}>{title}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 20, cursor: "pointer", lineHeight: 1 }}>✕</button>
        </div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 10, lineHeight: 1.6 }}>
          Click inside the box → <strong style={{color:"rgba(255,255,255,0.7)"}}>Ctrl+A</strong> (or Cmd+A) to select all → <strong style={{color:"rgba(255,255,255,0.7)"}}>Ctrl+C</strong> to copy → paste into Excel or Google Sheets.
        </div>
        <textarea
          ref={taRef} readOnly onClick={selectAll} value={text}
          style={{
            width: "100%", height: 180, background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 12px",
            fontFamily: "'DM Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.7)",
            lineHeight: 1.5, resize: "none", outline: "none", whiteSpace: "pre"
          }}
        />
        <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{
            fontFamily: "'DM Mono',monospace", fontSize: 11, letterSpacing: 1,
            color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "7px 16px", cursor: "pointer"
          }}>CLOSE</button>
        </div>
      </div>
    </div>
  );
}

function CopyRowButton({ report, onShow }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); onShow(buildRow(report), "Copy Row — Single Deal"); }}
      style={{
        fontFamily:"'DM Mono',monospace", fontSize:11, color: "rgba(255,255,255,0.4)",
        background: "rgba(255,255,255,0.05)", border:`1px solid rgba(255,255,255,0.1)`,
        borderRadius:6, padding:"6px 12px", cursor:"pointer", letterSpacing:1,
        transition:"all 0.2s", whiteSpace:"nowrap", display:"flex", alignItems:"center", gap:6,
      }}>
      ⎘ COPY ROW
    </button>
  );
}

function ReportCard({ report, onRemove, onShow, index }) {
  const [expanded, setExpanded] = useState(true);
  const grade = getGrade(report.totalScore);

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)", border: `1px solid rgba(255,255,255,0.08)`,
      borderTop: `2px solid ${grade.color}`, borderRadius: 12, overflow: "hidden",
      transition: "all 0.3s ease", animation: "slideIn 0.4s ease forwards",
      animationDelay: `${index * 0.05}s`, opacity: 0,
    }}>
      <div onClick={() => setExpanded(!expanded)} style={{
        padding: "18px 22px", cursor: "pointer", display: "flex",
        alignItems: "center", justifyContent: "space-between", gap: 12, background: grade.bg,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: 2, textTransform: "uppercase" }}>
              #{String(index + 1).padStart(2, "0")}
            </span>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {report.businessName}
            </span>
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
            {report.industry} · {report.askingPrice}
            {report.annualSDE && report.annualSDE !== "Not disclosed" ? ` · SDE ${report.annualSDE}` : ""}
            {report.sdeMultiple && report.sdeMultiple !== "N/A" ? ` · ${report.sdeMultiple}` : ""}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, color: grade.color, lineHeight: 1, textShadow: `0 0 20px ${grade.color}60` }}>
              {report.totalScore}<span style={{ fontSize: 14, color: "rgba(255,255,255,0.3)" }}>/100</span>
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: grade.color, letterSpacing: 1 }}>{grade.label}</div>
          </div>
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 18, transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▾</div>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "20px 22px 22px" }}>
          <div style={{ display: "grid", gap: 14, marginBottom: 20 }}>
            {CRITERIA.map((c) => (
              <div key={c.id}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>{c.label}</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{c.description}</div>
                  </div>
                </div>
                <ScoreBar value={report.scores[c.id]} max={c.max} />
                {report.rationale?.[c.id] && (
                  <div style={{ marginTop: 6, fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
                    {report.rationale[c.id]}
                  </div>
                )}
              </div>
            ))}
          </div>

          {report.keyRisks && (
            <div style={{ background: "rgba(255,77,109,0.05)", border: "1px solid rgba(255,77,109,0.15)", borderRadius: 8, padding: "14px 16px", marginBottom: 14 }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 11, fontWeight: 700, color: "#ff4d6d", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>⚠ Key Risks</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>{report.keyRisks}</div>
            </div>
          )}

          {report.verdict && (
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "14px 16px", marginBottom: 14 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Lab Verdict</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.7 }}>{report.verdict}</div>
            </div>
          )}

          {report.reelHook && (
            <div style={{ background: `linear-gradient(135deg, rgba(0,245,212,0.05), rgba(0,245,212,0.02))`, border: `1px solid rgba(0,245,212,0.15)`, borderRadius: 8, padding: "14px 16px", marginBottom: 14 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 11, fontWeight: 700, color: "#00f5d4", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>📱 Reel Hook</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.7, fontStyle: "italic" }}>"{report.reelHook}"</div>
            </div>
          )}

          <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
            <CopyRowButton report={report} onShow={onShow} />
            <button
              onClick={(e) => { e.stopPropagation(); generatePDF(report); }}
              style={{
                fontFamily:"'DM Mono',monospace", fontSize:11, color:"rgba(0,245,212,0.8)",
                background:"rgba(0,245,212,0.06)", border:"1px solid rgba(0,245,212,0.2)",
                borderRadius:6, padding:"6px 12px", cursor:"pointer", letterSpacing:1,
                transition:"all 0.2s", whiteSpace:"nowrap", display:"flex", alignItems:"center", gap:6,
              }}
              onMouseEnter={e => e.currentTarget.style.background="rgba(0,245,212,0.12)"}
              onMouseLeave={e => e.currentTarget.style.background="rgba(0,245,212,0.06)"}
            >📄 GENERATE PDF</button>
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              style={{
                fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(255,77,109,0.5)",
                background: "none", border: "1px solid rgba(255,77,109,0.2)", borderRadius: 6,
                padding: "6px 14px", cursor: "pointer", letterSpacing: 1, transition: "all 0.2s"
              }}
              onMouseEnter={e => { e.target.style.color = "#ff4d6d"; e.target.style.borderColor = "rgba(255,77,109,0.5)"; }}
              onMouseLeave={e => { e.target.style.color = "rgba(255,77,109,0.5)"; e.target.style.borderColor = "rgba(255,77,109,0.2)"; }}
            >REMOVE</button>
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"rgba(255,255,255,0.18)", marginLeft:"auto" }}>
              Screened {report.dateScreened}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HustleLabScreener() {
  const [listing, setListing] = useState("");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [debug, setDebug] = useState("");
  const [modal, setModal] = useState(null);
  const textareaRef = useRef(null);

  const SYSTEM_PROMPT = `You are a skeptical small business acquisition analyst. Score this listing on 5 criteria, each 1-5. Be harsh — most listings deserve 2-3, not 4-5. Respond ONLY with a JSON object, no markdown, no backticks.

Criteria:
- cashflow (1-5): quality of SDE/earnings
- multiple (1-5): price vs SDE. over 5x=1, 4-5x=2, 3-4x=3, 2-3x=4, under 2x=5
- transferability (1-5): owner dependency risk
- moat (1-5): defensibility and recurring revenue
- upside (1-5): growth levers available

JSON format:
{"businessName":"","industry":"","askingPrice":"","annualSDE":"","sdeMultiple":"","scores":{"cashflow":0,"multiple":0,"transferability":0,"moat":0,"upside":0},"rationale":{"cashflow":"","multiple":"","transferability":"","moat":"","upside":""},"totalScore":0,"keyRisks":"","verdict":"","reelHook":""}`;

  const runScreener = async () => {
    if (!listing.trim()) return;
    setLoading(true);
    setError("");
    setDebug("");

    try {
      setDebug("Calling proxy...");

      // ── KEY CHANGE: call /api/screen instead of Anthropic directly ──
      const response = await fetch("/api/screen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 1500,
          messages: [{ role: "user", content: `${SYSTEM_PROMPT}\n\nScore this listing. RESPOND ONLY WITH A SINGLE VALID JSON OBJECT. NO MARKDOWN. NO BACKTICKS.\n\n${listing}` }],
        }),
      });

      const data = await response.json();
      setDebug(`Status ${response.status}: ${JSON.stringify(data).slice(0, 200)}`);

      if (!response.ok || data.error) {
        setError(`API error ${response.status}: ${data.error?.message || JSON.stringify(data)}`);
        setLoading(false);
        return;
      }

      const raw = data.content?.map(b => b.text || "").join("") || "";
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        setError(`No JSON found. Raw response: ${raw.slice(0, 500)}`);
        setLoading(false);
        return;
      }

      let parsed;
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (jsonErr) {
        setError(`JSON parse failed: ${jsonMatch[0].slice(0, 300)}`);
        setLoading(false);
        return;
      }

      const clamp = (v) => Math.min(5, Math.max(1, Math.round(v || 0)));
      parsed.scores.cashflow       = clamp(parsed.scores.cashflow)       * 4;
      parsed.scores.multiple       = clamp(parsed.scores.multiple)       * 4;
      parsed.scores.transferability = clamp(parsed.scores.transferability) * 4;
      parsed.scores.moat           = clamp(parsed.scores.moat)           * 4;
      parsed.scores.upside         = clamp(parsed.scores.upside)         * 4;
      parsed.totalScore = CRITERIA.reduce((sum, c) => sum + (parsed.scores[c.id] || 0), 0);
      parsed.dateScreened = new Date().toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });

      setReports(prev => [parsed, ...prev]);
      setListing("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";

    } catch (err) {
      setError(`Error: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) runScreener();
  };

  const autoResize = (e) => {
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 280) + "px";
  };

  const avgScore = reports.length
    ? (reports.reduce((s, r) => s + r.totalScore, 0) / reports.length).toFixed(1)
    : null;

  const gradeCounts = reports.reduce((acc, r) => {
    const g = getGrade(r.totalScore).label.split(" ")[1];
    acc[g] = (acc[g] || 0) + 1;
    return acc;
  }, {});

  return (
    <>
      {modal && <ExportModal text={modal.text} title={modal.title} onClose={() => setModal(null)} />}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:ital,wght@0,300;0,400;0,500;1,400&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; } body { background: #0a0a0f; } ::selection { background: rgba(0,245,212,0.3); } ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; } textarea::placeholder { color: rgba(255,255,255,0.2) !important; } @keyframes slideIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } } @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } } @keyframes scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(100vh); } }`}</style>

      <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#fff", fontFamily: "'DM Mono', monospace", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(transparent, rgba(0,245,212,0.03), transparent)", animation: "scanline 8s linear infinite", pointerEvents: "none", zIndex: 0 }} />
        <div style={{ position: "fixed", inset: 0, backgroundImage: `linear-gradient(rgba(0,245,212,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,212,0.02) 1px, transparent 1px)`, backgroundSize: "48px 48px", pointerEvents: "none" }} />

        <div style={{ maxWidth: 780, margin: "0 auto", padding: "40px 20px 80px", position: "relative", zIndex: 1 }}>

          {/* Header */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00f5d4", boxShadow: "0 0 12px #00f5d4", animation: "pulse 2s ease-in-out infinite" }} />
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: 3, textTransform: "uppercase" }}>The Hustle Lab · Deal Screener v1</span>
            </div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(28px, 6vw, 48px)", fontWeight: 800, color: "#fff", lineHeight: 1.1, letterSpacing: -1 }}>
              The Lab Report™<br />
              <span style={{ color: "#00f5d4", textShadow: "0 0 30px rgba(0,245,212,0.4)" }}>Screener</span>
            </h1>
            <p style={{ marginTop: 12, fontFamily: "'DM Mono', monospace", fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.7 }}>
              Paste any listing. Get a scored Lab Report in seconds. Works on BizBuySell, Flippa, BizQuest, or any raw text.
            </p>
          </div>

          {/* Stats bar */}
          {reports.length > 0 && (
            <>
              <div style={{ display: "flex", gap: 1, marginBottom: 0, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px 10px 0 0", overflow: "hidden", animation: "slideIn 0.3s ease forwards" }}>
                {[
                  { label: "Screened", value: reports.length, color: "#fff" },
                  { label: "Avg Score", value: `${avgScore}/100`, color: "#00f5d4" },
                  ...Object.entries(gradeCounts).map(([g, n]) => ({
                    label: g, value: n,
                    color: g === "DIAMOND" ? "#00f5d4" : g === "POLISHED" ? "#f0c040" : g === "ROUGH" ? "#ff8c42" : "#ff4d6d"
                  }))
                ].map((stat, i) => (
                  <div key={i} style={{ flex: 1, padding: "14px 16px", borderRight: "1px solid rgba(255,255,255,0.05)", textAlign: "center" }}>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: 1.5, textTransform: "uppercase", marginTop: 3 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 16px", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderTop:"none", borderRadius:"0 0 10px 10px", marginBottom: 24, flexWrap:"wrap", gap:10 }}>
                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"rgba(255,255,255,0.25)", letterSpacing:1 }}>
                  💡 Copy Row = single deal · Copy All = every deal with headers — paste directly into Excel or Google Sheets
                </span>
                <button
                  onClick={() => setModal({ text: buildTSV(reports), title: `Export All (${reports.length} deals)` })}
                  style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:11, letterSpacing:1, color:"#0a0a0f", background:"linear-gradient(135deg,#00f5d4,#00c4a8)", border:"none", borderRadius:6, padding:"7px 16px", cursor:"pointer", whiteSpace:"nowrap", boxShadow:"0 0 16px rgba(0,245,212,0.2)", transition:"all 0.2s" }}
                >⎘ EXPORT ALL ({reports.length})</button>
              </div>
            </>
          )}

          {/* Input */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, overflow: "hidden", marginBottom: 28, transition: "border-color 0.2s" }}>
            <div style={{ padding: "12px 18px 0", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", letterSpacing: 2, textTransform: "uppercase" }}>Paste Listing</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.15)" }}>⌘↵ to run</span>
            </div>
            <textarea
              ref={textareaRef}
              value={listing}
              onChange={e => { setListing(e.target.value); autoResize(e); }}
              onKeyDown={handleKeyDown}
              placeholder="Paste the full listing text here — asking price, revenue, SDE, description, everything..."
              rows={5}
              style={{ width: "100%", background: "transparent", border: "none", outline: "none", resize: "none", color: "rgba(255,255,255,0.8)", fontFamily: "'DM Mono', monospace", fontSize: 13, lineHeight: 1.7, padding: "14px 18px 18px", minHeight: 120, maxHeight: 280 }}
            />
          </div>

          {error && (
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#ff4d6d", marginBottom: 8, padding: "10px 14px", background: "rgba(255,77,109,0.08)", borderRadius: 8, border: "1px solid rgba(255,77,109,0.2)", wordBreak: "break-all" }}>{error}</div>
          )}

          {debug && (
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(255,220,100,0.8)", marginBottom: 16, padding: "10px 14px", background: "rgba(255,220,100,0.05)", borderRadius: 8, border: "1px solid rgba(255,220,100,0.15)", wordBreak: "break-all", whiteSpace: "pre-wrap" }}>🔍 DEBUG: {debug}</div>
          )}

          <button
            onClick={runScreener}
            disabled={loading || !listing.trim()}
            style={{ width: "100%", padding: "16px", background: loading || !listing.trim() ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #00f5d4, #00c4a8)", border: "none", borderRadius: 10, color: loading || !listing.trim() ? "rgba(255,255,255,0.2)" : "#0a0a0f", fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 800, letterSpacing: 1, cursor: loading || !listing.trim() ? "not-allowed" : "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 36, boxShadow: loading || !listing.trim() ? "none" : "0 0 30px rgba(0,245,212,0.25)" }}
          >
            {loading ? (<><span style={{ animation: "pulse 1s ease-in-out infinite" }}>⚡</span>ANALYZING DEAL...</>) : "RUN LAB REPORT™"}
          </button>

          {reports.length === 0 && !loading && (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "rgba(255,255,255,0.12)", fontFamily: "'DM Mono', monospace", fontSize: 13 }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🔬</div>
              No reports yet. Paste a listing above to run your first screen.
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {reports.map((r, i) => (
              <ReportCard key={i} report={r} index={i} onShow={(text, title) => setModal({ text, title })} onRemove={() => setReports(prev => prev.filter((_, idx) => idx !== i))} />
            ))}
          </div>

          <div style={{ marginTop: 48, textAlign: "center", fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.12)", letterSpacing: 2 }}>
            THE HUSTLE LAB · HUSTLELABCO.COM · NOT FINANCIAL ADVICE
          </div>
        </div>
      </div>
    </>
  );
}
