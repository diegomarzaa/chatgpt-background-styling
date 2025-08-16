// collapsible-messages.ts

export type CollapsibleConfig = {
  enabled: boolean
  buttonOpacity: number
  collapsedHeight: string
  altClickEnabled: boolean
  persistMessageState: boolean
}

export class CollapsibleMessages {
  private config: CollapsibleConfig
  private allCollapsed = false
  private styleId = 'cg-collapse-styles'
  private keyboardListenerAdded = false
  private altClickListenerAdded = false
  private storageKey = 'cg-message-states'

  constructor(config: CollapsibleConfig) {
    this.config = config
    console.log('CollapsibleMessages: Initialized with config', config)
    
    // Auto-enable si está configurado como habilitado
    if (config.enabled) {
      setTimeout(() => {
        console.log('CollapsibleMessages: Auto-enabling after construction')
        this.enable()
      }, 100)
    }
  }

  updateConfig(config: CollapsibleConfig) {
    console.log('CollapsibleMessages: Updating config', config)
    const wasAltClickEnabled = this.config.altClickEnabled
    this.config = config
    
    if (config.enabled) {
      // Si Alt+Click cambió de estado, actualizar listeners
      if (wasAltClickEnabled !== config.altClickEnabled) {
        if (config.altClickEnabled) {
          this.setupAltClickListeners()
        } else {
          this.removeAltClickListeners()
        }
      }
      this.enable()
    } else {
      this.disable()
    }
  }

  enable() {
    console.log('CollapsibleMessages: Enabling')
    
    // Limpiar elementos existentes antes de crear nuevos
    this.removeAllButtons()
    
    this.addStyles()
    this.setupKeyboardShortcuts()
    this.setupAltClickListeners()
    
    // Ejecutar inmediatamente y luego con delays para asegurar que funcione
    this.addButtonsToExistingMessages()
    this.addMasterToggle()
    
    // Backup execution con delays
    setTimeout(() => {
      console.log('CollapsibleMessages: Backup execution (500ms)')
      this.addButtonsToExistingMessages()
      this.addMasterToggle()
    }, 500)
    
    setTimeout(() => {
      console.log('CollapsibleMessages: Final backup execution (1000ms)')
      this.addButtonsToExistingMessages()
      this.addMasterToggle()
    }, 1000)
  }

  disable() {
    console.log('CollapsibleMessages: Disabling')
    this.removeStyles()
    this.removeAllButtons()
    this.removeKeyboardShortcuts()
    this.removeAltClickListeners()
  }

  private addStyles() {
    // Remover estilo existente
    const existingStyle = document.getElementById(this.styleId)
    if (existingStyle) {
      existingStyle.remove()
    }

    const style = document.createElement('style')
    style.id = this.styleId
    style.textContent = `
      .cg-collapse-btn {
        position: absolute;
        top: 0.4em;
        right: 0.4em;
        z-index: 100;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: none;
        border: none;
        cursor: pointer;
        opacity: ${this.config.buttonOpacity};
        transition: transform 0.2s ease, opacity 0.2s ease;
        color: inherit;
        font-size: 12px;
        border-radius: 2px;
      }
      
      .cg-collapse-btn:hover {
        opacity: 1 !important;
        transform: scale(1.1);
      }
      
      .cg-collapse-btn.collapsed {
        transform: rotate(90deg);
      }
      
      .cg-collapse-btn.collapsed:hover {
        transform: rotate(90deg) scale(1.1);
      }

      .cg-toggle-all-btn {
        position: fixed;
        bottom: 1em;
        right: 1em;
        z-index: 1000;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: none;
        border: none;
        cursor: pointer;
        transition: transform 0.2s ease, opacity 0.2s ease;
        opacity: ${this.config.buttonOpacity};
        color: inherit;
        font-size: 14px;
        border-radius: 2px;
      }
      
      .cg-toggle-all-btn:hover {
        opacity: 1 !important;
        transform: scale(1.1);
      }
      
      .cg-toggle-all-btn.collapsed {
        transform: rotate(90deg);
      }
      
      .cg-toggle-all-btn.collapsed:hover {
        transform: rotate(90deg) scale(1.1);
      }

      .cg-collapse-container.collapsed {
        max-height: ${this.config.collapsedHeight} !important;
        overflow: hidden !important;
        position: relative;
      }

      .cg-collapse-container.collapsed::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 2em;
        pointer-events: none;
        background: linear-gradient(to top, rgba(255,255,255,0.3), transparent);
      }
      
      html.dark .cg-collapse-container.collapsed::after {
        background: linear-gradient(to top, rgba(18,18,18,0.6), transparent);
      }
    `
    document.head.appendChild(style)
    console.log('CollapsibleMessages: Styles added')
  }

  private removeStyles() {
    const style = document.getElementById(this.styleId)
    if (style) {
      style.remove()
      console.log('CollapsibleMessages: Styles removed')
    }
  }

  addButtonsToExistingMessages() {
    if (!this.config.enabled) return

    console.log('CollapsibleMessages: Looking for messages...')
    
    // Usar solo el selector más específico para mensajes reales
    const messageSelector = 'div[data-message-id]'
    const messages = document.querySelectorAll<HTMLElement>(`${messageSelector}:not(.cg-collapse-container)`)
    
    console.log(`CollapsibleMessages: Found ${messages.length} messages with selector "${messageSelector}"`)
    
    let messageCount = 0
    messages.forEach(msg => {
      // Filtros adicionales para asegurar que es realmente un mensaje
      if (this.isValidMessage(msg)) {
        // Verificar doble que no tenga ya un botón antes de agregar
        if (!msg.querySelector('.cg-collapse-btn')) {
          this.addButtonToMessage(msg)
          messageCount++
        } else {
          console.log('CollapsibleMessages: Message already has button, skipping', msg.getAttribute('data-message-id'))
        }
      }
    })

    console.log(`CollapsibleMessages: Processed ${messageCount} total messages`)
  }

  private isValidMessage(element: HTMLElement): boolean {
    // Verificar que tenga data-message-id
    if (!element.getAttribute('data-message-id')) {
      return false
    }

    // Verificar que tenga data-message-author-role (usuario o asistente)
    const authorRole = element.getAttribute('data-message-author-role')
    if (!authorRole || !['user', 'assistant'].includes(authorRole)) {
      return false
    }

    // Verificar que tenga contenido de texto significativo
    const textContent = element.textContent?.trim() || ''
    if (textContent.length < 10) {
      return false
    }

    // Verificar que no sea un elemento de UI (por ejemplo, no debe tener ciertos atributos)
    if (element.closest('[role="dialog"]') || 
        element.closest('[role="menu"]') ||
        element.closest('.popup') ||
        element.closest('.dropdown')) {
      return false
    }

    console.log('CollapsibleMessages: Valid message found:', {
      id: element.getAttribute('data-message-id'),
      author: authorRole,
      textLength: textContent.length
    })

    return true
  }

  private async addButtonToMessage(msg: HTMLElement) {
    // Verificar múltiples veces que no tenga ya el botón
    if (msg.querySelector('.cg-collapse-btn')) {
      console.log('CollapsibleMessages: Button already exists, skipping')
      return
    }

    // Verificación adicional antes de agregar el botón
    if (!this.isValidMessage(msg)) {
      console.log('CollapsibleMessages: Skipping invalid message', msg)
      return
    }

    // Remover cualquier botón existente como precaución extra
    const existingButtons = msg.querySelectorAll('.cg-collapse-btn')
    existingButtons.forEach(btn => {
      console.log('CollapsibleMessages: Removing existing button')
      btn.remove()
    })

    msg.classList.add('cg-collapse-container')
    msg.style.position = 'relative'

    const btn = document.createElement('button')
    btn.className = 'cg-collapse-btn'
    btn.title = 'Collapse/Expand Message (Alt+C)'
    btn.innerHTML = '▼'
    
    // Agregar un ID único para identificar este botón específicamente
    btn.setAttribute('data-cg-button-id', msg.getAttribute('data-message-id') || 'unknown')

    // Event listener para el botón
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      console.log('CollapsibleMessages: Button clicked!')
      this.toggleMessage(msg, btn)
    })

    msg.prepend(btn)
    
    // Restaurar estado guardado si existe
    const messageId = msg.getAttribute('data-message-id')
    if (messageId && this.config.persistMessageState) {
      const savedState = await this.getMessageState(messageId)
      if (savedState !== null) {
        console.log(`CollapsibleMessages: Restoring saved state for message ${messageId}: ${savedState ? 'collapsed' : 'expanded'}`)
        this.applyMessageState(msg, btn, savedState)
      }
    }
    
    console.log('CollapsibleMessages: Button added to message', {
      id: msg.getAttribute('data-message-id'),
      author: msg.getAttribute('data-message-author-role')
    })
  }

  private toggleMessage(msg: HTMLElement, btn: HTMLElement) {
    const isCollapsed = msg.classList.contains('collapsed')
    
    if (isCollapsed) {
      msg.classList.remove('collapsed')
      btn.classList.remove('collapsed')
      msg.style.maxHeight = ''
      msg.style.overflow = ''
      btn.innerHTML = '▼'
      
      const fadeElement = msg.querySelector('.cg-fade-gradient')
      if (fadeElement) {
        fadeElement.remove()
      }
      
      console.log('CollapsibleMessages: Message expanded')
    } else {
      msg.classList.add('collapsed')
      btn.classList.add('collapsed')
      msg.style.maxHeight = this.config.collapsedHeight
      msg.style.overflow = 'hidden'
      msg.style.position = 'relative'
      btn.innerHTML = '▼'
      
      const fadeElement = document.createElement('div')
      fadeElement.className = 'cg-fade-gradient'
      fadeElement.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 2em;
        pointer-events: none;
        background: linear-gradient(to top, rgba(255,255,255,0.9), transparent);
        z-index: 1;
      `
      
      if (document.documentElement.classList.contains('dark')) {
        fadeElement.style.background = 'linear-gradient(to top, rgba(18,18,18,0.9), transparent)'
      }
      
      msg.appendChild(fadeElement)
      console.log('CollapsibleMessages: Message collapsed')
    }
    
    // Guardar estado en storage
    const messageId = msg.getAttribute('data-message-id')
    if (messageId) {
      this.saveMessageState(messageId, !isCollapsed)
    }
  }

  private addMasterToggle() {
    if (!this.config.enabled) return
    
    if (document.querySelector('.cg-toggle-all-btn')) {
      return
    }

    const master = document.createElement('button')
    master.className = 'cg-toggle-all-btn'
    master.title = 'Toggle All Messages (Alt+Shift+C)'
    master.innerHTML = '▼'

    master.addEventListener('click', async () => {
      console.log('CollapsibleMessages: Master toggle clicked!')
      await this.toggleAll()
    })

    document.body.appendChild(master)
    console.log('CollapsibleMessages: Master toggle added')
  }

  private async toggleAll() {
    this.allCollapsed = !this.allCollapsed
    
    const containers = document.querySelectorAll<HTMLElement>('.cg-collapse-container')
    const validContainers = Array.from(containers).filter(container => this.isValidMessage(container))
    
    console.log(`CollapsibleMessages: Toggling ${validContainers.length} valid messages to ${this.allCollapsed ? 'collapsed' : 'expanded'}`)
    
    const newStates: Record<string, boolean> = {}

    validContainers.forEach(container => {
      const btn = container.querySelector<HTMLElement>('.cg-collapse-btn')
      if (!btn) return
      
      const isCollapsed = this.allCollapsed
      this.applyMessageState(container, btn, isCollapsed)
      
      const messageId = container.getAttribute('data-message-id')
      if (messageId) {
        newStates[messageId] = isCollapsed
      }
    })

    // Guardar todos los estados en una sola operación
    if (this.config.persistMessageState && Object.keys(newStates).length > 0) {
      await this.saveMessageStates(newStates)
    }

    const master = document.querySelector<HTMLElement>('.cg-toggle-all-btn')
    if (master) {
      master.classList.toggle('collapsed', this.allCollapsed)
      master.innerHTML = '▼'
    }
  }

  private removeAllButtons() {
    document.querySelectorAll('.cg-collapse-btn').forEach(btn => btn.remove())
    document.querySelectorAll('.cg-toggle-all-btn').forEach(btn => btn.remove())
    document.querySelectorAll('.cg-fade-gradient').forEach(fade => fade.remove())
    
    document.querySelectorAll<HTMLElement>('.cg-collapse-container').forEach(container => {
      container.classList.remove('cg-collapse-container', 'collapsed')
      container.style.position = ''
      container.style.maxHeight = ''
      container.style.overflow = ''
    })
    
    console.log('CollapsibleMessages: All buttons, gradients and classes removed')
  }

  processNewMessages() {
    if (!this.config.enabled) return
    this.addButtonsToExistingMessages()
  }

  private setupKeyboardShortcuts() {
    if (this.keyboardListenerAdded) return
    
    console.log('CollapsibleMessages: Setting up keyboard shortcuts')
    document.addEventListener('keydown', this.handleKeyDown.bind(this))
    this.keyboardListenerAdded = true
  }

  private removeKeyboardShortcuts() {
    if (!this.keyboardListenerAdded) return
    
    console.log('CollapsibleMessages: Removing keyboard shortcuts')
    document.removeEventListener('keydown', this.handleKeyDown.bind(this))
    this.keyboardListenerAdded = false
  }

  private async handleKeyDown(event: KeyboardEvent) {
    if (!this.config.enabled) return
    
    if (event.altKey && event.code === 'KeyC' && !event.shiftKey) {
      event.preventDefault()
      console.log('CollapsibleMessages: Alt+C pressed - toggling closest message')
      this.toggleClosestMessage()
      return
    }
    
    if (event.altKey && event.shiftKey && event.code === 'KeyC') {
      event.preventDefault()
      console.log('CollapsibleMessages: Alt+Shift+C pressed - toggling all messages')
      await this.toggleAll()
      return
    }
  }

  private toggleClosestMessage() {
    const activeElement = document.activeElement
    let targetMessage: HTMLElement | null = null
    
    if (activeElement) {
      targetMessage = activeElement.closest('.cg-collapse-container') as HTMLElement
    }
    
    if (!targetMessage) {
      const allMessages = document.querySelectorAll<HTMLElement>('.cg-collapse-container')
      if (allMessages.length > 0) {
        targetMessage = allMessages[allMessages.length - 1]
      }
    }
    
    if (targetMessage && this.isValidMessage(targetMessage)) {
      const btn = targetMessage.querySelector<HTMLElement>('.cg-collapse-btn')
      if (btn) {
        console.log('CollapsibleMessages: Toggling closest message via keyboard shortcut')
        this.toggleMessage(targetMessage, btn)
      }
    } else {
      console.log('CollapsibleMessages: No valid message found to toggle')
    }
  }

  private setupAltClickListeners() {
    if (this.altClickListenerAdded || !this.config.altClickEnabled) return
    
    console.log('CollapsibleMessages: Setting up Alt+Click listeners')
    document.addEventListener('click', this.handleAltClick.bind(this), true)
    this.altClickListenerAdded = true
  }

  private removeAltClickListeners() {
    if (!this.altClickListenerAdded) return
    
    console.log('CollapsibleMessages: Removing Alt+Click listeners')
    document.removeEventListener('click', this.handleAltClick.bind(this), true)
    this.altClickListenerAdded = false
  }

  private handleAltClick(event: MouseEvent) {
    if (!event.altKey || !this.config.altClickEnabled || !this.config.enabled) return
    
    const target = event.target as HTMLElement
    const messageContainer = target.closest('.cg-collapse-container') as HTMLElement
    
    if (messageContainer && this.isValidMessage(messageContainer)) {
      event.preventDefault()
      event.stopPropagation()
      
      const btn = messageContainer.querySelector<HTMLElement>('.cg-collapse-btn')
      if (btn) {
        console.log('CollapsibleMessages: Alt+Click detected on message, toggling')
        this.toggleMessage(messageContainer, btn)
      }
    }
  }

  // Storage methods
  private async saveMessageState(messageId: string, isCollapsed: boolean) {
    if (!this.config.persistMessageState) return
    
    try {
      const states = await this.getMessageStates()
      states[messageId] = isCollapsed
      
      const entries = Object.entries(states)
      if (entries.length > 1000) {
        const recentStates = Object.fromEntries(entries.slice(-1000))
        await chrome.storage.local.set({ [this.storageKey]: recentStates })
      } else {
        await chrome.storage.local.set({ [this.storageKey]: states })
      }
      
      console.log('CollapsibleMessages: Saved state for message', messageId, isCollapsed)
    } catch (error) {
      console.error('CollapsibleMessages: Error saving message state:', error)
    }
  }
  
  private async getMessageStates(): Promise<Record<string, boolean>> {
    try {
      const result = await chrome.storage.local.get(this.storageKey)
      return result[this.storageKey] || {}
    } catch (error) {
      console.error('CollapsibleMessages: Error getting message states:', error)
      return {}
    }
  }
  
  private async getMessageState(messageId: string): Promise<boolean | null> {
    if (!this.config.persistMessageState) return null
    
    try {
      const states = await this.getMessageStates()
      return states[messageId] ?? null
    } catch (error) {
      console.error('CollapsibleMessages: Error getting message state:', error)
      return null
    }
  }
  
  private applyMessageState(msg: HTMLElement, btn: HTMLElement, isCollapsed: boolean) {
    if (isCollapsed) {
      msg.classList.add('collapsed')
      btn.classList.add('collapsed')
      msg.style.maxHeight = this.config.collapsedHeight
      msg.style.overflow = 'hidden'
      msg.style.position = 'relative'
      btn.innerHTML = '▼'
      
      if (!msg.querySelector('.cg-fade-gradient')) {
        const fadeElement = document.createElement('div')
        fadeElement.className = 'cg-fade-gradient'
        fadeElement.style.cssText = `
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 2em;
          pointer-events: none;
          background: linear-gradient(to top, rgba(255,255,255,0.9), transparent);
          z-index: 1;
        `
        
        if (document.documentElement.classList.contains('dark')) {
          fadeElement.style.background = 'linear-gradient(to top, rgba(18,18,18,0.9), transparent)'
        }
        
        msg.appendChild(fadeElement)
      }
    } else {
      msg.classList.remove('collapsed')
      btn.classList.remove('collapsed')
      msg.style.maxHeight = ''
      msg.style.overflow = ''
      btn.innerHTML = '▼'
      
      const fadeElement = msg.querySelector('.cg-fade-gradient')
      if (fadeElement) {
        fadeElement.remove()
      }
    }
  }

  private async saveMessageStates(newStates: Record<string, boolean>) {
    if (!this.config.persistMessageState) return
    
    try {
      const existingStates = await this.getMessageStates()
      const updatedStates = { ...existingStates, ...newStates }
      
      const entries = Object.entries(updatedStates)
      if (entries.length > 1000) {
        const recentStates = Object.fromEntries(entries.slice(-1000))
        await chrome.storage.local.set({ [this.storageKey]: recentStates })
      } else {
        await chrome.storage.local.set({ [this.storageKey]: updatedStates })
      }
      
      console.log(`CollapsibleMessages: Saved states for ${Object.keys(newStates).length} messages`)
    } catch (error) {
      console.error('CollapsibleMessages: Error saving message states:', error)
    }
  }
}