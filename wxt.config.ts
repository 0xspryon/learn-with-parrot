import { defineConfig } from 'wxt';
import tailwindcss from "@tailwindcss/vite";

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-svelte'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  runner: {
    startUrls: ['https://www.google.com/search?q=wxt+extension']
  },
  manifest: ({ mode }) => ({
    name: "Parrotly",
    description: "Parrotly helps you revise the vocabulary of a language by periodically showing it to you as you browse the web.",
    permissions: [
      "storage",
      "tabs",
      "activeTab",
      "notifications",
      "contextMenus",
      "alarms",
    ],
    action: {
      default_icon: {
        "16": "icon/16.png",
        "48": "icon/48.png",
        "128": "icon/128.png"
      }
    },
    browser_specific_settings: {
      gecko: {
        "id": "@example-data-collection-with-fallback",
        "data_collection_permissions": {
          "required": [
             "locationInfo"
          ],
          "optional": [
             "technicalAndInteraction"
          ]
         }
      }
    },
    web_accessible_resources: [
      {
        resources: ["dashboard.html"],
        matches: ["*://*/*"]
      }
    ],
    content_security_policy: {
      extension_pages:
        mode === 'development'
          ? "script-src 'self' 'wasm-unsafe-eval' http://localhost:3000 http://localhost:3001; object-src 'self'"
          : "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'"
    }
  })
});
