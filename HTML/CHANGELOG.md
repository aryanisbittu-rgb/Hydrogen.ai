# Changelog

All notable changes to the Hydrogen.ai Math Worksheet Studio.

## [2.0.0] - 2024-10-29

### 🎉 Major Improvements

#### Architecture
- **Modular Code Structure**: Refactored single monolithic HTML file into 4 separate JavaScript modules
  - `config.js`: Configuration management
  - `utils.js`: Utility functions and helpers
  - `diagrams.js`: Diagram rendering logic
  - `app.js`: Main application logic
- **Improved Code Organization**: Better separation of concerns with clear module boundaries

#### Configuration
- **Environment Variable Support**: Backend URL can be configured via query parameter
  ```
  ?backend_url=https://custom-api.example.com
  ```
- **Centralized Configuration**: All config in `window.HydrogenConfig`
- **TypeScript-like Types**: Added JSDoc type definitions for better IDE support

#### Error Handling
- **Automatic Retries**: Failed API requests are retried up to 2 times
- **Request Timeouts**: 90 second timeout for API calls
- **User-Friendly Messages**: Clear, actionable error messages for different error types
- **Sample Worksheet Fallback**: Users can load a sample worksheet if generation fails

#### Accessibility
- **Comprehensive ARIA Attributes**: Added throughout the application
  - `aria-label` for descriptive labels
  - `aria-pressed` for toggle buttons
  - `aria-expanded` for collapsible elements
  - `aria-hidden` for modal/drawer states
  - `aria-busy` for loading states
  - Proper `role` attributes
- **Keyboard Navigation**:
  - Focus trapping in modals and drawers
  - Skip link to main content
  - Proper tab order
- **Focus Management**:
  - Focus returns to trigger element after closing modals
  - Auto-focus on first focusable element when opening modals
- **Screen Reader Support**: Full compatibility with assistive technologies

#### User Experience
- **Keyboard Shortcuts**: Added comprehensive keyboard shortcuts
  - `Esc`: Close modals/drawers
  - `Ctrl/Cmd + K`: Open/close AI Tutor
  - `Ctrl/Cmd + N`: Open new worksheet modal
  - `Ctrl/Cmd + P`: Print student copy
  - `Ctrl/Cmd + Shift + P`: Print with answers
  - `Ctrl/Cmd + Enter`: Submit form (in modal or tutor)
- **Loading States**: Visual feedback during API calls
  - Skeleton loaders for worksheet generation
  - Button disabled states with loading text
- **Toast Notifications**: Non-blocking notifications for user feedback
  - Success, error, warning, and info messages
- **Rate Limiting**: Prevents overwhelming the server with rapid requests (1000ms delay)

#### State Management
- **Centralized State**: `window.HydrogenState` object for all application state
- **Consistent Updates**: All state changes go through the central state object
- **Improved Persistence**: Better localStorage handling with error recovery

#### Code Quality
- **JSDoc Comments**: Comprehensive documentation for all functions
- **Error Handling**: Try/catch blocks with appropriate error messages
- **Code Organization**: Logical grouping of related functions
- **Naming Conventions**: More descriptive variable and function names

#### Security
- **Enhanced Sanitization**: Better integration with DOMPurify
- **Fallback Escaping**: `escapeHtml` fallback if DOMPurify fails to load
- **Sandboxed Iframes**: For TikZ diagram rendering

#### Performance
- **Lazy Loading**: MathJax loaded with `defer` instead of `async`
- **Request Deduplication**: Prevents duplicate simultaneous requests
- **Efficient Rendering**: Optimized DOM updates

### 📋 File Structure Changes

**Before:**
```
HTML/
└── index.html (single file with embedded JS)
```

**After:**
```
HTML/
├── index.html          # Main HTML with minimal inline JS
├── README.md           # Documentation
├── CHANGELOG.md        # This file
└── js/
    ├── config.js       # Configuration module
    ├── utils.js        # Utility functions
    ├── diagrams.js     # Diagram rendering
    └── app.js          # Main application logic
```

### 🔄 Migration Notes

#### localStorage Key Change
- **Old**: `hydrogen.sheet.v1`
- **New**: `hydrogen.sheet.v2`
- **Impact**: Old saved worksheets will not automatically load
- **Action**: Users will need to regenerate or use sample worksheet

#### Backend URL Configuration
- **Old**: Hardcoded in JavaScript
- **New**: Configurable via query parameter or `config.js`
- **Impact**: More flexible deployment options
- **Action**: Use `?backend_url=https://your-api.example.com` to override

#### State Structure
- **Old**: Global variables (`currentProblems`, `currentMeta`, etc.)
- **New**: Centralized in `window.HydrogenState`
- **Impact**: More maintainable state management
- **Action**: Update any custom code to use the new state object

### 🐛 Bug Fixes

- Fixed missing ARIA attributes for accessibility
- Fixed focus management in modals and drawers
- Fixed error handling for network failures
- Fixed state persistence issues

### ✨ New Features

- **Query Parameter Configuration**: Override backend URL via URL parameter
- **Keyboard Shortcuts**: Full keyboard navigation support
- **Toast Notifications**: Visual feedback for user actions
- **Loading Skeletons**: Better visual feedback during loading
- **Rate Limiting**: Prevents server overload

## [1.0.0] - 2024-10-25

### Initial Release

- First version of Hydrogen.ai Math Worksheet Studio
- Basic worksheet generation
- Interactive diagrams
- AI tutor functionality
- Printing support
- localStorage persistence
