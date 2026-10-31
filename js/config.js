/**
 * Configuration Module
 * Centralized configuration for the Hydrogen.ai Math Worksheet Studio
 * 
 * @module config
 */

const CONFIG = {
  // Allow BACKEND_URL to be overridden via query parameter: ?backend_url=https://custom-api.example.com
  BACKEND_URL: (function() {
    const params = new URLSearchParams(window.location.search);
    return params.get('backend_url') || 'https://my-math.onrender.com';
  })(),
  API_ENDPOINT: null,
  TUTOR_ENDPOINT: null,
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

CONFIG.API_ENDPOINT = CONFIG.BACKEND_URL + '/generate';
CONFIG.TUTOR_ENDPOINT = CONFIG.BACKEND_URL + '/tutor';

window.HydrogenConfig = CONFIG;
