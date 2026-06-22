import path from 'node:path';

import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginTailwindcss } from '@rsbuild/plugin-tailwindcss';

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginTailwindcss(),
    pluginModuleFederation({
      name: 'teacher_workspace',
      remotes: {},
      shared: {
        react: {
          singleton: true,
          eager: true,
          requiredVersion: '^19.2.7',
        },
        'react-dom': {
          singleton: true,
          eager: true,
          requiredVersion: '^19.2.7',
        },
      },
    }),
  ],
  html: {
    template: './index.html',
  },
  source: {
    alias: {
      '~': path.resolve(import.meta.dirname, 'src'),
    },
  },
});
