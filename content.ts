// content.ts

import { Storage } from "@plasmohq/storage"
import { CollapsibleMessages, type CollapsibleConfig } from "./collapsible-messages"

// ------------------------------
// Configuración del content script (Plasmo)
// ------------------------------
export const config = {
  matches: ["https://chatgpt.com/*"],
  run_at: "document_idle"
}

// ------------------------------
// Tipos y defaults
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

const DEFAULT_CFG: Cfg = {
  enabled: true,
  backgroundImageUrl: "https://persistent.oaistatic.com/burrito-nux/640.webp",
  mainImageOpacity: 0.5,
  blurAmount: 70,
  gradientOpacity: 1.0,
  collapsibleMessages: true,
  buttonOpacity: 0.4,
  collapsedHeight: "6.5em",
  altClickEnabled: false,
  persistMessageState: false,
  savedBackgrounds: []
}

// ------------------------------
// Estado y utilidades de storage
// ------------------------------
const storage = new Storage()
let cfg: Cfg = DEFAULT_CFG
let collapsibleMessages: CollapsibleMessages | null = null

const readCfg = async (): Promise<Cfg> =>
  (await storage.get<Cfg>("chatgpt-custom-bg:cfg")) ?? DEFAULT_CFG

const writeCfg = async (next: Cfg) =>
  storage.set("chatgpt-custom-bg:cfg", next)

// ------------------------------
// Cache DOM (para fondo y gradiente)
// ------------------------------
let pictureEl: HTMLPictureElement | null = null
let imgEl: HTMLImageElement | null = null
let gradEl: HTMLDivElement | null = null

// ------------------------------
// Selectores frágiles de la UI de ChatGPT
// - Se mantienen lo más fieles posible al userscript
// ------------------------------
const sel = {
  mainWrapper:
    ".relative.flex.h-full.w-full.flex-1.transition-colors.z-0",
  sidebar: "#stage-slideover-sidebar",
  mobileHeader:
    ".draggable.h-header-height.top-0.z-10.flex.items-center.justify-center.border-transparent.ps-0.md\\:hidden",
  stickyAsides: "aside.tall\\:sticky",
  chatListHeader:
    "div.short\\:group-data-scrolled-from-top\\/scrollport\\:shadow-\\(--sharp-edge-top-shadow\\).sticky.top-0.z-30.bg-token-bg-elevated-secondary",
  sidebarFooter: ".sticky.bottom-0",
  sidebarNav: "#stage-slideover-sidebar nav.group\\/scrollport",
  pageHeader: "#page-header",
  composerWrapper: "form[data-type='unified-composer'] .bg-token-bg-primary.shadow-short"
}

// ------------------------------
// Creación del <picture> de fondo
// ------------------------------
function ensureBackground() {
  if (pictureEl && document.body.contains(pictureEl)) return

  pictureEl = document.createElement("picture")
  pictureEl.className = "absolute inset-0 h-full w-full overflow-hidden"
  pictureEl.style.zIndex = "-1"

  // <source> opcional (igual que el userscript), no es estrictamente necesario
  const sourceEl = document.createElement("source")
  sourceEl.type = "image/webp"
  sourceEl.srcset =
    "https://persistent.oaistatic.com/burrito-nux/640.webp 640w, https://persistent.oaistatic.com/burrito-nux/1280.webp 1280w, https://persistent.oaistatic.com/burrito-nux/1920.webp 1920w"

  imgEl = document.createElement("img")
  imgEl.alt = ""
  imgEl.ariaHidden = "true"
  imgEl.sizes = "100vw"
  imgEl.loading = "eager"
  imgEl.fetchPriority = "high"
  imgEl.className = "absolute inset-0 h-full w-full scale-[1.02] object-cover"

  gradEl = document.createElement("div")
  gradEl.className =
    "absolute inset-0 h-full w-full bg-gradient-to-b from-transparent to-white dark:to-black"

  pictureEl.append(sourceEl, imgEl, gradEl)
  document.body.prepend(pictureEl)
}

// ------------------------------
// Estilos de UI: transparencia + blur en elementos sticky
// - Aplica "frosted glass" conservando contraste en claro/oscuro
// ------------------------------
function applyUIStyles() {
  const isDark = document.documentElement.classList.contains("dark")
  const blurBG = isDark ? "rgba(24, 24, 24, 0)" : "rgba(255, 255, 255, 0)"
  const blurFx = "blur(12px)"

  // Variables de color de superficie
  document.documentElement.style.setProperty("--bg-primary", "transparent")
  document.documentElement.style.setProperty("--main-surface-primary", "transparent")
  document.documentElement.style.setProperty("--bg-elevated-secondary", "transparent")

  // Contenedor principal
  const mainWrapper = document.querySelector<HTMLElement>(sel.mainWrapper)
  if (mainWrapper) mainWrapper.style.backgroundColor = "transparent"

  // ------ Sidebar
  const sidebar = document.querySelector<HTMLElement>(sel.sidebar)
  if (sidebar) sidebar.style.backgroundColor = "transparent"

  // Encabezado sticky de la lista de chats
  const chatListHeader = document.querySelector<HTMLElement>(sel.chatListHeader)
  if (chatListHeader) {
    chatListHeader.style.backgroundColor = blurBG
    chatListHeader.style.backdropFilter = blurFx
    ;(chatListHeader.style as any).webkitBackdropFilter = blurFx
  }

  // Footer sticky de la sidebar (perfil, etc.)
  const sidebarFooter = document.querySelector<HTMLElement>(sel.sidebarFooter)
  if (sidebarFooter) {
    sidebarFooter.style.backgroundColor = blurBG
    sidebarFooter.style.backdropFilter = blurFx
    ;(sidebarFooter.style as any).webkitBackdropFilter = blurFx
  }

  // Lista de chats de la sidebar (aplicar translucidez por clase utility)
  const sidebarNav = document.querySelector<HTMLElement>(sel.sidebarNav)
  if (sidebarNav) {
    sidebarNav.classList.add("bg-white/15", "dark:bg-black/15")
    sidebarNav.style.backgroundColor = "" // que prevalezcan las utilidades
  }

  // Header de página
  const pageHeader = document.querySelector<HTMLElement>(sel.pageHeader)
  if (pageHeader) {
    pageHeader.style.backgroundColor = "transparent"
    pageHeader.style.backdropFilter = "none"
    ;(pageHeader.style as any).webkitBackdropFilter = "none"
  }

  // Header móvil
  const mobileHeader = document.querySelector<HTMLElement>(sel.mobileHeader)
  if (mobileHeader) {
    mobileHeader.style.backgroundColor = "transparent"
    mobileHeader.style.backdropFilter = "none"
    ;(mobileHeader.style as any).webkitBackdropFilter = "none"
  }

  // Sticky asides (encabezado "New chat" / secciones)
  document.querySelectorAll<HTMLElement>(sel.stickyAsides).forEach((aside) => {
    aside.style.backgroundColor = blurBG
    aside.style.backdropFilter = blurFx
    ;(aside.style as any).webkitBackdropFilter = blurFx
  })

  // ------ Compositor: restaurar fondo sólido para legibilidad
  const composerWrapper = document.querySelector<HTMLElement>(sel.composerWrapper)
  if (composerWrapper) {
    composerWrapper.style.backgroundColor = isDark ? "#303030" : "#ffffff"
  }
}

// ------------------------------
// Limpieza de estilos cuando se desactiva
// ------------------------------
function clearUIStyles() {
  document.documentElement.style.setProperty("--bg-primary", "")
  document.documentElement.style.setProperty("--main-surface-primary", "")
  document.documentElement.style.setProperty("--bg-elevated-secondary", "")

  const reset = (q: string, props: Array<keyof CSSStyleDeclaration | string>) => {
    const el = document.querySelector<HTMLElement>(q)
    if (!el) return
    props.forEach((p) => ((el.style as any)[p] = ""))
  }

  reset(sel.pageHeader, ["backgroundColor", "backdropFilter", "webkitBackdropFilter"])
  reset(sel.mobileHeader, ["backgroundColor", "backdropFilter", "webkitBackdropFilter"])
  reset(sel.sidebar, ["backgroundColor"])
  reset(sel.mainWrapper, ["backgroundColor"])
  reset(sel.chatListHeader, ["backgroundColor", "backdropFilter", "webkitBackdropFilter"])
  reset(sel.sidebarFooter, ["backgroundColor", "backdropFilter", "webkitBackdropFilter"])

  document.querySelectorAll<HTMLElement>(sel.stickyAsides).forEach((aside) => {
    aside.style.backgroundColor = ""
    aside.style.backdropFilter = ""
    ;(aside.style as any).webkitBackdropFilter = ""
  })

  const sidebarNav = document.querySelector<HTMLElement>(sel.sidebarNav)
  if (sidebarNav) {
    sidebarNav.classList.remove("bg-white/15", "dark:bg-black/15")
    sidebarNav.style.backgroundColor = ""
  }

  const composerWrapper = document.querySelector<HTMLElement>(sel.composerWrapper)
  if (composerWrapper) composerWrapper.style.backgroundColor = ""
}

// ------------------------------
// Aplicación de imagen de fondo + opacidades y blur
// ------------------------------
function applyBackground() {
  ensureBackground()

  // Forzar imagen directa sin srcset para URLs personalizadas
  pictureEl!.querySelectorAll("source").forEach((s) => {
    s.removeAttribute("srcset")
    s.removeAttribute("type")
  })
  imgEl!.removeAttribute("srcset")

  imgEl!.src = cfg.backgroundImageUrl
  imgEl!.style.opacity = String(cfg.mainImageOpacity)
  imgEl!.style.filter = `blur(${cfg.blurAmount}px)`
  gradEl!.style.opacity = String(cfg.gradientOpacity)

  applyUIStyles()
}

// ------------------------------
// Encendido/Apagado y persistencia
// ------------------------------
async function render() {
  console.log('ChatGPT Customizer: Rendering with config', cfg)
  
  if (cfg.enabled) {
    applyBackground()
  } else {
    if (pictureEl?.isConnected) pictureEl.remove()
    pictureEl = imgEl = gradEl = null
    clearUIStyles()
  }
  
  // Configurar mensajes colapsables usando el módulo
  setupCollapsibleMessages()
  
  await writeCfg(cfg)
}

// ------------------------------
// Setup de mensajes colapsables
// ------------------------------
function setupCollapsibleMessages() {
  const collapsibleConfig: CollapsibleConfig = {
    enabled: cfg.collapsibleMessages,
    buttonOpacity: cfg.buttonOpacity,
    collapsedHeight: cfg.collapsedHeight,
    altClickEnabled: cfg.altClickEnabled,
    persistMessageState: cfg.persistMessageState
  }

  if (!collapsibleMessages) {
    console.log('ChatGPT Customizer: Creating new CollapsibleMessages instance')
    collapsibleMessages = new CollapsibleMessages(collapsibleConfig)
    // Llamar explícitamente a enable() en la primera creación
    if (collapsibleConfig.enabled) {
      setTimeout(() => {
        console.log('ChatGPT Customizer: Force enabling collapsible messages')
        collapsibleMessages?.enable()
      }, 500)
    }
  } else {
    console.log('ChatGPT Customizer: Updating existing CollapsibleMessages instance')
    collapsibleMessages.updateConfig(collapsibleConfig)
  }
}

// ------------------------------
// Reaccionar a cambios de tema (claro/oscuro)
// ------------------------------
new MutationObserver(() => applyUIStyles()).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["class", "data-chat-theme"]
})

// ------------------------------
// Mensajería con el popup: get/patch de configuración en tiempo real
// ------------------------------
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "GET_CFG") {
    sendResponse(cfg)
    return true
  }
  if (msg?.type === "SET_CFG_PARTIAL") {
    cfg = { ...cfg, ...msg.patch }
    render()
    sendResponse({ ok: true })
    return true
  }
})

// ------------------------------
// Boot + Observador para mensajes nuevos
// ------------------------------
;(async () => {
  cfg = await readCfg()
  console.log('ChatGPT Customizer: Initial config loaded', cfg)
  await render()
  
  // Observador para nuevos mensajes
  const observer = new MutationObserver((mutations) => {
    if (cfg.collapsibleMessages && collapsibleMessages) {
      let shouldUpdate = false
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element
              if (element.matches?.('div[data-message-id]') || 
                  element.querySelector?.('div[data-message-id]')) {
                shouldUpdate = true
              }
            }
          })
        }
      })
      
      if (shouldUpdate) {
        setTimeout(() => {
          console.log('ChatGPT Customizer: Processing new messages via observer')
          collapsibleMessages?.processNewMessages()
        }, 100)
      }
    }
  })
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  })
  
  // Ejecutar cada 10 segundos como fallback
  setInterval(() => {
    if (cfg.collapsibleMessages && collapsibleMessages) {
      console.log('ChatGPT Customizer: Periodic check for new messages')
      collapsibleMessages.processNewMessages()
    }
  }, 10000)
})()
