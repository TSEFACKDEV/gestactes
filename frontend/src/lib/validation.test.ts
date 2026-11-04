import { describe, expect, it } from "vitest";
import { extraireNumeroDepuisQr, forcePassword, loginSchema, numeroValide, registerSchema } from "./validation";

describe("numéro d'acte", () => {
  it("accepte le format ACTE-AAAA-NNNNN", () => {
    expect(numeroValide("acte-2026-00042")).toBe(true);
    expect(numeroValide(" ACTE-2026-00042 ")).toBe(true);
  });
  it("refuse un format incorrect", () => {
    expect(numeroValide("ACTE-26-42")).toBe(false);
    expect(numeroValide("")).toBe(false);
  });
  it("extrait le numéro d'une URL de QR code", () => {
    expect(extraireNumeroDepuisQr("https://gestactes.cm/verifier/ACTE-2026-00042")).toBe("ACTE-2026-00042");
    expect(extraireNumeroDepuisQr("https://exemple.com")).toBeNull();
  });
});

describe("formulaires", () => {
  it("valide la connexion", () => {
    expect(loginSchema.safeParse({ email: "a@b.cm", password: "x" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "pas-un-mail", password: "x" }).success).toBe(false);
  });
  const ok = { nom: "Ndiaye", prenom: "Awa", email: "awa@x.cm", password: "Abcdefg1", confirm: "Abcdefg1", terms: true };
  it("valide l'inscription", () => { expect(registerSchema.safeParse(ok).success).toBe(true); });
  it("refuse des mots de passe différents ou trop faibles", () => {
    expect(registerSchema.safeParse({ ...ok, confirm: "autre" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...ok, password: "abc", confirm: "abc" }).success).toBe(false);
  });
  it("exige l'acceptation des conditions", () => {
    expect(registerSchema.safeParse({ ...ok, terms: false }).success).toBe(false);
  });
  it("note la robustesse du mot de passe", () => {
    expect(forcePassword("abc")).toBe(0);
    expect(forcePassword("Abcdefg1!")).toBe(4);
  });
});
