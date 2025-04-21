# Dependencies to Install

To implement the new ChatGPT-like frontend design, you'll need to install the following dependencies:

## Core Dependencies

```bash
npm install react-markdown react-syntax-highlighter @tailwindcss/typography
```

## What Each Dependency Does

1. **react-markdown**: Renders Markdown content as React components
   - Essential for formatting message content with headings, lists, links, etc.

2. **react-syntax-highlighter**: Provides syntax highlighting for code blocks
   - Makes code snippets more readable with proper language-specific highlighting

3. **@tailwindcss/typography**: Tailwind plugin for styling prose content
   - Provides better default styling for Markdown-rendered content

## Installation Instructions

1. Run the installation command above in your project directory
2. Make sure your tailwind.config.js includes the typography plugin:
   ```js
   plugins: [
     require('@tailwindcss/typography'),
   ],
   ```

## Optional Dependencies

If you want to enhance the chat interface further, consider these additional packages:

1. **emoji-mart**: For emoji picker integration
   ```bash
   npm install emoji-mart
   ```

2. **react-dropzone**: For file upload capabilities
   ```bash
   npm install react-dropzone
   ```

3. **framer-motion**: For smooth animations and transitions
   ```bash
   npm install framer-motion
   ```

## Note on Existing Dependencies

The implementation assumes you already have these dependencies installed:
- React
- Axios
- Tailwind CSS

If any of these are missing, make sure to install them as well.
