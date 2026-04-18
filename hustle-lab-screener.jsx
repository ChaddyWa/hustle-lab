import { useState, useRef } from "react";

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
  const gradeColor = gradeText === "ROUGH" ? [184,120,64] : gradeText === "PASS" ? [184,64,64] : [201,168,76];

  doc.setFillColor(15, 13, 10); doc.rect(0, 0, W, H, "F");
  doc.setFillColor(...gradeColor); doc.rect(0, 0, W, 2, "F");
  doc.setFillColor(20, 18, 14); doc.rect(0, 2, W, 36, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(100, 90, 70);
  doc.text("THE HUSTLE LAB  ·  LAB REPORT™", 14, 12);
  doc.setFontSize(18); doc.setTextColor(245, 240, 232);
  doc.text(report.businessName || "Unnamed Business", 14, 24);
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(130, 115, 90);
  const meta = [report.industry, report.askingPrice, report.annualSDE ? `SDE ${report.annualSDE}` : null, report.sdeMultiple && report.sdeMultiple !== "N/A" ? report.sdeMultiple : null].filter(Boolean).join("  ·  ");
  doc.text(meta, 14, 32);
  const cx = 185, cy = 20;
  doc.setFillColor(...gradeColor); doc.circle(cx, cy, 14, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(15, 13, 10);
  doc.text(String(report.totalScore), cx, cy + 2, { align: "center" });
  doc.setFontSize(6); doc.text("/100", cx, cy + 7, { align: "center" });
  doc.setFontSize(7); doc.text(gradeText, cx, cy + 12, { align: "center" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(80, 75, 60);
  doc.text(report.dateScreened || new Date().toLocaleDateString(), 14, 41);

  let y = 50;
  doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(...gradeColor);
  doc.text("SCORES", 14, y); y += 5;

  CRITERIA.forEach((c) => {
    const val = report.scores[c.id] || 0; const pct = val / c.max;
    const barColor = pct >= 0.8 ? [201,168,76] : pct >= 0.6 ? [180,140,60] : pct >= 0.4 ? [160,100,40] : [160,60,60];
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(200, 190, 170);
    doc.text(c.label, 14, y);
    doc.setFillColor(30, 28, 22); doc.roundedRect(70, y - 3.5, 90, 4, 1, 1, "F");
    doc.setFillColor(...barColor); doc.roundedRect(70, y - 3.5, 90 * pct, 4, 1, 1, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(...barColor);
    doc.text(`${val}/${c.max}`, 168, y, { align: "right" });
    if (report.rationale?.[c.id]) {
      doc.setFont("helvetica", "italic"); doc.setFontSize(6.5); doc.setTextColor(100, 95, 75);
      const lines = doc.splitTextToSize(report.rationale[c.id], 152);
      doc.text(lines, 14, y + 4); y += 4 + lines.length * 3.5;
    } else { y += 7; }
  });

  y += 4; doc.setDrawColor(40, 35, 25); doc.line(14, y, W - 14, y); y += 6;

  if (report.topPositives) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(80, 140, 80);
    doc.text("TOP 3 POSITIVES", 14, y); y += 4;
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(160, 190, 160);
    const posLines = doc.splitTextToSize(report.topPositives, 182);
    doc.text(posLines, 14, y); y += posLines.length * 3.8 + 5;
  }
  if (report.keyRisks) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(180, 60, 60);
    doc.text("KEY RISKS", 14, y); y += 4;
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(180, 170, 160);
    const riskLines = doc.splitTextToSize(report.keyRisks, 182);
    doc.text(riskLines, 14, y); y += riskLines.length * 3.8 + 5;
  }
  if (report.verdict) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(...gradeColor);
    doc.text("LAB VERDICT", 14, y); y += 4;
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(200, 190, 170);
    const vLines = doc.splitTextToSize(report.verdict, 182);
    doc.text(vLines, 14, y); y += vLines.length * 3.8 + 5;
  }
  if (report.reelHook) {
    doc.setFillColor(20, 30, 20);
    const hookLines = doc.splitTextToSize(`"${report.reelHook}"`, 170);
    const boxH = hookLines.length * 4 + 10;
    doc.roundedRect(14, y, W - 28, boxH, 2, 2, "F");
    doc.setFillColor(...gradeColor); doc.roundedRect(14, y, 2, boxH, 1, 1, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(6.5); doc.setTextColor(...gradeColor);
    doc.text("REEL HOOK", 20, y + 5);
    doc.setFont("helvetica", "italic"); doc.setFontSize(7.5); doc.setTextColor(220, 210, 190);
    doc.text(hookLines, 20, y + 10);
  }

  doc.setFillColor(12, 10, 8); doc.rect(0, H - 10, W, 10, "F");
  doc.setFont("helvetica", "normal"); doc.setFontSize(6); doc.setTextColor(80, 70, 50);
  doc.text("THE HUSTLE LAB  ·  HUSTLELABCO.COM  ·  NOT FINANCIAL ADVICE", W / 2, H - 4, { align: "center" });
  doc.save(`lab-report-${(report.businessName || "deal").toLowerCase().replace(/\s+/g, "-")}.pdf`);
}

const HEADERS = ["Date Screened","Business Name","Industry","Asking Price","Annual SDE","SDE Multiple","Cash Flow & SDE","Valuation Multiple","Transferability","Moat & Market","Upside Potential","Total Score","Grade","CF Rationale","Multiple Rationale","Transferability Rationale","Moat Rationale","Upside Rationale","Top Positives","Key Risks","Verdict","Reel Hook"];

function reportToRow(r) {
  const grade = getGrade(r.totalScore).label.replace(/[💎✨🪨🚫]\s?/, "");
  return [r.dateScreened||new Date().toLocaleDateString(),r.businessName,r.industry,r.askingPrice,r.annualSDE||"",r.sdeMultiple||"",r.scores.cashflow,r.scores.multiple,r.scores.transferability,r.scores.moat,r.scores.upside,r.totalScore,grade,r.rationale?.cashflow||"",r.rationale?.multiple||"",r.rationale?.transferability||"",r.rationale?.moat||"",r.rationale?.upside||"",r.topPositives||"",r.keyRisks||"",r.verdict||"",r.reelHook||""].map(v=>`"${String(v).replace(/"/g,'""')}"`);
}
function buildTSV(reports) { return [HEADERS,...reports.map(r=>reportToRow(r).map(v=>v.replace(/^"|"$/g,"").replace(/""/g,'"')))].map(row=>row.join("\t")).join("\n"); }
function buildRow(report) { return reportToRow(report).map(v=>v.replace(/^"|"$/g,"").replace(/""/g,'"')).join("\t"); }

const CRITERIA = [
  { id: "cashflow",        label: "Cash Flow & SDE",    max: 20, description: "Owner earnings, add-backs, margin quality" },
  { id: "multiple",        label: "Valuation Multiple", max: 20, description: "Price/SDE vs. industry benchmark" },
  { id: "transferability", label: "Transferability",    max: 20, description: "Owner dependency, systems, staff retention" },
  { id: "moat",            label: "Moat & Market",      max: 20, description: "Competition, recurring revenue, defensibility" },
  { id: "upside",          label: "Upside Potential",   max: 20, description: "Growth levers, digital gap, pricing power" },
];

function getGrade(score) {
  if (score >= 85) return { label: "💎 DIAMOND", color: "#C9A84C", bg: "rgba(201,168,76,0.07)" };
  if (score >= 65) return { label: "✨ POLISHED", color: "#C9A84C", bg: "rgba(201,168,76,0.05)" };
  if (score >= 40) return { label: "🪨 ROUGH",   color: "#b87840", bg: "rgba(184,120,64,0.06)" };
  return               { label: "🚫 PASS",       color: "#b84040", bg: "rgba(184,64,64,0.06)" };
}

function ScoreBar({ value, max }) {
  const pct = (value / max) * 100;
  const color = value >= 16 ? "#C9A84C" : value >= 12 ? "#b89840" : value >= 8 ? "#b87840" : "#b84040";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, height: 5, background: "rgba(245,240,232,0.06)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)", boxShadow: `0 0 8px ${color}50` }} />
      </div>
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color, minWidth: 40, fontWeight: 600 }}>{value}/{max}</span>
    </div>
  );
}

function ExportModal({ text, title, onClose }) {
  const taRef = useRef(null);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: "#1a1710", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 14, padding: 24, width: "100%", maxWidth: 640, boxShadow: "0 24px 80px rgba(0,0,0,0.7)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, color: "#f5f0e8" }}>{title}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(245,240,232,0.4)", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "rgba(245,240,232,0.4)", marginBottom: 10, lineHeight: 1.6 }}>
          Click inside → <strong style={{color:"rgba(245,240,232,0.7)"}}>Ctrl+A</strong> → <strong style={{color:"rgba(245,240,232,0.7)"}}>Ctrl+C</strong> → paste into Excel or Google Sheets.
        </div>
        <textarea ref={taRef} readOnly onClick={() => taRef.current?.select()} value={text}
          style={{ width: "100%", height: 180, background: "rgba(245,240,232,0.03)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 8, padding: "10px 12px", fontFamily: "monospace", fontSize: 11, color: "rgba(245,240,232,0.6)", lineHeight: 1.5, resize: "none", outline: "none", whiteSpace: "pre" }} />
        <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "rgba(245,240,232,0.5)", background: "rgba(245,240,232,0.05)", border: "1px solid rgba(245,240,232,0.1)", borderRadius: 6, padding: "7px 16px", cursor: "pointer" }}>Close</button>
        </div>
      </div>
    </div>
  );
}

function ReportCard({ report, onRemove, onShow, index }) {
  const [expanded, setExpanded] = useState(true);
  const grade = getGrade(report.totalScore);
  return (
    <div style={{ background: "rgba(245,240,232,0.02)", border: "1px solid rgba(201,168,76,0.12)", borderTop: `2px solid ${grade.color}`, borderRadius: 12, overflow: "hidden", animation: "slideIn 0.4s ease forwards", animationDelay: `${index * 0.05}s`, opacity: 0 }}>
      <div onClick={() => setExpanded(!expanded)} style={{ padding: "18px 22px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: grade.bg }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "rgba(201,168,76,0.5)", letterSpacing: 2, textTransform: "uppercase" }}>#{String(index + 1).padStart(2, "0")}</span>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: "#f5f0e8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{report.businessName}</span>
          </div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "rgba(245,240,232,0.4)", marginTop: 4 }}>
            {report.industry} · {report.askingPrice}
            {report.annualSDE && report.annualSDE !== "Not disclosed" ? ` · SDE ${report.annualSDE}` : ""}
            {report.sdeMultiple && report.sdeMultiple !== "N/A" ? ` · ${report.sdeMultiple}` : ""}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: grade.color, lineHeight: 1, textShadow: `0 0 24px ${grade.color}35` }}>
              {report.totalScore}<span style={{ fontSize: 14, color: "rgba(245,240,232,0.25)", fontFamily: "'DM Sans', sans-serif" }}>/100</span>
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: grade.color, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 2 }}>{grade.label}</div>
          </div>
          <div style={{ color: "rgba(245,240,232,0.25)", fontSize: 16, transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▾</div>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "20px 22px 22px" }}>
          <div style={{ display: "grid", gap: 14, marginBottom: 20 }}>
            {CRITERIA.map((c) => (
              <div key={c.id}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 13, fontWeight: 600, color: "rgba(245,240,232,0.85)" }}>{c.label}</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "rgba(245,240,232,0.3)" }}>{c.description}</div>
                  </div>
                </div>
                <ScoreBar value={report.scores[c.id]} max={c.max} />
                {report.rationale?.[c.id] && (
                  <div style={{ marginTop: 6, fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "rgba(245,240,232,0.4)", lineHeight: 1.65 }}>{report.rationale[c.id]}</div>
                )}
              </div>
            ))}
          </div>

          {/* Top 3 Positives */}
          {report.topPositives && (
            <div style={{ background: "rgba(30,58,47,0.35)", border: "1px solid rgba(80,160,80,0.18)", borderRadius: 8, padding: "14px 16px", marginBottom: 14 }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 12, fontWeight: 700, color: "#7ec87e", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>✦ Top 3 Positives</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "rgba(245,240,232,0.65)", lineHeight: 1.75 }}>{report.topPositives}</div>
            </div>
          )}

          {/* Key Risks */}
          {report.keyRisks && (
            <div style={{ background: "rgba(100,30,30,0.2)", border: "1px solid rgba(184,64,64,0.2)", borderRadius: 8, padding: "14px 16px", marginBottom: 14 }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 12, fontWeight: 700, color: "#b84040", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>⚠ Key Risks</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "rgba(245,240,232,0.6)", lineHeight: 1.75 }}>{report.keyRisks}</div>
            </div>
          )}

          {/* Verdict */}
          {report.verdict && (
            <div style={{ background: "rgba(245,240,232,0.02)", border: "1px solid rgba(201,168,76,0.1)", borderRadius: 8, padding: "14px 16px", marginBottom: 14 }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 12, fontWeight: 700, color: "rgba(201,168,76,0.6)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Lab Verdict</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "rgba(245,240,232,0.65)", lineHeight: 1.75 }}>{report.verdict}</div>
            </div>
          )}

          {/* Reel Hook */}
          {report.reelHook && (
            <div style={{ background: "rgba(201,168,76,0.04)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 8, padding: "14px 16px", marginBottom: 14 }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 12, fontWeight: 700, color: "#C9A84C", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>📱 Reel Hook</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "rgba(245,240,232,0.7)", lineHeight: 1.75, fontStyle: "italic" }}>"{report.reelHook}"</div>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 4 }}>
            <button onClick={(e) => { e.stopPropagation(); onShow(buildRow(report), "Copy Row — Single Deal"); }}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "rgba(245,240,232,0.45)", background: "rgba(245,240,232,0.04)", border: "1px solid rgba(245,240,232,0.1)", borderRadius: 6, padding: "6px 14px", cursor: "pointer" }}>
              ⎘ Copy Row
            </button>
            <button onClick={(e) => { e.stopPropagation(); generatePDF(report); }}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#C9A84C", background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 6, padding: "6px 14px", cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(201,168,76,0.12)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(201,168,76,0.06)"}
            >📄 Generate PDF</button>
            <button onClick={(e) => { e.stopPropagation(); onRemove(); }}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "rgba(184,64,64,0.5)", background: "none", border: "1px solid rgba(184,64,64,0.2)", borderRadius: 6, padding: "6px 14px", cursor: "pointer" }}
              onMouseEnter={e => { e.target.style.color = "#b84040"; e.target.style.borderColor = "rgba(184,64,64,0.5)"; }}
              onMouseLeave={e => { e.target.style.color = "rgba(184,64,64,0.5)"; e.target.style.borderColor = "rgba(184,64,64,0.2)"; }}
            >Remove</button>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "rgba(245,240,232,0.18)", marginLeft: "auto" }}>Screened {report.dateScreened}</span>
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

Also return:
- topPositives: exactly 3 numbered strengths of this deal (be specific, not generic)
- keyRisks: top concerns as a paragraph
- verdict: final lab assessment
- reelHook: one punchy Instagram Reel hook line about this deal

JSON format:
{"businessName":"","industry":"","askingPrice":"","annualSDE":"","sdeMultiple":"","scores":{"cashflow":0,"multiple":0,"transferability":0,"moat":0,"upside":0},"rationale":{"cashflow":"","multiple":"","transferability":"","moat":"","upside":""},"totalScore":0,"topPositives":"","keyRisks":"","verdict":"","reelHook":""}`;

  const runScreener = async () => {
    if (!listing.trim()) return;
    setLoading(true); setError(""); setDebug("");
    try {
      setDebug("Calling proxy...");
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
      if (!response.ok || data.error) { setError(`API error ${response.status}: ${data.error?.message || JSON.stringify(data)}`); setLoading(false); return; }
      const raw = data.content?.map(b => b.text || "").join("") || "";
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) { setError(`No JSON found. Raw: ${raw.slice(0, 500)}`); setLoading(false); return; }
      let parsed;
      try { parsed = JSON.parse(jsonMatch[0]); } catch (e) { setError(`Parse failed: ${jsonMatch[0].slice(0, 300)}`); setLoading(false); return; }
      const clamp = (v) => Math.min(5, Math.max(1, Math.round(v || 0)));
      parsed.scores.cashflow        = clamp(parsed.scores.cashflow)        * 4;
      parsed.scores.multiple        = clamp(parsed.scores.multiple)        * 4;
      parsed.scores.transferability = clamp(parsed.scores.transferability) * 4;
      parsed.scores.moat            = clamp(parsed.scores.moat)            * 4;
      parsed.scores.upside          = clamp(parsed.scores.upside)          * 4;
      parsed.totalScore = CRITERIA.reduce((sum, c) => sum + (parsed.scores[c.id] || 0), 0);
      parsed.dateScreened = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      setReports(prev => [parsed, ...prev]);
      setListing("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    } catch (err) { setError(`Error: ${err.message}`); } finally { setLoading(false); }
  };

  const handleKeyDown = (e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) runScreener(); };
  const autoResize = (e) => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 280) + "px"; };
  const avgScore = reports.length ? (reports.reduce((s, r) => s + r.totalScore, 0) / reports.length).toFixed(1) : null;
  const gradeCounts = reports.reduce((acc, r) => { const g = getGrade(r.totalScore).label.split(" ")[1]; acc[g] = (acc[g] || 0) + 1; return acc; }, {});

  return (
    <>
      {modal && <ExportModal text={modal.text} title={modal.title} onClose={() => setModal(null)} />}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0f0d0a; }
        ::selection { background: rgba(201,168,76,0.25); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.2); border-radius: 2px; }
        textarea::placeholder { color: rgba(245,240,232,0.18) !important; }
        @keyframes slideIn { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#0f0d0a", color: "#f5f0e8", fontFamily: "'DM Sans', sans-serif", position: "relative" }}>
        <div style={{ position: "fixed", inset: 0, backgroundImage: "radial-gradient(ellipse at 20% 50%, rgba(30,58,47,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(201,168,76,0.05) 0%, transparent 50%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px 80px", position: "relative", zIndex: 1 }}>

          {/* Header */}
          <div style={{ marginBottom: 44 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <img src="/logo.png" alt="The Hustle Lab" style={{ height: 52, width: "auto" }} onError={e => e.target.style.display = "none"} />
              <div style={{ width: "1px", height: 40, background: "rgba(201,168,76,0.2)" }} />
              <div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "rgba(201,168,76,0.6)", letterSpacing: 3, textTransform: "uppercase", marginBottom: 3 }}>Deal Intelligence</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: "#f5f0e8", lineHeight: 1 }}>Lab Report™ Screener</div>
              </div>
            </div>
            <div style={{ height: "1px", background: "linear-gradient(90deg, rgba(201,168,76,0.3), transparent)", marginBottom: 18 }} />
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "rgba(245,240,232,0.4)", lineHeight: 1.8, maxWidth: 560 }}>
              Paste any listing. Get a scored Lab Report in seconds. Works on BizBuySell, Flippa, BizQuest, or any raw text.
            </p>
          </div>

          {/* Stats */}
          {reports.length > 0 && (
            <>
              <div style={{ display: "flex", gap: 1, background: "rgba(245,240,232,0.02)", border: "1px solid rgba(201,168,76,0.1)", borderRadius: "10px 10px 0 0", overflow: "hidden" }}>
                {[{ label: "Screened", value: reports.length, color: "#f5f0e8" }, { label: "Avg Score", value: `${avgScore}/100`, color: "#C9A84C" }, ...Object.entries(gradeCounts).map(([g, n]) => ({ label: g, value: n, color: g === "ROUGH" ? "#b87840" : g === "PASS" ? "#b84040" : "#C9A84C" }))].map((stat, i) => (
                  <div key={i} style={{ flex: 1, padding: "14px 16px", borderRight: "1px solid rgba(201,168,76,0.07)", textAlign: "center" }}>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: "rgba(245,240,232,0.3)", letterSpacing: 1.5, textTransform: "uppercase", marginTop: 3 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: "rgba(245,240,232,0.015)", border: "1px solid rgba(201,168,76,0.1)", borderTop: "none", borderRadius: "0 0 10px 10px", marginBottom: 28, flexWrap: "wrap", gap: 10 }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "rgba(245,240,232,0.25)" }}>Copy Row = single deal · Export All = every deal with headers</span>
                <button onClick={() => setModal({ text: buildTSV(reports), title: `Export All (${reports.length} deals)` })}
                  style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 12, color: "#0f0d0a", background: "linear-gradient(135deg, #C9A84C, #a8863c)", border: "none", borderRadius: 6, padding: "7px 18px", cursor: "pointer", boxShadow: "0 0 20px rgba(201,168,76,0.2)" }}>
                  ⎘ Export All ({reports.length})
                </button>
              </div>
            </>
          )}

          {/* Input */}
          <div style={{ background: "rgba(245,240,232,0.02)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
            <div style={{ padding: "12px 18px 0", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "rgba(201,168,76,0.5)", letterSpacing: 2, textTransform: "uppercase" }}>Paste Listing</span>
              <div style={{ flex: 1, height: 1, background: "rgba(201,168,76,0.08)" }} />
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "rgba(245,240,232,0.2)" }}>⌘↵ to run</span>
            </div>
            <textarea ref={textareaRef} value={listing} onChange={e => { setListing(e.target.value); autoResize(e); }} onKeyDown={handleKeyDown}
              placeholder="Paste the full listing text here — asking price, revenue, SDE, description, everything..."
              rows={5} style={{ width: "100%", background: "transparent", border: "none", outline: "none", resize: "none", color: "rgba(245,240,232,0.85)", fontFamily: "'DM Sans', sans-serif", fontSize: 13, lineHeight: 1.75, padding: "14px 18px 18px", minHeight: 120, maxHeight: 280 }} />
          </div>

          {error && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#b84040", marginBottom: 8, padding: "10px 14px", background: "rgba(184,64,64,0.07)", borderRadius: 8, border: "1px solid rgba(184,64,64,0.2)", wordBreak: "break-all" }}>{error}</div>}
          {debug && <div style={{ fontFamily: "monospace", fontSize: 11, color: "rgba(201,168,76,0.6)", marginBottom: 16, padding: "10px 14px", background: "rgba(201,168,76,0.04)", borderRadius: 8, border: "1px solid rgba(201,168,76,0.1)", wordBreak: "break-all", whiteSpace: "pre-wrap" }}>🔍 {debug}</div>}

          <button onClick={runScreener} disabled={loading || !listing.trim()}
            style={{ width: "100%", padding: "16px", background: loading || !listing.trim() ? "rgba(245,240,232,0.04)" : "linear-gradient(135deg, #C9A84C, #a8863c)", border: "none", borderRadius: 10, color: loading || !listing.trim() ? "rgba(245,240,232,0.2)" : "#0f0d0a", fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, cursor: loading || !listing.trim() ? "not-allowed" : "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 36, boxShadow: loading || !listing.trim() ? "none" : "0 0 32px rgba(201,168,76,0.2)" }}>
            {loading ? (<><span style={{ animation: "pulse 1s ease-in-out infinite" }}>⚡</span>Analyzing Deal...</>) : "Run Lab Report™"}
          </button>

          {reports.length === 0 && !loading && (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "rgba(245,240,232,0.12)", fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
              <div style={{ fontSize: 36, marginBottom: 14 }}>🔬</div>
              No reports yet. Paste a listing above to run your first screen.
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {reports.map((r, i) => (
              <ReportCard key={i} report={r} index={i} onShow={(text, title) => setModal({ text, title })} onRemove={() => setReports(prev => prev.filter((_, idx) => idx !== i))} />
            ))}
          </div>

          <div style={{ marginTop: 52, textAlign: "center", fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "rgba(245,240,232,0.12)", letterSpacing: 2 }}>
            THE HUSTLE LAB · HUSTLELABCO.COM · NOT FINANCIAL ADVICE
          </div>
        </div>
      </div>
    </>
  );
}
