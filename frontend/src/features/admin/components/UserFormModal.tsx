/**
 * Modale de création/modification d'un utilisateur.
 * Propriétaire : NZEUTEM DOMOE EUNICE FELIXTINE
 * TODO :
 *  [ ] Ajouter la validation Zod.
 *  [ ] Tester la création d'un agent et d'un validateur.
 */

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { ROLE_LABELS } from "@/lib/constants";
import type { Role, User } from "@/types";

const ROLE_OPTIONS = (Object.keys(ROLE_LABELS) as Role[]).map((role) => ({
  value: role,
  label: ROLE_LABELS[role],
}));

export interface UserFormValues {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: Role;
}

export function UserFormModal({
  open,
  onClose,
  user,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  user?: User | null;
  onSubmit: (values: UserFormValues) => void;
  isPending: boolean;
}) {
  const editing = Boolean(user);
  const [values, setValues] = useState<UserFormValues>({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    role: "agent",
  });

  useEffect(() => {
    if (!open) return;
    setValues({
      first_name: user?.first_name ?? "",
      last_name: user?.last_name ?? "",
      email: user?.email ?? "",
      password: "",
      role: user?.role ?? "agent",
    });
  }, [open, user]);

  function update<K extends keyof UserFormValues>(key: K, value: UserFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  const canSubmit =
    values.first_name.trim().length > 1 &&
    values.last_name.trim().length > 1 &&
    values.email.includes("@") &&
    (editing || values.password.length >= 8);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Modifier l'utilisateur" : "Créer un utilisateur"}
      description={
        editing
          ? "Modifiez le nom, le rôle ou l'état du compte."
          : "Créez un compte agent, validateur ou administrateur."
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button
            isLoading={isPending}
            disabled={!canSubmit}
            onClick={() => onSubmit(values)}
          >
            {editing ? "Enregistrer" : "Créer le compte"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Prénom"
            value={values.first_name}
            onChange={(event) => update("first_name", event.target.value)}
            required
          />
          <Input
            label="Nom"
            value={values.last_name}
            onChange={(event) => update("last_name", event.target.value)}
            required
          />
        </div>
        <Input
          label="Adresse e-mail"
          type="email"
          value={values.email}
          onChange={(event) => update("email", event.target.value)}
          disabled={editing}
          required
        />
        {!editing ? (
          <Input
            label="Mot de passe initial"
            type="password"
            value={values.password}
            onChange={(event) => update("password", event.target.value)}
            hint="8 caractères minimum."
            required
          />
        ) : null}
        <Select
          label="Rôle"
          options={ROLE_OPTIONS}
          value={values.role}
          onChange={(event) => update("role", event.target.value as Role)}
        />
        {editing ? (
          <p className="text-xs text-ink-soft">
            L'adresse e-mail n'est pas modifiable dans cette version.
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
