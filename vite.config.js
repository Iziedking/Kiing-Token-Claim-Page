import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import vitePluginJson from "@rollup/plugin-json"; // Import JSON plugin

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    vitePluginJson(), 
  ],
});