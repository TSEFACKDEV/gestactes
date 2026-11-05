import type { Role, User } from "@/lib/roles";
import type { ActeVerification } from "./verification";

/** Données fictives pour travailler sans backend (VITE_USE_MOCK=true). */
interface MockUser extends User { password: string }

const users: MockUser[] = [
  { id: 1, nom: "Djoumessi", prenom: "Marie", first_name: "Marie", last_name: "Djoumessi", email: "citoyen@gestactes.cm", password: "Citoyen123", role: "citoyen", actif: true, is_active: true, created_at: "2026-01-01T00:00:00Z" },
  { id: 2, nom: "Agent", prenom: "Test", first_name: "Test", last_name: "Agent", email: "agent@gestactes.cm", password: "Agent1234", role: "agent", actif: true, is_active: true, created_at: "2026-01-01T00:00:00Z" },
  { id: 3, nom: "Validateur", prenom: "Test", first_name: "Test", last_name: "Validateur", email: "validateur@gestactes.cm", password: "Valid1234", role: "validateur", actif: true, is_active: true, created_at: "2026-01-01T00:00:00Z" },
  { id: 4, nom: "Admin", prenom: "Test", first_name: "Test", last_name: "Admin", email: "admin@gestactes.cm", password: "Admin1234", role: "admin", actif: true, is_active: true, created_at: "2026-01-01T00:00:00Z" },
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
    users.push({
      id: users.length + 1,
      nom: d.nom,
      prenom: d.prenom,
      first_name: d.prenom,
      last_name: d.nom,
      email: d.email.toLowerCase(),
      password: d.password,
      role: "citoyen" as Role,
      actif: true,
      is_active: true,
      created_at: new Date().toISOString(),
    });
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
  async updateProfile(token: string, d: { nom: string; prenom: string }): Promise<User> {
    await wait();
    const u = users.find((x) => x.id === Number(token.split("-").pop()));
    if (!u) fail("Session invalide.");
    u!.nom = d.nom; u!.prenom = d.prenom;
    const { password: _p, ...user } = u!;
    return user;
  },
  async changePassword(token: string, current: string, next: string) {
    await wait();
    const u = users.find((x) => x.id === Number(token.split("-").pop()));
    if (!u) fail("Session invalide.");
    if (u!.password !== current) fail("Le mot de passe actuel est incorrect.");
    u!.password = next;
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

/* ---------- Demandes fictives du citoyen (12 : 8 validées, 2 en attente, 2 rejetées) ---------- */
import type { Demande, Statut } from "@/lib/demande";

export async function mockDemandes(): Promise<Demande[]> {
  await wait(400);
  const types = ["Attestation de résidence", "Extrait d'acte de naissance", "Autorisation administrative"];
  const plan: [Statut, number][] = [
    ["demandee", 1], ["en-instruction", 3], ["archivee", 4], ["signee", 6], ["rejetee", 8], ["archivee", 11], ["signee", 13],
    ["validee", 16], ["archivee", 19], ["rejetee", 22], ["archivee", 25], ["signee", 28],
  ];
  return plan.map(([statut, age], i) => ({
    id: i + 1,
    numero: `ACTE-2026-${String(456 - i * 7).padStart(5, "0")}`,
    type_acte: types[i % 3],
    statut,
    cree_le: new Date(Date.now() - age * 86_400_000).toISOString(),
  }));
}
