/**
 * Gestion des types d'actes.
 * Propriétaire : NZEUTEM DOMOE EUNICE FELIXTINE
 * TODO :
 *  [ ] Remplacer l'édition JSON par un constructeur de champs.
 *  [ ] Empêcher la désactivation d'un type utilisé.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { LuBan, LuFileCog, LuPencil, LuPlus } from "react-icons/lu";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { useToast } from "@/context/ToastContext";
import {
  createType,
  deactivateType,
  fetchTypesAdmin,
  updateType,
} from "@/features/admin/api";
import {
  TypeFormModal,
  type TypeFormValues,
} from "@/features/admin/components/TypeFormModal";
import { getApiErrorMessage } from "@/lib/api";
import type { TypeActe } from "@/types";

export function AdminTypesPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<TypeActe | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<TypeActe | null>(null);

  const query = useQuery({
    queryKey: ["admin", "types"],
    queryFn: fetchTypesAdmin,
  });

  const saveMutation = useMutation({
    mutationFn: async (values: TypeFormValues) => {
      if (editingType) {
        return updateType(editingType.id, {
          label: values.label,
          description: values.description,
          form_schema: values.form_schema,
          template_md: values.template_md,
        });
      }
      return createType(values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "types"] });
      queryClient.invalidateQueries({ queryKey: ["types-actes"] });
      setModalOpen(false);
      setEditingType(null);
      toast.success(editingType ? "Type modifié" : "Type créé");
    },
    onError: (error) =>
      toast.error("Opération impossible", getApiErrorMessage(error)),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: number) => deactivateType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "types"] });
      queryClient.invalidateQueries({ queryKey: ["types-actes"] });
      setDeactivateTarget(null);
      toast.success("Type désactivé");
    },
    onError: (error) =>
      toast.error("Désactivation impossible", getApiErrorMessage(error)),
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Administration"
        title="Types d'actes"
        description="Gérez les modèles disponibles dans le catalogue citoyen."
        actions={
          <Button
            leftIcon={<LuPlus className="h-4 w-4" aria-hidden="true" />}
            onClick={() => {
              setEditingType(null);
              setModalOpen(true);
            }}
          >
            Créer un type
          </Button>
        }
      />

      {query.isError ? (
        <Alert variant="danger" title="Impossible de charger les types">
          {getApiErrorMessage(query.error)}
        </Alert>
      ) : null}

      {query.isLoading ? (
        <Skeleton className="h-72 w-full" />
      ) : query.data?.length ? (
        <Table caption="Types d'actes">
          <THead>
            <TR>
              <TH>Libellé</TH>
              <TH>Code</TH>
              <TH>Champs</TH>
              <TH>État</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {query.data.map((type) => (
              <TR key={type.id}>
                <TD className="font-medium text-ink">{type.label}</TD>
                <TD className="font-mono text-xs text-ink-soft">{type.code}</TD>
                <TD className="text-ink-soft">{type.form_schema.length}</TD>
                <TD>
                  {type.is_active ? (
                    <Badge variant="success">Actif</Badge>
                  ) : (
                    <Badge variant="neutral">Inactif</Badge>
                  )}
                </TD>
                <TD className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Modifier ${type.label}`}
                      onClick={() => {
                        setEditingType(type);
                        setModalOpen(true);
                      }}
                    >
                      <LuPencil className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Désactiver ${type.label}`}
                      disabled={!type.is_active}
                      onClick={() => setDeactivateTarget(type)}
                    >
                      <LuBan className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      ) : (
        <EmptyState
          icon={LuFileCog}
          title="Aucun type d'acte"
          description="Créez le premier modèle disponible pour les citoyens."
        />
      )}

      <TypeFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingType(null);
        }}
        type={editingType}
        onSubmit={(values) => saveMutation.mutate(values)}
        isPending={saveMutation.isPending}
      />

      <Modal
        open={Boolean(deactivateTarget)}
        onClose={() => setDeactivateTarget(null)}
        title="Désactiver ce type d'acte ?"
        description="Il ne sera plus proposé aux citoyens."
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
          Le type « {deactivateTarget?.label} » sera retiré du catalogue. Les
          demandes existantes ne sont pas supprimées.
        </p>
      </Modal>
    </div>
  );
}
