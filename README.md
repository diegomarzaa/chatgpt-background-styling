# ChatGPT Customizer Extension

Complete ChatGPT customization suite with visual background gallery, message management, and productivity features. Real-time configuration, keyboard shortcuts, and persistent state for an enhanced ChatGPT experience.


![alt text](assets/demo-v2.gif)


This extension keeps the stylish GPT-5 landing page background visible even after you send a message, letting you enjoy the design while chatting. 

You can fully customize it in real time, choose from 5 preset backgrounds or add your own, adjust blur level and gradients to your liking. 

It also lets you enhance the ChatGPT experience with productivity features, like collapsible messages that clean up your chats.

Built quickly without prior extension experience, making use of LLMs for the implementation, so expect possible bugs and mistakes. Open for anyone to improve or expand.


## Features

### 🎨 **Background Customization**
- **Custom Background Images** - Quickly select from 5 curated preset backgrounds or use any image URL (gifs are also allowed!).
- **Real-time Opacity Control** - Adjust background transparency
- **Dynamic Blur Effects** - Add blur for better text readability
- **Gradient Overlays** - Customize gradient opacity for perfect balance
- **Theme Adaptation** - Automatically adapts to light/dark mode

### 📝 **Message Management**
- **Collapsible Messages** - Click to collapse/expand individual messages. You can achieve this by pressing new "▼" buttons that appear on each message, or by `Alt+Clicking` in a message.
- **Master Toggle** - One-click button to collapse/expand all messages. Achievable also with `Alt+Shift+C`.
- **Persistent State** - Messages stay collapsed/expanded between sessions and chats.
- **Variable size** - Adjust the size of collapsed messages.
- **Customization** - Most of this options can be enabled or disabled in the options menu.

## Installation

1. **Download** the latest release from [GitHub Releases](https://github.com/diegomarzaa/chatgpt-customizer-extension/releases/latest)
2. **Extract** the ZIP file to a local folder
3. **Open** your browser (Chrome, Brave, Edge, etc.)
4. **Navigate** to `chrome://extensions/`
5. **Enable** "Developer mode" (toggle in top-right corner)
6. **Click** "Load unpacked"
7. **Select** the extracted folder
8. **Visit** [ChatGPT](https://chatgpt.com) and click the extension icon to configure

## **For Developers**

### **Requirements**
- Node.js 18+
- npm/pnpm package manager
- Basic TypeScript/React knowledge

### **Development Setup**
```bash
git clone https://github.com/diegomarzaa/chatgpt-customizer-extension
cd chatgpt-customizer-extension
npm install
```

### **Development Commands**
```bash
# Development with auto-reload
npm run dev

# Production build
npm run build

# Create distributable ZIP
npm run build -- --zip
```

### **Project Structure**
```
├── content.ts          # Main content script
├── popup.tsx           # Extension popup UI
├── collapsible-messages.ts  # Message collapse functionality
└── assets/            # Icons and demo files
```

## **Privacy & Security**

- **Local Storage Only** - All settings stored in `chrome.storage.local`
- **No External Servers** - No data transmitted anywhere
- **ChatGPT Only** - Extension only activates on chatgpt.com
- **Open Source** - Full code available for review
- **No Tracking** - Zero analytics or user tracking

## 📝 **Changelog**

### **v2.1.0** - *Background Gallery Enhancement*
- **Visual Background Gallery** - Beautiful grid layout with 5 preset backgrounds
- **One-Click Background Selection** - Click any thumbnail to instantly apply
- **Custom Background Library** - Add and save more than 50 custom URLs
- **Easy Management** - Remove custom backgrounds with hover X button

### **v2.0.0** - *Rebrand*
- **Complete rebrand** from "ChatGPT Background Styling" to "ChatGPT Customizer"
- **Collapsible Messages** - Click triangle buttons to collapse/expand any message, or hold Alt and click the message to toggle (activate in settings). Hold Alt+Shift+C for toggling all messages.
- **Persistent State** - Messages stay collapsed/expanded between sessions and reloads

### **v1.0.2** - *Initial Release*
- **Background Customization** - Custom images, opacity, blur, gradients, in real time, with automatic light/dark mode adaptation.

## 🙏 **Acknowledgments**

- Built with [Plasmo Framework](https://plasmo.com)
- Inspired by the ChatGPT community