import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/

export default defineConfig(({ mode }) => {
  let base = "/";

  if (mode === "production") {
    base = "/75/recap/";
  }

  return {
    plugins: [react()],
    base: base,
  };
});
