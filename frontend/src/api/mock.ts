import type { Role, User } from "@/lib/roles";
import type { ActeVerification } from "./verification";

/** Données fictives pour travailler sans backend (VITE_USE_MOCK=true). */
interface MockUser extends User { password: string }

const users: MockUser[] = [
  { id: 1, nom: "Djoumessi", prenom: "M.", email: "citoyen@gestactes.cm", password: "Citoyen123", role: "citoyen", actif: true },
  { id: 2, nom: "Agent", prenom: "Test", email: "agent@gestactes.cm", password: "Agent1234", role: "agent", actif: true },
  { id: 3, nom: "Validateur", prenom: "Test", email: "validateur@gestactes.cm", password: "Valid1234", role: "validateur", actif: true },
  { id: 4, nom: "Admin", prenom: "Test", email: "admin@gestactes.cm", password: "Admin1234", role: "administrateur", actif: true },
];

const wait = (ms = 600) => new Promise((r) => setTimeout(r, ms));
const fail = (msg: string): never => { throw new Error(msg); };

export const mockAuth = {
  async login(email: string, password: string) {
    await wait();
    const u = users.find((x) => x.email === email.toLowerCase());
    if (!u || u.password !== password) fail("E-mail ou mot de passe incorrect.");
    return { access_token: `mock-access-${u!.id}`, refresh_token: `mock-refresh-${u!.id}`, token_type: "bearer" };
  },
  async register(d: { nom: string; prenom: string; email: string; password: string }) {
    await wait();
    if (users.some((u) => u.email === d.email.toLowerCase())) fail("Un compte existe déjà avec cet e-mail.");
    users.push({ id: users.length + 1, nom: d.nom, prenom: d.prenom, email: d.email.toLowerCase(), password: d.password, role: "citoyen" as Role, actif: true });
  },
  async me(token: string): Promise<User> {
    await wait(200);
    const id = Number(token.split("-").pop());
    const u = users.find((x) => x.id === id);
    if (!u) fail("Session invalide.");
    const { password: _p, ...user } = u!;
    return user;
  },
  async refresh(refresh: string) {
    const id = refresh.split("-").pop();
    return { access_token: `mock-access-${id}` };
  },
  async forgot() { await wait(); },
  async reset() { await wait(); },
};

const ACTES: Record<string, ActeVerification> = {
  "ACTE-2026-00042": {
    authentique: true, numero: "ACTE-2026-00042", type_acte: "Attestation de résidence",
    date_delivrance: "2026-10-15", statut: "archivee", commune: "Douala 1er",
    empreinte_sha256: "9f2c4ab07e51d3c8a6b1f0e4d7c92a58b3e61f0d4c7a9b28e5f13d06a7c8b4e2",
  },
  "ACTE-2026-00125": {
    authentique: true, numero: "ACTE-2026-00125", type_acte: "Extrait d'acte de naissance",
    date_delivrance: "2026-03-15", statut: "signee", commune: "Douala 1er",
    empreinte_sha256: "1ab7c90e2d4f58a3b6c17d0e9f2a4b85c3d6e1f07a9b2c48d5e3f6a1b0c9d7e8",
  },
};

export async function mockVerifier(numero: string): Promise<ActeVerification> {
  await wait(700);
  const a = ACTES[numero];
  if (!a) {
    const e = new Error("Aucun acte signé ne correspond à ce numéro.");
    (e as Error & { notFound?: boolean }).notFound = true;
    throw e;
  }
  return a;
}
