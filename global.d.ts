// Pozwala na side-effect import globalnego CSS, np. `import "./globals.css"`.
// TypeScript 6 sprawdza takie importy (noUncheckedSideEffectImports),
// a Next deklaruje tylko `*.module.css`.
declare module "*.css";
