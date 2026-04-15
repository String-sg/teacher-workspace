/** @type {import('lint-staged').Configuration} */
export default {
  '*.{js,jsx,ts,tsx}': 'oxlint --fix',
  '*.{js,jsx,ts,tsx,md,html,css,json,jsonc,yaml}': 'oxfmt --write',
};
