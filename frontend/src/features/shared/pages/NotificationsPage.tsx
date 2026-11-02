/**
 * Page des notifications.
 * Propriétaire : GUEMOGNE GERALDINE ESTHER
 * TODO :
 *  [ ] Ajouter le lien contextuel selon le rôle.
 *  [ ] Tester le compteur non lu.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LuBell, LuCheckCheck } from "react-icons/lu";
import { Link } from "react-router-dom";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api, getApiErrorMessage } from "@/lib/api";
import { formatRelative } from "@/lib/format";
import type { NotificationList } from "@/types";

export function NotificationsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await api.get<NotificationList>("/notifications");
      return data;
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: number) => {
      await api.patch(`/notifications/${id}/lue`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
    onError: (error) => toast.error("Impossible de marquer la notification", getApiErrorMessage(error)),
  });

  const markAll = useMutation({
    mutationFn: async () => {
      await api.post("/notifications/tout-lu");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Notifications marquées comme lues");
    },
    onError: (error) => toast.error("Opération impossible", getApiErrorMessage(error)),
  });

  const unread = query.data?.unread_count ?? 0;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Suivi"
        title="Notifications"
        description="Retrouvez les changements d'état de vos demandes et les actions qui vous concernent."
        actions={
          unread > 0 ? (
            <Button
              variant="secondary"
              leftIcon={<LuCheckCheck className="h-4 w-4" aria-hidden="true" />}
              onClick={() => markAll.mutate()}
              isLoading={markAll.isPending}
            >
              Tout marquer comme lu
            </Button>
          ) : undefined
        }
      />

      {query.isError ? (
        <Alert variant="danger">{getApiErrorMessage(query.error)}</Alert>
      ) : null}

      <Card>
        <CardHeader
          title="Boîte de réception"
          description={unread > 0 ? `${unread} notification(s) non lue(s)` : "Tout est à jour."}
        />
        <CardBody className="p-0">
          {query.isLoading ? (
            <div className="space-y-3 p-5">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : query.data?.items.length ? (
            <ul className="divide-y divide-line">
              {query.data.items.map((notification) => (
                <li
                  key={notification.id}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="flex gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                      <LuBell className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {notification.title}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                        {notification.message}
                      </p>
                      <p className="mt-1 text-xs text-ink-soft/80">
                        {formatRelative(notification.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 pl-12 sm:pl-0">
                    {user?.role === "citoyen" && notification.demande_id ? (
                      <Link to={`/app/demandes/${notification.demande_id}`}>
                        <Button variant="ghost" size="sm">
                          Voir
                        </Button>
                      </Link>
                    ) : null}
                    {!notification.is_read ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markRead.mutate(notification.id)}
                        isLoading={markRead.isPending}
                      >
                        Marquer lu
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-5">
              <EmptyState
                icon={LuBell}
                title="Aucune notification"
                description="Les changements d'état de vos demandes apparaîtront ici."
              />
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
