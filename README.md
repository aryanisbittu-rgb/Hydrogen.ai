# Hydrogen.ai Math Worksheet Studio

An AI-powered math worksheet generator with interactive diagrams and AI tutoring capabilities.

## 📁 Project Structure

```
HTML/
├── index.html          # Main HTML file
├── js/
│   ├── config.js       # Configuration module
│   ├── utils.js        # Utility functions
│   ├── diagrams.js     # Diagram rendering
│   └── app.js          # Main application logic
└── README.md           # This file
```

## ✨ Key Improvements

### 1. **Modular Architecture**
- **Before**: Single monolithic HTML file with ~1000 lines of embedded JavaScript
- **After**: Split into 4 separate modules with clear separation of concerns:
  - `config.js`: Configuration and environment variables
  - `utils.js`: Utility functions and helpers
  - `diagrams.js`: Diagram rendering logic
  - `app.js`: Main application logic

### 2. **Configuration Management**
- **Environment Variable Support**: Backend URL can now be configured via query parameter:
  ```
  https://your-site.com/index.html?backend_url=https://custom-api.example.com
  ```
- **Centralized Config**: All configuration in `config.js` with `window.HydrogenConfig`
- **Rate Limiting**: Configurable delay between API calls (default: 1000ms)

### 3. **Improved Error Handling**
- **Retry Logic**: Automatic retries for failed API requests (default: 2 retries)
- **Timeout Handling**: Requests timeout after 90 seconds
- **User-Friendly Messages**: Clear error messages for different error types:
  - Network errors
  - Server errors (5xx)
  - Rate limiting (429)
  - Timeouts
- **Sample Worksheet Fallback**: Users can load a sample worksheet if generation fails

### 4. **Enhanced Accessibility**
- **ARIA Attributes**: Added throughout for screen reader support:
  - `aria-label` for descriptive labels
  - `aria-pressed` for toggle buttons
  - `aria-expanded` for collapsible elements
  - `aria-hidden` for modal/drawer states
  - `aria-busy` for loading states
  - `role` attributes for semantic elements
- **Keyboard Navigation**:
  - Focus trapping in modals and drawers
  - Skip link to main content
  - Proper tab order
- **Focus Management**:
  - Focus returns to trigger element after closing modals
  - Auto-focus on first focusable element when opening modals

### 5. **Keyboard Shortcuts**
| Shortcut | Action |
|----------|--------|
| `Esc` | Close modals/drawers |
| `Ctrl/Cmd + K` | Open/close AI Tutor |
| `Ctrl/Cmd + N` | Open new worksheet modal |
| `Ctrl/Cmd + P` | Print student copy |
| `Ctrl/Cmd + Shift + P` | Print with answers |
| `Ctrl/Cmd + Enter` | Submit form (in modal or tutor) |

### 6. **Loading States & UI Feedback**
- **Skeleton Loaders**: Visual loading indicators for worksheet generation
- **Button States**: Disabled state with loading text for API calls
- **Toast Notifications**: Non-blocking notifications for:
  - Success messages
  - Error messages
  - Warning messages
  - Info messages

### 7. **Improved State Management**
- **Centralized State**: `window.HydrogenState` object for:
  - Current problems
  - Current metadata
  - View mode
  - Chat history
  - Loading states
- **Consistent State Updates**: All state changes go through the central state object

### 8. **Code Quality Improvements**
- **JSDoc Comments**: Comprehensive documentation for all functions
- **Type Definitions**: TypeScript-like type definitions for better IDE support
- **Error Handling**: Try/catch blocks with appropriate error messages
- **Code Organization**: Logical grouping of related functions

### 9. **Security Enhancements**
- **DOMPurify**: Already present, now with better integration
- **escapeHtml Fallback**: If DOMPurify fails to load
- **Sandboxed Iframes**: For TikZ diagram rendering
- **Input Sanitization**: All user input is sanitized before rendering

### 10. **Performance Optimizations**
- **Lazy Loading**: MathJax loaded with `defer` instead of `async`
- **Rate Limiting**: Prevents overwhelming the server with rapid requests
- **Request Deduplication**: Prevents duplicate simultaneous requests

## 🚀 Usage

### Basic Usage
1. Open `index.html` in a web browser
2. Click "New Worksheet" or press `Ctrl/Cmd + N`
3. Fill in the form and click "Generate Sheet"
4. View, print, or get help from the AI tutor

### Custom Backend
To use a custom backend API:
```
https://your-site.com/index.html?backend_url=https://your-api.example.com
```

### Keyboard-Only Navigation
All functionality is accessible via keyboard:
- Use `Tab` and `Shift+Tab` to navigate
- Use `Enter` to activate buttons
- Use `Esc` to close overlays
- Use the shortcuts listed above

## 🔧 Configuration Options

Edit `js/config.js` to customize the application:

```javascript
const CONFIG = {
  BACKEND_URL: 'https://my-math.onrender.com',  // Default backend
  STORE_KEY: 'hydrogen.sheet.v2',              // localStorage key
  REQUEST_TIMEOUT_MS: 90000,                  // Request timeout (90s)
  SLOW_RESPONSE_MS: 6000,                     // "Waking server" message delay
  RATE_LIMIT_DELAY_MS: 1000,                 // Minimum delay between requests
  MAX_RETRIES: 2                              // Maximum retry attempts
};
```

## 📊 API Endpoints

The application uses two backend endpoints:

1. **Worksheet Generation**
   - URL: `{BACKEND_URL}/generate`
   - Method: POST
   - Body: `{ grade_level, topic, num_problems, difficulty, question_type, worksheet_type }`

2. **AI Tutor**
   - URL: `{BACKEND_URL}/tutor`
   - Method: POST
   - Body: `{ grade_level, messages, worksheet_context }`

## 🧪 Testing

The improvements include better error handling. Test with:

1. **Network Errors**: Disable internet and try generating a worksheet
2. **Server Errors**: Point to a non-existent backend URL
3. **Rate Limiting**: Rapidly click "Generate Sheet" multiple times
4. **Accessibility**: Use a screen reader to navigate the app
5. **Keyboard Only**: Try using the app without a mouse

## 📝 Migration Notes

### From v1 to v2

If you were using the previous single-file version:

1. **localStorage Key Changed**: From `hydrogen.sheet.v1` to `hydrogen.sheet.v2`
   - Old worksheets won't automatically load
   - Users will need to regenerate or use sample worksheet

2. **Backend URL Configuration**: Now configurable via query parameter
   - Old hardcoded URL still works as default
   - Use `?backend_url=` to override

3. **State Structure**: Now centralized in `window.HydrogenState`
   - Global variables like `currentProblems` are now in `window.HydrogenState.currentProblems`
   - All references updated accordingly

## 🎯 Future Improvements

Potential enhancements for future versions:

1. **TypeScript Migration**: Full TypeScript support
2. **Build System**: Use Vite or Webpack for bundling
3. **Authentication**: Add user authentication
4. **Offline Support**: Service worker for offline caching
5. **Pagination**: For large worksheets
6. **Export Options**: PDF, DOCX export
7. **Themes**: Dark mode, high contrast mode
8. **Internationalization**: Multi-language support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is for educational purposes. See the main repository for licensing details.

---

**Built with**: Vanilla JavaScript, Tailwind CSS, MathJax, DOMPurify

**Maintained by**: Hydrogen.ai Team

**Last Updated**: 2024
