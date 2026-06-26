// Typ pro virtuální modul `virtual:themes` (registr motivů generuje Vite plugin
// v vite.config.ts). Bez této deklarace by TS import neznal.
declare module "virtual:themes" {
  /** NN motivů s kompletními assety (cards_NN + dashboard_NN), vzestupně. */
  export const THEMES: string[];
}
