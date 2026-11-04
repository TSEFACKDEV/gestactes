/**
 * Tests de l'envoi de demande (multipart, idempotence, erreurs 413/422).
 * Propriétaire : JEUDIEU TSAGUE AUDREY DANIELLE
 */

import { AxiosError, type AxiosResponse } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createDemande,
  createIdempotencyKey,
  interpretCreateError,
} from "@/features/citizen/api";
import { api } from "@/lib/api";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function httpError(status: number, body: unknown): AxiosError {
  return new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, {
    status,
    statusText: "",
    headers: {},
    config: {} as never,
    data: body,
  } as AxiosResponse);
}

describe("createDemande", () => {
  it("poste un multipart avec le payload JSON, les fichiers et la clé d'idempotence", async () => {
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: { id: 1 } });
    const files = [
      new File(["a"], "a.pdf", { type: "application/pdf" }),
      new File(["b"], "b.png", { type: "image/png" }),
    ];
    const onProgress = vi.fn();

    const result = await createDemande(
      { type_code: "attestation-residence", donnees: { adresse: "12 rue des Lilas" } },
      files,
      { idempotencyKey: "cle-123", onProgress },
    );

    expect(result).toEqual({ id: 1 });
    const [url, body, config] = post.mock.calls[0];
    expect(url).toBe("/demandes");
    expect(body).toBeInstanceOf(FormData);
    const form = body as FormData;
    expect(JSON.parse(form.get("payload") as string)).toEqual({
      type_code: "attestation-residence",
      donnees: { adresse: "12 rue des Lilas" },
    });
    expect(form.getAll("files")).toHaveLength(2);
    expect((form.getAll("files")[0] as File).name).toBe("a.pdf");
    expect(config?.headers).toEqual({ "Idempotency-Key": "cle-123" });
    expect(config?.timeout).toBe(60_000);

    config?.onUploadProgress?.({ loaded: 50, total: 200 } as never);
    expect(onProgress).toHaveBeenCalledWith(25);
  });

  it("reste compatible avec l'ancien appel à deux arguments", async () => {
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: { id: 2 } });

    await createDemande({ type_code: "x", donnees: {} }, []);

    const config = post.mock.calls[0][2];
    expect(config?.headers).toBeUndefined();
    expect(config?.onUploadProgress).toBeUndefined();
    expect((post.mock.calls[0][1] as FormData).getAll("files")).toHaveLength(0);
  });
});

describe("interpretCreateError", () => {
  it("413 : message dédié sur la taille maximale", () => {
    const failure = interpretCreateError(httpError(413, { error: { code: "FILE_TOO_LARGE" } }));
    expect(failure.status).toBe(413);
    expect(failure.message).toMatch(/dépasse la taille maximale de 5 Mo/);
  });

  it("422 : message de l'API et détails par champ", () => {
    const failure = interpretCreateError(
      httpError(422, {
        error: {
          code: "VALIDATION_ERROR",
          message: "Les données de la demande sont invalides.",
          details: { adresse: "Champ requis" },
        },
      }),
    );
    expect(failure.status).toBe(422);
    expect(failure.message).toBe("Les données de la demande sont invalides.");
    expect(failure.details).toEqual({ adresse: "Champ requis" });
  });

  it("422 sans message : texte par défaut", () => {
    expect(interpretCreateError(httpError(422, {})).message).toMatch(/Corrigez les champs/);
  });

  it("429 : invite à patienter", () => {
    expect(interpretCreateError(httpError(429, {})).message).toMatch(/Patientez/);
  });

  it("réseau coupé : message explicite, saisie conservée", () => {
    const failure = interpretCreateError(new AxiosError("Network Error", "ERR_NETWORK"));
    expect(failure.status).toBeNull();
    expect(failure.message).toMatch(/injoignable/);
  });

  it("autre statut ou erreur non HTTP : message de l'API ou de l'erreur", () => {
    expect(
      interpretCreateError(httpError(501, { error: { message: "Pas encore implémenté" } })).message,
    ).toBe("Pas encore implémenté");
    expect(interpretCreateError(new Error("Boom")).message).toBe("Boom");
  });
});

describe("createIdempotencyKey", () => {
  it("génère des clés distinctes", () => {
    expect(createIdempotencyKey()).not.toBe(createIdempotencyKey());
  });

  it("a un repli quand crypto.randomUUID est indisponible", () => {
    vi.stubGlobal("crypto", {});
    const key = createIdempotencyKey();
    expect(key).toMatch(/^[a-z0-9]+-[a-z0-9]+$/);
  });
});
