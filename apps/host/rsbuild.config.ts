import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [
    pluginReact(),
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
});
