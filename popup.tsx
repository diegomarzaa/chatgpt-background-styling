// popup.tsx

import React, { useEffect, useMemo, useState } from "react"

// ------------------------------
// Tipos
// ------------------------------
type Cfg = {
    enabled: boolean
    backgroundImageUrl: string
    mainImageOpacity: number
    blurAmount: number
    gradientOpacity: number
    collapsibleMessages: boolean
    buttonOpacity: number
    collapsedHeight: string
    altClickEnabled: boolean
    persistMessageState: boolean
}

// ------------------------------
// Utiles de mensajería
// ------------------------------
async function getActiveTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    return tab
}
async function sendToActiveTab<T = any>(payload: any): Promise<T> {
    const tab = await getActiveTab()
    if (!tab?.id) throw new Error("No active tab")
    return chrome.tabs.sendMessage(tab.id, payload)
}

// ------------------------------
// Componentes UI
// ------------------------------
const IconToggle = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
        <path d="M7 8a5 5 0 0 1 10 0h2a7 7 0 1 0 0 8h-2a5 5 0 1 1-10 0H5a7 7 0 1 0 0-8h2z" />
    </svg>
)

const IconImage = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
        <path d="M21 19V5a2 2 0 0 0-2-2H5C3.9 3 3 3.9 3 5v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2zM8.5 8A1.5 1.5 0 1 1 7 9.5 1.5 1.5 0 0 1 8.5 8zM5 19l5.5-7 3.5 4.5L16.5 14 21 19H5z" />
    </svg>
)

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="field">
        <div className="label">{label}</div>
        {children}
    </div>
)

const Slider = ({
    value,
    min,
    max,
    step,
    onChange,
    readout
}: {
    value: number
    min: number
    max: number
    step: number
    onChange: (v: number) => void
    readout: string
}) => (
    <div className="slider-row">
        <input
            className="slider"
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
        />
        <div className="badge">{readout}</div>
    </div>
)

const Switch = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button
        className={`switch ${checked ? "on" : ""}`}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        title={checked ? "Disable" : "Enable"}
    >
        <span className="knob" />
    </button>
)

// ------------------------------
// Popup principal
// ------------------------------
const Popup = () => {
    const [cfg, setCfg] = useState<Cfg | null>(null)
    const [err, setErr] = useState<string | null>(null)

    // Cargar configuración actual desde la página activa
    useEffect(() => {
        sendToActiveTab<Cfg>({ type: "GET_CFG" })
            .then(setCfg)
            .catch(() => setErr("Open chatgpt.com and reopen the popup."))
    }, [])

    // Enviar parches en tiempo real
    const patch = async (p: Partial<Cfg>) => {
        if (!cfg) return
        const next = { ...cfg, ...p }
        setCfg(next)
        try {
            await sendToActiveTab({ type: "SET_CFG_PARTIAL", patch: p })
        } catch {
            setErr("Could not communicate with the active tab.")
        }
    }

    // Previsualización pequeña del fondo (solo URL, sin leer de la página)
    const previewStyle = useMemo(
        () => ({
            backgroundImage: cfg?.backgroundImageUrl ? `url("${cfg.backgroundImageUrl}")` : "none",
            filter: `blur(${(cfg?.blurAmount ?? 0) / 4}px)`,
            opacity: cfg?.mainImageOpacity ?? 1
        }),
        [cfg?.backgroundImageUrl, cfg?.mainImageOpacity, cfg?.blurAmount]
    )

    if (err) return <Shell><div className="error">{err}</div></Shell>
    if (!cfg) return <Shell><div className="loading">Loading…</div></Shell>

    return (
        <Shell>
            {/* Header con gradiente y preview */}
            <header className="header">
                <div className="title">
                    <IconToggle />
                    <span>ChatGPT Customizer</span>
                </div>
                <div className="actions">
                    <Switch checked={!!cfg.enabled} onChange={(v) => patch({ enabled: v })} />
                </div>
            </header>

            <div className="preview" style={previewStyle as React.CSSProperties}>
                {!cfg.backgroundImageUrl && <span className="preview-hint">No image</span>}
            </div>

            {/* Tarjeta: Imagen */}
            <section className="card">
                <div className="card-head">
                    <IconImage />
                    <h4>Background image</h4>
                </div>
                <Field label="URL">
                    <div className="input-icon">
                        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
                            <path d="M3.9 12a5 5 0 0 1 5-5h3v2h-3a3 3 0 0 0 0 6h3v2h-3a5 5 0 0 1-5-5Zm7.2 1h1.8v-2h-1.8v2Zm3-6h3a5 5 0 0 1 0 10h-3v-2h3a3 3 0 0 0 0-6h-3V7Z" />
                        </svg>
                        <input
                            placeholder="https://…"
                            value={cfg.backgroundImageUrl}
                            onChange={(e) => patch({ backgroundImageUrl: e.target.value })}
                        />
                    </div>
                </Field>
            </section>

            {/* Tarjeta: Ajustes visuales */}
            <section className="card">
                <div className="card-head">
                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                        <path d="M12 3a2 2 0 0 1 2 2v1.1a7.02 7.02 0 0 1 2.05.85l.78-.78a2 2 0 1 1 2.83 2.83l-.78.78c.36.65.63 1.34.79 2.06H21a2 2 0 1 1 0 4h-1.1a7.02 7.02 0 0 1-.85 2.05l.78.78a2 2 0 1 1-2.83 2.83l-.78-.78c-.65.36-1.34.63-2.06.79V19a2 2 0 1 1-4 0v-1.1a7.02 7.02 0 0 1-2.05-.85l-.78.78a2 2 0 1 1-2.83-2.83l.78-.78A7 7 0 0 1 4.1 13H3a2 2 0 1 1 0-4h1.1a7.02 7.02 0 0 1 .85-2.05l-.78-.78a2 2 0 1 1 2.83-2.83l.78.78c.65-.36 1.34-.63 2.06-.79V5a2 2 0 0 1 2-2Z" />
                    </svg>
                    <h4>Visual Settings</h4>
                </div>

                <Field label={`Image opacity: ${Math.round(cfg.mainImageOpacity * 100)}%`}>
                    <Slider
                        value={cfg.mainImageOpacity}
                        min={0}
                        max={1}
                        step={0.01}
                        onChange={(v) => patch({ mainImageOpacity: v })}
                        readout={`${Math.round(cfg.mainImageOpacity * 100)}%`}
                    />
                </Field>

                <Field label={`Image blur: ${cfg.blurAmount}px`}>
                    <Slider
                        value={cfg.blurAmount}
                        min={0}
                        max={100}
                        step={1}
                        onChange={(v) => patch({ blurAmount: v })}
                        readout={`${cfg.blurAmount}px`}
                    />
                </Field>

                <Field label={`Gradient opacity: ${Math.round(cfg.gradientOpacity * 100)}%`}>
                    <Slider
                        value={cfg.gradientOpacity}
                        min={0}
                        max={1}
                        step={0.05}
                        onChange={(v) => patch({ gradientOpacity: v })}
                        readout={`${Math.round(cfg.gradientOpacity * 100)}%`}
                    />
                </Field>
            </section>

            {/* Tarjeta: Mensajes Colapsables */}
            <section className="card">
                <div className="card-head">
                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                        <path d="M7 10l5 5 5-5z" />
                    </svg>
                    <h4>Collapsible Messages</h4>
                </div>

                <Field label="Enable collapsible messages">
                    <Switch 
                        checked={cfg.collapsibleMessages} 
                        onChange={(v) => patch({ collapsibleMessages: v })} 
                    />
                </Field>

                {cfg.collapsibleMessages && (
                    <>
                        <Field label={`Button opacity: ${Math.round(cfg.buttonOpacity * 100)}%`}>
                            <Slider
                                value={cfg.buttonOpacity}
                                min={0}
                                max={1}
                                step={0.05}
                                onChange={(v) => patch({ buttonOpacity: v })}
                                readout={`${Math.round(cfg.buttonOpacity * 100)}%`}
                            />
                        </Field>

                        <Field label="Collapsed height">
                            <div className="input-icon">
                                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
                                    <path d="M7 10l5 5 5-5z" />
                                </svg>
                                <input
                                    placeholder="6.5em"
                                    value={cfg.collapsedHeight}
                                    onChange={(e) => patch({ collapsedHeight: e.target.value })}
                                />
                            </div>
                        </Field>

                        <Field label="Enable Alt+Click to toggle messages">
                            <Switch 
                                checked={cfg.altClickEnabled} 
                                onChange={(v) => patch({ altClickEnabled: v })} 
                            />
                        </Field>

                        <Field label="Remember collapsed state">
                            <Switch 
                                checked={cfg.persistMessageState} 
                                onChange={(v) => patch({ persistMessageState: v })} 
                            />
                        </Field>

                        <div className="info-box">
                            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                            </svg>
                            <span>
                                <strong>Shortcuts:</strong> Alt+C (closest message), Alt+Shift+C (all messages)
                                {cfg.altClickEnabled && <>, Alt+Click on any message</>}.
                                {cfg.persistMessageState && <> State is remembered between sessions.</>}
                            </span>
                        </div>
                    </>
                )}
            </section>

            <footer className="footer">
                <span className="hint">Changes apply instantly on chatgpt.com</span>
            </footer>

            {/* Estilos inline para mantener el archivo autocontenido */}
            <style>{css}</style>
        </Shell>
    )
}

// ------------------------------
// Contenedor con fondo adaptable
// ------------------------------
const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="shell">
        {children}
        <style>{shellCss}</style>
    </div>
)

// ------------------------------
// CSS (sin librerías). Tema claro/oscuro con prefers-color-scheme.
// ------------------------------
const shellCss = `
:root{
  --bg: #0f1115;
  --panel: #161922;
  --muted: #8b93a7;
  --text: #e7eaf3;
  --accent: #5b8cff;
  --accent-2: #7f56ff;
  --border: #262a36;
  --ok: #22c55e;
}
@media (prefers-color-scheme: light){
  :root{
    --bg: #f6f7fb;
    --panel: #ffffff;
    --muted: #667084;
    --text: #101828;
    --accent: #1a73e8;
    --accent-2: #6f3aff;
    --border: #e5e7ef;
    --ok: #16a34a;
  }
}
*{box-sizing:border-box}
.shell{
  min-width: 320px;
  max-width: 360px;
  color: var(--text);
  background: var(--bg);
  border-radius: 12px;
  overflow: hidden;
}
`

const css = `
body {
  margin: 0 !important;
}

.shell {
  border-radius: 0px;
}

.header{
  display:flex; align-items:center; justify-content:space-between;
  padding:12px 14px;
  background: linear-gradient(135deg, var(--panel), transparent 60%), radial-gradient(1200px 200px at -200px -200px, var(--accent-2) 0%, transparent 60%);
  border-bottom: 1px solid var(--border);
}
.title{display:flex; align-items:center; gap:8px; font-weight:600}
.title svg{fill:currentColor; opacity:.9}
.actions{display:flex; align-items:center; gap:8px}

.preview{
  height: 82px;
  background-color: #0b0c10;
  background-size: cover;
  background-position: center;
  border-bottom: 1px solid var(--border);
  position: relative;
}
.preview-hint{
  position:absolute; inset:auto 8px 8px auto; font-size:11px; color:var(--muted)
}

.card{
  margin: 10px 10px 0;
  padding: 12px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 10px;
}
.card-head{display:flex; align-items:center; gap:8px; margin-bottom:8px}
.card-head svg{fill:currentColor; opacity:.9}
.card h4{margin:0; font-size:13px; font-weight:700}

.field{margin-top:10px}
.label{font-size:12px; color:var(--muted); margin-bottom:6px}

.input-icon{
  display:flex; align-items:center; gap:8px;
  border:1px solid var(--border); padding:6px 8px; border-radius:8px;
  background: rgba(0,0,0,.04);
}
.input-icon svg{fill:var(--muted)}
.input-icon input{
  width:100%; background:transparent; border:0; outline:none; color:var(--text);
  font-size:13px;
}

.slider-row{display:flex; align-items:center; gap:10px}
.slider{flex:1; appearance:none; height:4px; border-radius:999px; background:linear-gradient(90deg, var(--accent), var(--accent-2))}
.slider::-webkit-slider-thumb{
  appearance:none; width:16px; height:16px; border-radius:50%;
  background: var(--panel); border:2px solid var(--accent-2); box-shadow:0 0 0 2px rgba(0,0,0,.1);
}
.slider::-moz-range-thumb{
  width:16px; height:16px; border-radius:50%;
  background: var(--panel); border:2px solid var(--accent-2);
}
.badge{
  min-width: 58px; text-align:center;
  border:1px solid var(--border);
  padding:4px 6px; border-radius:999px; font-size:12px; color:var(--muted);
}

.switch{
  position:relative; width:44px; height:24px; border-radius:999px;
  background: #3a4153; border:1px solid var(--border);
  display:inline-flex; align-items:center; padding:2px; cursor:pointer;
}
.switch.on{ background: linear-gradient(90deg, var(--accent), var(--accent-2)); }
.knob{
  width:18px; height:18px; border-radius:50%;
  background:#fff; transform:translateX(0); transition:transform .18s ease;
}
.switch.on .knob{ transform: translateX(20px); }

.footer{
  padding: 10px 12px 12px; color:var(--muted); font-size:11.5px; text-align:center;
}
.error,.loading{padding:14px}

.info-box{
  display:flex; align-items:center; gap:8px; margin-top:10px;
  padding:8px 10px; border-radius:8px; 
  background:rgba(76, 158, 234, 0.08); border:1px solid rgba(76, 158, 234, 0.2);
  font-size:12px; color:var(--muted);
}
.info-box svg{fill:rgba(76, 158, 234, 0.8)}
`

export default Popup
