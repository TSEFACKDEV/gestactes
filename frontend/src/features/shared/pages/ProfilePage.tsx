/**
 * Page de profil.
 * Propriétaire : GUEMOGNE GERALDINE ESTHER
 * TODO :
 *  [ ] Ajouter le changement de mot de passe.
 *  [ ] Tester la mise à jour du profil.
 */

import { useEffect, useState, type FormEvent } from "react";
import { LuMail, LuShieldCheck } from "react-icons/lu";

import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api, getApiErrorMessage } from "@/lib/api";
import { ROLE_LABELS } from "@/lib/constants";
import type { User } from "@/types";

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [firstName, setFirstName] = useState(user?.first_name ?? "");
  const [lastName, setLastName] = useState(user?.last_name ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFirstName(user?.first_name ?? "");
    setLastName(user?.last_name ?? "");
  }, [user]);

  if (!user) return null;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      await api.patch<User>("/auth/me", {
        first_name: firstName,
        last_name: lastName,
      });
      await refreshUser();
      toast.success("Profil mis à jour");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Compte"
        title="Mon profil"
        description="Vos informations personnelles et votre rôle dans la plateforme."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <CardBody className="flex flex-col items-center text-center">
            <Avatar
              firstName={user.first_name}
              lastName={user.last_name}
              size="lg"
              className="h-16 w-16 text-xl"
            />
            <h2 className="mt-4 font-display text-xl font-semibold text-ink">
              {user.first_name} {user.last_name}
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
              <LuMail className="h-4 w-4" aria-hidden="true" />
              {user.email}
            </p>
            <Badge variant="primary" className="mt-4">
              <LuShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {ROLE_LABELS[user.role]}
            </Badge>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Informations personnelles"
            description="Seuls le prénom et le nom sont modifiables dans cette version."
          />
          <CardBody>
            <form onSubmit={onSubmit} className="space-y-4">
              {error ? <p className="text-sm text-danger">{error}</p> : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Prénom"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  required
                />
                <Input
                  label="Nom"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  required
                />
              </div>
              <Input label="Adresse e-mail" value={user.email} disabled />
              <div className="flex justify-end">
                <Button type="submit" isLoading={isSaving}>
                  Enregistrer
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
