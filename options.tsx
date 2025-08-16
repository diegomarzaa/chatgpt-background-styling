// options.tsx

import React, { useEffect, useState } from 'react'
import { marked } from 'marked'

// Import README as text
import readmeContent from "data-text:./README.md"

function OptionsPage() {
  const [htmlContent, setHtmlContent] = useState<string>('')

  useEffect(() => {
    // Configure marked options
    marked.setOptions({
      breaks: true,
      gfm: true,
    })
    
    // Convert markdown to HTML and fix image paths
    let html = marked(readmeContent) as string
    
    // Fix relative image paths - convert to GitHub URLs
    html = html.replace(
      /src="assets\//g, 
      'src="https://raw.githubusercontent.com/diegomarzaa/chatgpt-customizer-extension/master/assets/'
    )
    
    // Improve emoji rendering by wrapping them in spans
    html = html.replace(
      /([\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F780}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|🎨|📝|⚙️|🎮|🛠️|🔒|🐛|🤝|📄|🙏|✨|📦|🎯|⌨️|🖱️|📌|🎛️|⚡|🧹|📋|🎉|🔧|🌓|🚀|📖|💻|💾|🎊)/gu,
      '<span class="emoji">$1</span>'
    )
    
    // Ensure emojis render properly by adding emoji fallback CSS
    setHtmlContent(html)
  }, [])

  return (
    <div style={{
      padding: '0',
      margin: '0',
      lineHeight: 1.6,
      color: '#333',
      background: '#f8f9fa',
      minHeight: '100vh'
    }}>
      {/* Custom header for the extension options */}
      <div style={{
        color: 'white',
        padding: '30px',
        textAlign: 'center',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: '2.5em', 
          fontWeight: '300',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}>
          ChatGPT Customizer
        </h1>
        <p style={{ 
          margin: '10px 0 0', 
          fontSize: '1.2em', 
          opacity: 0.9 
        }}>
          Extension Options & Documentation
        </p>
      </div>

      {/* Rendered README content */}
      <div 
        style={{
          maxWidth: '1000px',
          margin: '0 auto',
          padding: '40px',
          background: 'white',
          boxShadow: '0 0 20px rgba(0,0,0,0.1)',
          borderRadius: '0 0 12px 12px'
        }}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />

      {/* Custom CSS for better README styling */}
      <style dangerouslySetInnerHTML={{
        __html: `
          /* Emoji styling */
          .emoji {
            font-family: "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", "Twemoji Mozilla", "Android Emoji", "EmojiSymbols", sans-serif !important;
            font-weight: normal !important;
            font-style: normal !important;
            font-size: 1.1em;
            line-height: 1;
            display: inline-block;
            vertical-align: baseline;
          }
          
          /* General emoji fallback */
          .readme-content *:not(.emoji) {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif, "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji" !important;
          }
          
          /* Emoji rendering improvements */
          .emoji {
            font-family: "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji" !important;
            font-style: normal !important;
            font-size: 1.2em !important;
            vertical-align: -0.1em !important;
          }
          
          /* GitHub-like styling for rendered README */
          h1, h2, h3, h4, h5, h6 {
            margin-top: 24px;
            margin-bottom: 16px;
            font-weight: 600;
            line-height: 1.25;
            color: #24292e;
          }
          
          h1 { 
            font-size: 2em; 
            border-bottom: 1px solid #eaecef; 
            padding-bottom: 10px;
          }
          
          h2 { 
            font-size: 1.5em; 
            border-bottom: 1px solid #eaecef; 
            padding-bottom: 8px;
          }
          
          h3 { font-size: 1.25em; }
          
          p {
            margin-bottom: 16px;
            color: #586069;
          }
          
          a {
            color: #0366d6;
            text-decoration: none;
          }
          
          a:hover {
            text-decoration: underline;
          }
          
          code {
            background: #f6f8fa;
            border-radius: 3px;
            font-size: 85%;
            margin: 0;
            padding: 0.2em 0.4em;
            font-family: SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace;
          }
          
          pre {
            background: #f6f8fa;
            border-radius: 6px;
            font-size: 85%;
            line-height: 1.45;
            overflow: auto;
            padding: 16px;
            margin-bottom: 16px;
          }
          
          pre code {
            background: transparent;
            border: 0;
            display: inline;
            line-height: inherit;
            margin: 0;
            max-width: auto;
            overflow: visible;
            padding: 0;
            word-wrap: normal;
          }
          
          ul, ol {
            margin-bottom: 16px;
            padding-left: 2em;
          }
          
          li {
            margin-bottom: 4px;
          }
          
          blockquote {
            border-left: 4px solid #dfe2e5;
            color: #6a737d;
            margin: 0 0 16px;
            padding: 0 1em;
          }
          
          table {
            border-collapse: collapse;
            margin-bottom: 16px;
            width: 100%;
          }
          
          table th,
          table td {
            border: 1px solid #dfe2e5;
            padding: 6px 13px;
          }
          
          table th {
            background: #f6f8fa;
            font-weight: 600;
          }
          
          img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            box-shadow: 0 8px 16px rgba(0,0,0,0.15);
            margin: 24px auto;
            display: block;
            background: #f8f9fa;
            padding: 8px;
            border: 1px solid #e1e4e8;
          }
          
          /* Special styling for demo GIF */
          img[src*="demo.gif"], img[src*="demo.png"] {
            max-width: 80%;
            border-radius: 12px;
            box-shadow: 0 12px 24px rgba(0,0,0,0.2);
            margin: 32px auto;
            border: 2px solid #e1e4e8;
          }
          
          /* Custom styling for badges and special elements */
          strong {
            color: #24292e;
            font-weight: 600;
          }
          
          em {
            color: #6a737d;
            font-style: italic;
          }
          
          hr {
            border: none;
            border-top: 1px solid #eaecef;
            margin: 24px 0;
          }
        `
      }} />
    </div>
  )
}

export default OptionsPage
