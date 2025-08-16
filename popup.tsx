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
    savedBackgrounds: string[]
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
    const [customUrl, setCustomUrl] = useState("")

    // Fondos predeterminados
    const defaultBackgrounds = [
        "https://persistent.oaistatic.com/burrito-nux/1920.webp", // GPT HD
        "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1920&q=80", // Space
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80", // Mountain
        "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&q=80", // Forest
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExN3kycXV3MzR4cDV2OXFuZjh0dmZlazRmdWgwOWJ6N3N2aHl3bDJ1YSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/VzH4jP7ppWF8dgCxcg/giphy.gif" // Dog Dance
    ]

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

    // Funciones para manejar fondos
    const addCustomBackground = async (url: string) => {
        if (!cfg || !url.trim()) return
        
        const savedBackgrounds = cfg.savedBackgrounds || []
        if (!savedBackgrounds.includes(url) && !defaultBackgrounds.includes(url)) {
            const newSavedBackgrounds = [url, ...savedBackgrounds].slice(0, 50) // Máximo 50 fondos guardados
            await patch({ savedBackgrounds: newSavedBackgrounds })
        }
    }

    const selectBackground = async (url: string) => {
        await patch({ backgroundImageUrl: url })
        if (url && !defaultBackgrounds.includes(url)) {
            await addCustomBackground(url)
        }
    }

    const removeCustomBackground = async (url: string) => {
        if (!cfg) return
        const savedBackgrounds = (cfg.savedBackgrounds || []).filter(bg => bg !== url)
        await patch({ savedBackgrounds })
    }

    const handleCustomUrlSubmit = async () => {
        if (customUrl.trim()) {
            await selectBackground(customUrl.trim())
            setCustomUrl("")
        }
    }

    // Obtener todos los fondos disponibles
    const getAllBackgrounds = () => {
        const saved = cfg?.savedBackgrounds || []
        return [...defaultBackgrounds, ...saved]
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
                
                {/* Galería de fondos predeterminados y guardados */}
                <Field label="Quick Select">
                    <div className="background-gallery">
                        {getAllBackgrounds().map((url, index) => {
                            const isSelected = cfg.backgroundImageUrl === url
                            const isDefault = defaultBackgrounds.includes(url)
                            const isCustom = !isDefault
                            
                            return (
                                <div 
                                    key={url}
                                    className={`background-item ${isSelected ? 'selected' : ''}`}
                                    onClick={() => selectBackground(url)}
                                    style={{ backgroundImage: `url("${url}")` }}
                                >
                                    {isSelected && (
                                        <div className="selected-indicator">✓</div>
                                    )}
                                    {isCustom && (
                                        <button
                                            className="remove-btn"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                removeCustomBackground(url)
                                            }}
                                            title="Remove custom background"
                                        >
                                            ✕
                                        </button>
                                    )}
                                    <div className="background-label">
                                        {isDefault ? 
                                            (index === 0 ? 'GPT' : 
                                             index === 1 ? 'Space' :
                                             index === 2 ? 'Mountain' : 
                                             index === 3 ? 'Forest' : 
                                             'Dog') :
                                            'User'
                                        }
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </Field>

                {/* Input para URL personalizada */}
                <Field label="Add Custom URL">
                    <div className="custom-url-input">
                        <div className="input-icon">
                            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
                                <path d="M3.9 12a5 5 0 0 1 5-5h3v2h-3a3 3 0 0 0 0 6h3v2h-3a5 5 0 0 1-5-5Zm7.2 1h1.8v-2h-1.8v2Zm3-6h3a5 5 0 0 1 0 10h-3v-2h3a3 3 0 0 0 0-6h-3V7Z" />
                            </svg>
                            <input
                                placeholder="https://example.com/image.jpg"
                                value={customUrl}
                                onChange={(e) => setCustomUrl(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCustomUrlSubmit()}
                            />
                        </div>
                        <button 
                            className="add-btn"
                            onClick={handleCustomUrlSubmit}
                            disabled={!customUrl.trim()}
                            title="Add and use this background"
                        >
                            Add
                        </button>
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
            <style>
                {css}
            </style>
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

/* ensure dark bg + no default body margin as early as possible */
html, body {
  background: var(--bg);
  margin: 0;
  color: var(--text);
}

/* hint the UA we're dark to avoid white UI flashes */
:root { color-scheme: dark; }

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
  border-radius: 0;
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

.background-gallery{
  display:grid; grid-template-columns:repeat(auto-fit, minmax(80px, 1fr)); gap:8px; margin-top:6px;
}
.background-item{
  position: relative;
  aspect-ratio:16/9;
  border-radius:6px;
  cursor:pointer;
  background-size:cover;
  background-position:center;
  background-repeat:no-repeat;
  border:2px solid transparent;
  transition:all 0.2s ease;
  overflow:hidden;
  min-height:45px;

  /* prevent the image from painting under the transparent border (avoids a thin line) */
  background-clip: padding-box;
}

.background-item::after{
  content:"";
  position:absolute;
  left:0; right:0; bottom:0;
  /* adjust height to taste */
  height:24px; /* e.g. clamp(50px, 40%, 80px) if tiles vary a lot */
  background:linear-gradient(
    to top,
    rgba(0,0,0,1) 0%,
    rgba(0,0,0,0.6) 40%,
    rgba(0,0,0,0.3) 70%,
    rgba(0,0,0,0) 100%
  );
  pointer-events:none;
  z-index:1;
}


.background-item:hover{
  border-color:var(--accent); transform:scale(1.02);
}
.background-item.selected{
  border-color:var(--accent-2); box-shadow:0 0 0 1px var(--accent-2);
}

.background-label{
  position:absolute;
  left:0; right:0; bottom:6px;
  color:white;
  font-size:10px;
  text-align:center;
  font-weight:500;
  text-shadow:0 1px 2px rgba(0,0,0,0.8);

  display:flex;
  align-items:flex-end;
  justify-content:center;

  padding:0 6px;
  min-height:auto;
  background:none;     /* ← gradient moved to ::after */
  z-index:2;           /* above the overlay */
}


.selected-indicator{
  position:absolute; top:4px; right:4px;
  width:16px; height:16px; border-radius:50%;
  background:var(--accent-2); color:white; font-size:10px;
  display:flex; align-items:center; justify-content:center;
  font-weight:bold; box-shadow:0 1px 3px rgba(0,0,0,0.3);
}
.remove-btn{
  position:absolute; top:2px; left:2px;
  width:16px; height:16px; border-radius:50%;
  background:rgba(255,0,0,0.8); color:white; border:none;
  font-size:10px; cursor:pointer; display:flex;
  align-items:center; justify-content:center;
  opacity:0; transition:opacity 0.2s ease;
}
.background-item:hover .remove-btn{opacity:1}
.remove-btn:hover{background:rgba(255,0,0,1)}

.custom-url-input{
  display:flex; gap:8px; align-items:center;
}
.custom-url-input .input-icon{flex:1}
.add-btn{
  padding:6px 12px; border:1px solid var(--accent); border-radius:6px;
  background:var(--accent); color:white; font-size:12px; cursor:pointer;
  transition:all 0.2s ease; white-space:nowrap;
}
.add-btn:hover:not(:disabled){
  background:var(--accent-2); border-color:var(--accent-2);
}
.add-btn:disabled{
  opacity:0.5; cursor:not-allowed; background:var(--muted);
  border-color:var(--muted);
}
`

export default Popup
