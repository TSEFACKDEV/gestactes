/**
 * Stockage des jetons JWT.
 * - jeton d'accès : en mémoire uniquement (durée courte, 30 min)
 * - jeton de rafraîchissement : sessionStorage, ou localStorage si « Se souvenir de moi »
 */
const KEY = "gestactes.refresh";
let accessToken: string | null = null;

export const tokenStore = {
  getAccess: () => accessToken,
  setAccess: (t: string | null) => { accessToken = t; },
  getRefresh: () => sessionStorage.getItem(KEY) ?? localStorage.getItem(KEY),
  setRefresh: (t: string, persistant: boolean) => {
    sessionStorage.removeItem(KEY);
    localStorage.removeItem(KEY);
    (persistant ? localStorage : sessionStorage).setItem(KEY, t);
  },
  isPersistent: () => localStorage.getItem(KEY) !== null,
  clear: () => {
    accessToken = null;
    sessionStorage.removeItem(KEY);
    localStorage.removeItem(KEY);
  },
};
