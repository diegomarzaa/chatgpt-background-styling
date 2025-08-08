# ChatGPT Custom Background

This extension keeps the stylish GPT-5 landing page background visible even after you send a message, letting you enjoy the design while chatting. You can fully customize it in real time, adjust the blur level, choose your own background image, and tweak the gradient to your liking. Built quickly without prior extension experience, simple to use and open for anyone to improve or expand.

![alt text](assets/demo.gif)


## Installation

1. Download the ZIP of the extension in [this link](https://github.com/diegomarzaa/chatgpt-background-styling/releases/latest).
2. Unzip the file to a local folder.
3. In your browser (Chrome, Brave, Edge):
   - Navigate to `chrome://extensions/`
   - Enable **Developer mode** (toggle in top-right)
   - Click **Load unpacked**
   - Select the unzipped folder
   - Activate the extension
4. It will now work immediately on `chatgpt.com`, configure it by clicking on the extension icon.
   - **Enable** on/off
   - **Image URL**
     - The default image in the gpt-5 start page is the next one, just copy and paste it in the field:  https://persistent.oaistatic.com/burrito-nux/1920.webp
   - **Image Opacity**
   - **Blur (px)**
   - **Gradient Opacity**

## For Developers

### Requirements

- Node.js v18+  
- npm or pnpm/package manager

### Workflow

```bash
git clone https://github.com/diegomarzaa/chatgpt-background-styling
cd chatgpt-background-styling
npm install
```

- For development (auto-reload):
```
npm run dev
```

- For production build & ZIP:
```
npm run build -- --zip
```

Reload extension after changes to reflect updates.

## Privacy

- Configuration stored in `chrome.storage` locally.
- No data is sent to external servers.

## Troubleshooting

- **Popup not showing**: make sure you have an active tab on `chatgpt.com`.
- **White border of the popup**: Couldn't be removed. Any help with this is appreciated.