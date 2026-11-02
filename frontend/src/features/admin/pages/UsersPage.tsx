/**
 * Gestion des utilisateurs.
 * Propriétaire : NZEUTEM DOMOE EUNICE FELIXTINE
 * TODO :
 *  [ ] Tester la désactivation du dernier admin.
 *  [ ] Ajouter la réactivation d'un compte.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { LuBan, LuPencil, LuPlus, LuSearch, LuUsers } from "react-icons/lu";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  createUser,
  deactivateUser,
  fetchUsers,
  updateUser,
} from "@/features/admin/api";
import {
  UserFormModal,
  type UserFormValues,
} from "@/features/admin/components/UserFormModal";
import { getApiErrorMessage } from "@/lib/api";
import { ROLE_LABELS } from "@/lib/constants";
import { formatDate, fullName } from "@/lib/format";
import type { Role, User } from "@/types";

const ROLE_OPTIONS = [
  { value: "", label: "Tous les rôles" },
  ...(Object.keys(ROLE_LABELS) as Role[]).map((role) => ({
    value: role,
    label: ROLE_LABELS[role],
  })),
];

const ROLE_BADGES: Record<Role, "primary" | "success" | "info" | "danger"> = {
  citoyen: "info",
  agent: "success",
  validateur: "primary",
  admin: "danger",
};

export function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [role, setRole] = useState<Role | "">("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<User | null>(null);

  const query = useQuery({
    queryKey: ["admin", "users", q, role, page],
    queryFn: () =>
      fetchUsers({
        q: q || undefined,
        role: role || undefined,
        page,
        page_size: 20,
      }),
  });

  const saveMutation = useMutation({
    mutationFn: async (values: UserFormValues) => {
      if (editingUser) {
        return updateUser(editingUser.id, {
          first_name: values.first_name,
          last_name: values.last_name,
          role: values.role,
        });
      }
      return createUser(values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setModalOpen(false);
      setEditingUser(null);
      toast.success(editingUser ? "Utilisateur modifié" : "Utilisateur créé");
    },
    onError: (error) =>
      toast.error("Opération impossible", getApiErrorMessage(error)),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: number) => deactivateUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setDeactivateTarget(null);
      toast.success("Compte désactivé");
    },
    onError: (error) =>
      toast.error("Désactivation impossible", getApiErrorMessage(error)),
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Administration"
        title="Utilisateurs"
        description="Créez et gérez les comptes agents, validateurs et administrateurs."
        actions={
          <Button
            leftIcon={<LuPlus className="h-4 w-4" aria-hidden="true" />}
            onClick={() => {
              setEditingUser(null);
              setModalOpen(true);
            }}
          >
            Créer un utilisateur
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Input
            aria-label="Rechercher un utilisateur"
            placeholder="Nom ou adresse e-mail"
            value={q}
            onChange={(event) => {
              setQ(event.target.value);
              setPage(1);
            }}
            leftIcon={<LuSearch className="h-4 w-4" aria-hidden="true" />}
          />
        </div>
        <div className="sm:w-56">
          <Select
            aria-label="Filtrer par rôle"
            options={ROLE_OPTIONS}
            value={role}
            onChange={(event) => {
              setRole(event.target.value as Role | "");
              setPage(1);
            }}
          />
        </div>
      </div>

      {query.isError ? (
        <Alert variant="danger" title="Impossible de charger les utilisateurs">
          {getApiErrorMessage(query.error)}
        </Alert>
      ) : null}

      {query.isLoading ? (
        <Skeleton className="h-80 w-full" />
      ) : query.data?.items.length ? (
        <>
          <Table caption="Liste des utilisateurs">
            <THead>
              <TR>
                <TH>Nom</TH>
                <TH>Adresse e-mail</TH>
                <TH>Rôle</TH>
                <TH>État</TH>
                <TH>Créé le</TH>
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {query.data.items.map((user) => (
                <TR key={user.id}>
                  <TD className="font-medium text-ink">{fullName(user)}</TD>
                  <TD className="text-ink-soft">{user.email}</TD>
                  <TD>
                    <Badge variant={ROLE_BADGES[user.role]}>{ROLE_LABELS[user.role]}</Badge>
                  </TD>
                  <TD>
                    {user.is_active ? (
                      <Badge variant="success">Actif</Badge>
                    ) : (
                      <Badge variant="neutral">Désactivé</Badge>
                    )}
                  </TD>
                  <TD className="text-ink-soft">{formatDate(user.created_at)}</TD>
                  <TD className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Modifier ${fullName(user)}`}
                        onClick={() => {
                          setEditingUser(user);
                          setModalOpen(true);
                        }}
                      >
                        <LuPencil className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Désactiver ${fullName(user)}`}
                        disabled={user.id === currentUser?.id || !user.is_active}
                        onClick={() => setDeactivateTarget(user)}
                      >
                        <LuBan className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <Pagination
            page={query.data.page}
            pages={query.data.pages}
            onPageChange={setPage}
          />
        </>
      ) : (
        <EmptyState
          icon={LuUsers}
          title="Aucun utilisateur"
          description="Créez le premier compte agent ou validateur."
        />
      )}

      <UserFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingUser(null);
        }}
        user={editingUser}
        onSubmit={(values) => saveMutation.mutate(values)}
        isPending={saveMutation.isPending}
      />

      <Modal
        open={Boolean(deactivateTarget)}
        onClose={() => setDeactivateTarget(null)}
        title="Désactiver ce compte ?"
        description="L'utilisateur ne pourra plus se connecter."
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeactivateTarget(null)}>
              Conserver
            </Button>
            <Button
              variant="danger"
              isLoading={deactivateMutation.isPending}
              onClick={() =>
                deactivateTarget && deactivateMutation.mutate(deactivateTarget.id)
              }
            >
              Désactiver
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-ink-soft">
          Le compte de {deactivateTarget ? fullName(deactivateTarget) : "cet utilisateur"}{" "}
          sera désactivé. Ses sessions seront révoquées.
        </p>
      </Modal>
    </div>
  );
}
