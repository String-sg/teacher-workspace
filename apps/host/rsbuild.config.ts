import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginModuleFederation({
      name: 'host',
      remotes: {},
      shared: {
        react: {
          singleton: true,
          eager: true,
          requiredVersion: '^19.0.0',
        },
        'react-dom': {
          singleton: true,
          eager: true,
          requiredVersion: '^19.0.0',
        },
      },
    }),
  ],
  html: {
    template: './public/index.html',
  },
});
