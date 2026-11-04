/**
 * Tests du dépôt de demande : formulaire dynamique, validation Zod, pièces,
 * envoi multipart, erreurs 413/422 et brouillon.
 * Propriétaire : JEUDIEU TSAGUE AUDREY DANIELLE
 *
 * Le test d'annulation conditionnelle appartient à la page de détail : il se
 * trouve dans `RequestDetailPage.test.tsx`.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, type AxiosResponse } from "axios";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ToastProvider } from "@/context/ToastContext";
import {
  DynamicForm,
  buildFormSchema,
  validateForm,
} from "@/features/citizen/components/DynamicForm";
import { validatePieces } from "@/features/citizen/components/PieceUploader";
import { NewRequestPage } from "@/features/citizen/pages/NewRequestPage";
import type { Demande, FormField, TypeActe } from "@/types";

vi.mock("@/features/citizen/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/citizen/api")>();
  return { ...actual, fetchTypes: vi.fn(), createDemande: vi.fn() };
});
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: { id: 7 } }),
}));

import { createDemande, fetchTypes } from "@/features/citizen/api";

const fetchTypesMock = vi.mocked(fetchTypes);
const createDemandeMock = vi.mocked(createDemande);

const FIELDS: FormField[] = [
  { name: "nom", label: "Nom complet", type: "text", required: true },
  {
    name: "adresse",
    label: "Adresse",
    type: "textarea",
    required: true,
    help: "Adresse actuelle du demandeur.",
  },
  { name: "naissance", label: "Date de naissance", type: "date", required: true },
  { name: "enfants", label: "Nombre d'enfants", type: "number", required: false },
  {
    name: "situation",
    label: "Situation familiale",
    type: "select",
    required: true,
    options: [
      { value: "celibataire", label: "Célibataire" },
      { value: "marie", label: "Marié(e)" },
    ],
  },
  {
    name: "attestation",
    label: "J'atteste l'exactitude des informations",
    type: "checkbox",
    required: true,
  },
];

const TYPE: TypeActe = {
  id: 1,
  code: "attestation-residence",
  label: "Attestation de résidence",
  description: "Atteste du lieu de résidence du demandeur.",
  form_schema: FIELDS,
  template_md: "",
  is_active: true,
};

const DRAFT_KEY = "gestactes:draft:v1:7:attestation-residence";

function pdf(name = "justificatif.pdf", size?: number): File {
  const file = new File(["%PDF-1.4"], name, { type: "application/pdf" });
  if (size !== undefined) Object.defineProperty(file, "size", { value: size });
  return file;
}

function renderPage(url = "/app/demandes/nouvelle?type=attestation-residence") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={[url]}>
          <Routes>
            <Route path="/app/demandes/nouvelle" element={<NewRequestPage />} />
            <Route path="/app/demandes/:id" element={<p>Page détail</p>} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(await screen.findByLabelText(/Nom complet/), "Awa Ndiaye");
  await user.type(screen.getByLabelText(/^Adresse/), "12 rue des Lilas");
  fireEvent.change(screen.getByLabelText(/Date de naissance/), { target: { value: "1990-05-01" } });
  await user.type(screen.getByLabelText(/Nombre d'enfants/), "2");
  await user.selectOptions(screen.getByLabelText(/Situation familiale/), "marie");
  await user.click(screen.getByLabelText(/J'atteste/));
}

function httpError(status: number, body: unknown): AxiosError {
  return new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, {
    status,
    statusText: "",
    headers: {},
    config: {} as never,
    data: body,
  } as AxiosResponse);
}

function submitButton() {
  return screen.getByRole("button", { name: /Déposer la demande/ });
}

beforeEach(() => {
  fetchTypesMock.mockReset();
  createDemandeMock.mockReset();
  fetchTypesMock.mockResolvedValue([TYPE]);
  window.localStorage.clear();
});

/* ------------------------------------------------------------------ */

describe("schéma Zod généré depuis le form_schema", () => {
  it("convertit les nombres et retire les champs optionnels vides", () => {
    const { data, errors } = validateForm(FIELDS, {
      nom: "  Awa Ndiaye ",
      adresse: "12 rue des Lilas",
      naissance: "1990-05-01",
      enfants: "",
      situation: "marie",
      attestation: true,
      inconnu: "doit disparaître",
    });
    expect(errors).toEqual({});
    expect(data).toEqual({
      nom: "Awa Ndiaye",
      adresse: "12 rue des Lilas",
      naissance: "1990-05-01",
      situation: "marie",
      attestation: true,
    });
  });

  it("transforme un nombre saisi en vrai nombre (et ne transforme pas un vide en 0)", () => {
    expect(validateForm(FIELDS, { enfants: "2.5" }).errors.enfants).toBeUndefined();
    const ok = validateForm(
      [{ name: "n", label: "N", type: "number", required: true }],
      { n: "2,5" },
    );
    expect(ok.data).toEqual({ n: 2.5 });
    const empty = validateForm([{ name: "n", label: "N", type: "number", required: true }], {
      n: "",
    });
    expect(empty.errors.n).toBe("Ce champ est obligatoire.");
  });

  it("signale les champs obligatoires manquants ou vides", () => {
    const { data, errors } = validateForm(FIELDS, { nom: "   " });
    expect(data).toBeNull();
    expect(errors).toMatchObject({
      nom: "Ce champ est obligatoire.",
      adresse: "Ce champ est obligatoire.",
      naissance: "Ce champ est obligatoire.",
      situation: "Sélectionnez une option.",
      attestation: "Vous devez cocher cette case.",
    });
    expect(errors.enfants).toBeUndefined();
  });

  it("refuse un nombre invalide, une date impossible et une option hors liste", () => {
    const { errors } = validateForm(FIELDS, {
      nom: "A",
      adresse: "B",
      naissance: "2026-02-31",
      enfants: "abc",
      situation: "inconnue",
      attestation: true,
    });
    expect(errors.naissance).toBe("Saisissez une date valide.");
    expect(errors.enfants).toBe("Saisissez un nombre valide.");
    expect(errors.situation).toBe("Sélectionnez une option de la liste.");
  });

  it("accepte une case facultative décochée et ignore les champs de type file", () => {
    const fields: FormField[] = [
      { name: "newsletter", label: "Newsletter", type: "checkbox", required: false },
      { name: "justif", label: "Justificatif", type: "file", required: true },
    ];
    expect(Object.keys(buildFormSchema(fields).shape)).toEqual(["newsletter"]);
    expect(validateForm(fields, {}).data).toEqual({ newsletter: false });
  });
});

describe("DynamicForm", () => {
  it("rend les six types de champs avec leurs libellés, aides et erreurs", () => {
    render(
      <DynamicForm
        fields={[...FIELDS, { name: "doc", label: "Pièce", type: "file", required: false }]}
        values={{}}
        errors={{ nom: "Ce champ est obligatoire." }}
        onChange={() => {}}
      />,
    );
    expect(screen.getByLabelText(/Nom complet/)).toHaveAttribute("type", "text");
    expect(screen.getByLabelText(/^Adresse/).tagName).toBe("TEXTAREA");
    expect(screen.getByLabelText(/Date de naissance/)).toHaveAttribute("type", "date");
    expect(screen.getByLabelText(/Nombre d'enfants/)).toHaveAttribute("type", "number");
    expect(screen.getByRole("combobox", { name: /Situation familiale/ })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /J'atteste.*\(obligatoire\)/ })).toBeInTheDocument();
    expect(screen.getByText("Adresse actuelle du demandeur.")).toBeInTheDocument();
    expect(screen.getByLabelText(/Nom complet/)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Ce champ est obligatoire.")).toBeInTheDocument();
    expect(screen.queryByLabelText(/Pièce/)).not.toBeInTheDocument();
  });

  it("remonte des chaînes pour un nombre (pas de 0 pour un champ vidé)", async () => {
    const onChange = vi.fn();
    render(
      <DynamicForm
        fields={[{ name: "n", label: "Nombre", type: "number", required: false }]}
        values={{ n: "4" }}
        onChange={onChange}
      />,
    );
    await userEvent.clear(screen.getByLabelText(/Nombre/));
    expect(onChange).toHaveBeenLastCalledWith("n", "");
  });
});

describe("validatePieces", () => {
  it("accepte jusqu'à 3 fichiers PDF/JPEG/PNG de 5 Mo maximum", () => {
    const files = [
      pdf("a.pdf"),
      new File(["x"], "b.png", { type: "image/png" }),
      new File(["x"], "c.jpg", { type: "image/jpeg" }),
    ];
    expect(validatePieces(files)).toBeNull();
    expect(validatePieces([pdf("limite.pdf", 5 * 1024 * 1024)])).toBeNull();
  });

  it("refuse un 4e fichier, un fichier trop lourd et un format interdit", () => {
    expect(validatePieces([pdf("1.pdf"), pdf("2.pdf"), pdf("3.pdf"), pdf("4.pdf")])).toMatch(
      /au maximum 3 fichiers/,
    );
    expect(validatePieces([pdf("gros.pdf", 5 * 1024 * 1024 + 1)])).toMatch(/gros\.pdf.*5 Mo/);
    expect(
      validatePieces([new File(["x"], "script.exe", { type: "application/x-msdownload" })]),
    ).toMatch(/script\.exe.*pas accepté/);
  });
});

/* ------------------------------------------------------------------ */

describe("page de dépôt d'une demande", () => {
  it("affiche les champs du type d'acte sélectionné", async () => {
    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Attestation de résidence", level: 1 }),
    ).toBeInTheDocument();
    for (const label of [
      /Nom complet/,
      /^Adresse/,
      /Date de naissance/,
      /Nombre d'enfants/,
      /Situation familiale/,
      /J'atteste/,
    ]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
  });

  it("permet de choisir le type depuis la liste puis l'affiche dans l'URL", async () => {
    renderPage("/app/demandes/nouvelle");

    await userEvent.click(
      await screen.findByRole("button", { name: "Continuer avec Attestation de résidence" }),
    );
    expect(await screen.findByLabelText(/Nom complet/)).toBeInTheDocument();
  });

  it("signale un type inconnu et propose la liste", async () => {
    renderPage("/app/demandes/nouvelle?type=n-existe-pas");

    expect(await screen.findByText("Type d'acte introuvable")).toBeInTheDocument();
    expect(screen.getByText(/n-existe-pas/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Continuer avec Attestation de résidence" }),
    ).toBeInTheDocument();
  });

  it("bloque la soumission si un champ requis est vide et place le focus sur le premier", async () => {
    renderPage();
    await screen.findByLabelText(/Nom complet/);

    await userEvent.click(submitButton());

    expect(createDemandeMock).not.toHaveBeenCalled();
    expect(await screen.findByText("Le formulaire contient des erreurs")).toBeInTheDocument();
    expect(screen.getByText(/Champs à corriger : Nom complet, Adresse/)).toBeInTheDocument();
    expect(screen.getAllByText("Ce champ est obligatoire.").length).toBeGreaterThanOrEqual(3);
    expect(screen.getByLabelText(/Nom complet/)).toHaveFocus();
  });

  it("efface l'erreur d'un champ dès qu'il est corrigé", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByLabelText(/Nom complet/);
    await user.click(submitButton());
    expect(screen.getByLabelText(/Nom complet/)).toHaveAttribute("aria-invalid", "true");

    await user.type(screen.getByLabelText(/Nom complet/), "Awa");

    expect(screen.getByLabelText(/Nom complet/)).toHaveAttribute("aria-invalid", "false");
  });

  it("envoie le formulaire en multipart avec les pièces, puis redirige vers le détail", async () => {
    const user = userEvent.setup();
    createDemandeMock.mockResolvedValue({ id: 55, numero: "2026-00055" } as Demande);
    const { container } = renderPage();
    await fillValidForm(user);
    const file = pdf();
    fireEvent.change(container.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [file] },
    });
    expect(await screen.findByText(/1 \/ 3 fichier joint/)).toBeInTheDocument();

    await user.click(submitButton());

    await waitFor(() => expect(createDemandeMock).toHaveBeenCalledTimes(1));
    const [payload, files, options] = createDemandeMock.mock.calls[0];
    expect(payload).toEqual({
      type_code: "attestation-residence",
      donnees: {
        nom: "Awa Ndiaye",
        adresse: "12 rue des Lilas",
        naissance: "1990-05-01",
        enfants: 2,
        situation: "marie",
        attestation: true,
      },
    });
    expect(files).toEqual([file]);
    expect(options?.idempotencyKey).toEqual(expect.any(String));
    expect(await screen.findByText("Page détail")).toBeInTheDocument();
    expect(window.localStorage.getItem(DRAFT_KEY)).toBeNull();
  });

  it("n'envoie pas deux fois la demande en cas de double clic", async () => {
    const user = userEvent.setup();
    let resolve: (value: Demande) => void = () => {};
    createDemandeMock.mockReturnValue(new Promise<Demande>((r) => (resolve = r)));
    renderPage();
    await fillValidForm(user);

    await user.dblClick(submitButton());

    expect(createDemandeMock).toHaveBeenCalledTimes(1);
    resolve({ id: 1, numero: "2026-00001" } as Demande);
    expect(await screen.findByText("Page détail")).toBeInTheDocument();
  });

  it("affiche clairement l'erreur 413 (pièce trop lourde) et conserve la saisie", async () => {
    const user = userEvent.setup();
    createDemandeMock.mockRejectedValue(
      httpError(413, { error: { code: "FILE_TOO_LARGE", message: "Fichier trop gros" } }),
    );
    renderPage();
    await fillValidForm(user);

    await user.click(submitButton());

    expect(await screen.findByText("Pièce jointe trop volumineuse")).toBeInTheDocument();
    expect(screen.getByText(/dépasse la taille maximale de 5 Mo/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nom complet/)).toHaveValue("Awa Ndiaye");
    expect(submitButton()).toBeEnabled();
  });

  it("affiche l'erreur 422 et rattache les détails aux champs concernés", async () => {
    const user = userEvent.setup();
    createDemandeMock.mockRejectedValue(
      httpError(422, {
        error: {
          code: "VALIDATION_ERROR",
          message: "Les données de la demande sont invalides.",
          details: { adresse: "Adresse introuvable", files: "Type de fichier interdit" },
        },
      }),
    );
    renderPage();
    await fillValidForm(user);

    await user.click(submitButton());

    expect(await screen.findByText("La demande n'a pas été acceptée")).toBeInTheDocument();
    expect(screen.getByText("Les données de la demande sont invalides.")).toBeInTheDocument();
    expect(screen.getByText("files : Type de fichier interdit")).toBeInTheDocument();
    const adresse = screen.getByLabelText(/^Adresse/);
    expect(adresse).toHaveAccessibleDescription(/Adresse introuvable/);
    expect(adresse).toHaveFocus();

    await user.type(adresse, " bis");
    expect(screen.queryByText("Adresse introuvable")).not.toBeInTheDocument();
  });

  it("réutilise la clé d'idempotence pour un même contenu et en change si on modifie la saisie", async () => {
    const user = userEvent.setup();
    createDemandeMock.mockRejectedValue(new Error("Réseau coupé"));
    renderPage();
    await fillValidForm(user);

    await user.click(submitButton());
    await screen.findByText("Réseau coupé");
    await user.click(submitButton());
    await waitFor(() => expect(createDemandeMock).toHaveBeenCalledTimes(2));
    const [first, second] = createDemandeMock.mock.calls.map((call) => call[2]?.idempotencyKey);
    expect(second).toBe(first);

    await user.type(screen.getByLabelText(/Nom complet/), " Jr");
    await user.click(submitButton());
    await waitFor(() => expect(createDemandeMock).toHaveBeenCalledTimes(3));
    expect(createDemandeMock.mock.calls[2][2]?.idempotencyKey).not.toBe(first);
  });

  it("refuse un 4e fichier, un fichier trop lourd et un format interdit", async () => {
    const { container } = renderPage();
    await screen.findByLabelText(/Nom complet/);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, {
      target: {
        files: [
          pdf("1.pdf"),
          pdf("2.pdf"),
          pdf("3.pdf"),
          pdf("4.pdf"),
        ],
      },
    });
    expect(await screen.findByText(/au maximum 3 fichiers/)).toBeInTheDocument();
    expect(screen.getByText(/3 \/ 3 fichiers joints/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Retirer 3.pdf" }));
    fireEvent.change(input, {
      target: {
        files: [pdf("gros.pdf", 6 * 1024 * 1024), new File(["x"], "virus.exe", { type: "application/x-msdownload" })],
      },
    });
    expect(await screen.findByText(/gros\.pdf dépasse 5 Mo/)).toBeInTheDocument();
    expect(screen.getByText(/virus\.exe n'est pas accepté/)).toBeInTheDocument();
    expect(screen.getByText(/2 \/ 3 fichiers joints/)).toBeInTheDocument();
  });

  it("enregistre un brouillon, le restaure au retour, puis permet de l'effacer", async () => {
    const user = userEvent.setup();
    const first = renderPage();
    await user.type(await screen.findByLabelText(/Nom complet/), "Awa Ndiaye");
    await user.click(screen.getByLabelText(/J'atteste/));
    await waitFor(() => expect(window.localStorage.getItem(DRAFT_KEY)).not.toBeNull());
    const stored = JSON.parse(window.localStorage.getItem(DRAFT_KEY) as string);
    expect(stored.values).toEqual({ nom: "Awa Ndiaye", attestation: true });
    first.unmount();

    renderPage();
    expect(await screen.findByText("Brouillon restauré")).toBeInTheDocument();
    expect(screen.getByLabelText(/Nom complet/)).toHaveValue("Awa Ndiaye");
    expect(screen.getByLabelText(/J'atteste/)).toBeChecked();

    await user.click(screen.getByRole("button", { name: "Effacer le brouillon" }));
    expect(screen.getByLabelText(/Nom complet/)).toHaveValue("");
    expect(screen.queryByText("Brouillon restauré")).not.toBeInTheDocument();
    expect(window.localStorage.getItem(DRAFT_KEY)).toBeNull();
  });

  it("ignore un brouillon expiré ou altéré", async () => {
    window.localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        savedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        values: { nom: "Ancien" },
      }),
    );
    const { unmount } = renderPage();
    expect(await screen.findByLabelText(/Nom complet/)).toHaveValue("");
    expect(screen.queryByText("Brouillon restauré")).not.toBeInTheDocument();
    unmount();

    window.localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        savedAt: new Date().toISOString(),
        values: { nom: "Awa", situation: "option-supprimee", fantome: "x", attestation: "oui" },
      }),
    );
    renderPage();
    expect(await screen.findByText("Brouillon restauré")).toBeInTheDocument();
    expect(screen.getByLabelText(/Nom complet/)).toHaveValue("Awa");
    expect(screen.getByLabelText(/Situation familiale/)).toHaveValue("");
    expect(screen.getByLabelText(/J'atteste/)).not.toBeChecked();
  });

  it("affiche l'état vide du catalogue et l'erreur de chargement", async () => {
    fetchTypesMock.mockResolvedValueOnce([]);
    const empty = renderPage();
    expect(await screen.findByText("Aucun type d'acte disponible")).toBeInTheDocument();
    empty.unmount();

    fetchTypesMock.mockRejectedValueOnce(new Error("API indisponible"));
    renderPage();
    const alert = await screen.findByRole("alert");
    expect(within(alert).getByText("Catalogue indisponible")).toBeInTheDocument();
    expect(screen.queryByText("Aucun type d'acte disponible")).not.toBeInTheDocument();
  });
});
