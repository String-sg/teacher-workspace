/** @type {import('lint-staged').Configuration} */
export default {
  '*.{js,jsx,ts,tsx,md,html,css,json,yaml}': 'prettier --write',
  '*.{js,jsx,ts,tsx}': 'eslint --fix',
  '*.go': (files) => {
    const dirs = new Set(files.map((file) => file.substring(0, file.lastIndexOf('/'))));
    return Array.from(dirs).map((dir) => `golangci-lint run --fix ${dir}`);
  },
};
