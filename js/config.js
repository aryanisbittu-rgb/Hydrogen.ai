/**
 * Configuration Module
 * Centralized configuration for the Hydrogen.ai Math Worksheet Studio
 * 
 * @module config
 */

/**
 * Application Configuration
 * @typedef {Object} AppConfig
 * @property {string} BACKEND_URL - Base URL for the backend API
 * @property {string} API_ENDPOINT - Endpoint for worksheet generation
 * @property {string} TUTOR_ENDPOINT - Endpoint for AI tutor
 * @property {string} STORE_KEY - Key for localStorage
 * @property {number} REQUEST_TIMEOUT_MS - Timeout for API requests (90 seconds)
 * @property {number} SLOW_RESPONSE_MS - Time after which to show "Waking server" message (6 seconds)
 * @property {number} RATE_LIMIT_DELAY_MS - Minimum delay between API calls (1000ms)
 * @property {number} MAX_RETRIES - Maximum number of retry attempts for failed requests
 * @property {string} SUPABASE_URL - Supabase project URL for authentication
 * @property {string} SUPABASE_ANON_KEY - Supabase anonymous key for authentication
 */

/** @type {AppConfig} */
const CONFIG = {
  // Allow BACKEND_URL to be overridden via query parameter: ?backend_url=https://custom-api.example.com
  BACKEND_URL: (function() {
    const params = new URLSearchParams(window.location.search);
    return params.get('backend_url') || 'https://my-math.onrender.com';
  })(),
  API_ENDPOINT: null, // Will be set below
  TUTOR_ENDPOINT: null, // Will be set below
  STORE_KEY: 'hydrogen.sheet.v2',
  REQUEST_TIMEOUT_MS: 90000,
  SLOW_RESPONSE_MS: 6000,
  RATE_LIMIT_DELAY_MS: 1000,
  MAX_RETRIES: 2,
  
  // Supabase Authentication Configuration
  // Replace these placeholders with your actual keys from Supabase Dashboard -> Project Settings -> API
  SUPABASE_URL: 'https://fzetnskhzuydxtyiiqst.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_UDan49aXehDAz0TRFZ0ifQ_GBGrLnhH',
};

// Initialize endpoints based on BACKEND_URL
CONFIG.API_ENDPOINT = CONFIG.BACKEND_URL + '/generate';
CONFIG.TUTOR_ENDPOINT = CONFIG.BACKEND_URL + '/tutor';

// Export CONFIG to global scope for other modules
window.HydrogenConfig = CONFIG;
