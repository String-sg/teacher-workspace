/** @type {import('lint-staged').Configuration} */
export default {
  '*.{js,jsx,ts,tsx,md,html,css,json,yaml}': 'prettier --write',
};
