/**
 * Page publique de vérification d'un acte.
 * Propriétaire : GUEMOGNE GERALDINE ESTHER
 * TODO :
 *  [ ] Ajouter le scan QR code côté client.
 *  [ ] Tester les actes inconnus et non signés.
 */

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LuCircleCheck, LuCircleX, LuScanLine, LuSearch } from "react-icons/lu";
import { Link, useParams } from "react-router-dom";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { verifyActe } from "@/features/public/api";
import { getApiErrorMessage } from "@/lib/api";
import { formatDateTime } from "@/lib/format";

export function VerificationPage() {
  const { numero: routeNumero } = useParams();
  const [numero, setNumero] = useState(routeNumero ?? "");
  const [submitted, setSubmitted] = useState(routeNumero ?? "");

  useEffect(() => {
    if (routeNumero) {
      setNumero(routeNumero);
      setSubmitted(routeNumero);
    }
  }, [routeNumero]);

  const query = useQuery({
    queryKey: ["verification", submitted],
    queryFn: () => verifyActe(submitted),
    enabled: Boolean(submitted),
    retry: false,
  });

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:py-16">
      <PageHeader
        eyebrow="Vérification publique"
        title="Vérifier un acte"
        description="Saisissez le numéro figurant sur l'acte ou scannez son QR code. Aucune donnée personnelle n'est affichée."
      />

      <Card className="mt-8">
        <CardBody>
          <form
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
            onSubmit={(event) => {
              event.preventDefault();
              setSubmitted(numero.trim());
            }}
          >
            <div className="flex-1">
              <Input
                label="Numéro de l'acte"
                placeholder="2026-00042"
                value={numero}
                onChange={(event) => setNumero(event.target.value)}
                leftIcon={<LuScanLine className="h-4 w-4" aria-hidden="true" />}
              />
            </div>
            <Button
              type="submit"
              leftIcon={<LuSearch className="h-4 w-4" aria-hidden="true" />}
              disabled={!numero.trim()}
            >
              Vérifier
            </Button>
          </form>
        </CardBody>
      </Card>

      {query.isFetching ? (
        <div className="mt-8 flex justify-center">
          <Spinner size="lg" label="Vérification en cours" />
        </div>
      ) : null}

      {query.isError ? (
        <Alert variant="danger" title="Acte introuvable" className="mt-6">
          {getApiErrorMessage(query.error)}
        </Alert>
      ) : null}

      {query.data ? (
        <Card className="mt-6 overflow-hidden">
          <CardHeader
            title={query.data.numero}
            description="Résultat de la vérification"
            action={
              query.data.valide ? (
                <Badge variant="success">
                  <LuCircleCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Valide
                </Badge>
              ) : (
                <Badge variant="danger">
                  <LuCircleX className="h-3.5 w-3.5" aria-hidden="true" />
                  Non valide
                </Badge>
              )
            }
          />
          <CardBody className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge statut={query.data.statut} />
              <span className="text-sm text-ink-soft">{query.data.type}</span>
            </div>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink-soft">
                  Signé le
                </dt>
                <dd className="mt-1 text-sm text-ink">
                  {formatDateTime(query.data.signe_le)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink-soft">
                  Signataire
                </dt>
                <dd className="mt-1 text-sm text-ink">
                  {query.data.signataire ?? "—"}
                </dd>
              </div>
            </dl>
            {query.data.sha256 ? (
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-soft">
                  Empreinte SHA-256
                </p>
                <p className="mt-1 break-all font-mono text-xs text-ink-soft">
                  {query.data.sha256}
                </p>
              </div>
            ) : null}
          </CardBody>
        </Card>
      ) : null}

      <p className="mt-8 text-center text-xs text-ink-soft">
        Vous avez un compte ?{" "}
        <Link to="/connexion" className="font-medium text-primary hover:underline">
          Accéder à votre espace
        </Link>
      </p>
    </div>
  );
}
