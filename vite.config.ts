import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { federation } from '@module-federation/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const shellUrl = env.VITE_SHELL_URL || 'http://localhost:3000';
  const origin = env.VITE_PUBLIC_URL || 'http://localhost:3002';

  return {
    base: `${origin}/`,
    plugins: [
      react(),
      tailwindcss(),
      federation({
        name: 'insights',
        filename: 'remoteEntry.js',
        exposes: { './Insights': './src/Insights.tsx' },
        // shared UI kit comes from the shell
        remotes: {
          shell: { type: 'module', name: 'shell', entry: `${shellUrl}/remoteEntry.js`, entryGlobalName: 'shell', shareScope: 'default' },
        },
        shared: {
          react: { singleton: true },
          'react-dom': { singleton: true },
        },
        bundleAllCSS: true,
        dts: false,
      }),
    ],
    server: { port: 3002, strictPort: true, origin, cors: true },
    preview: { port: 3002, strictPort: true, cors: true },
    build: { target: 'esnext' },
    test: { environment: 'jsdom' },
  };
});
