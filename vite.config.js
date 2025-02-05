import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// https://vite.dev/config/
export default defineConfig({
    base: "https://seoulcalibur.github.io/L1Fees/",
    plugins: [react()],
});
