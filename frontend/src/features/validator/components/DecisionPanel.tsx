/**
 * Panneau de décision du validateur.
 * Propriétaire : METAMMO TEUMA DANIELA CLEDYA
 * TODO :
 *  [ ] Tester le commentaire obligatoire en cas de rejet.
 *  [ ] Ajouter un aperçu des conséquences de chaque décision.
 */

import { useState } from "react";
import { LuCircleCheck, LuCircleX, LuPencilLine } from "react-icons/lu";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import { DECISION_LABELS } from "@/lib/constants";
import type { DecisionType } from "@/types";

const DECISIONS: Array<{
  value: DecisionType;
  icon: typeof LuCircleCheck;
  variant: "primary" | "secondary" | "danger";
  description: string;
}> = [
  {
    value: "approuver",
    icon: LuCircleCheck,
    variant: "primary",
    description: "L'acte passe à l'état validé et pourra être signé.",
  },
  {
    value: "demander_corrections",
    icon: LuPencilLine,
    variant: "secondary",
    description: "L'acte retourne en instruction. La PR reste ouverte.",
  },
  {
    value: "rejeter",
    icon: LuCircleX,
    variant: "danger",
    description: "La demande est rejetée et la PR est fermée.",
  },
];

export function DecisionPanel({
  onSubmit,
  isPending,
}: {
  onSubmit: (decision: DecisionType, comment: string) => void;
  isPending: boolean;
}) {
  const [decision, setDecision] = useState<DecisionType>("approuver");
  const [comment, setComment] = useState("");
  const requiresComment = decision !== "approuver";
  const canSubmit = !requiresComment || comment.trim().length >= 3;

  return (
    <Card>
      <CardHeader
        title="Décision"
        description="Choisissez une décision et motivez-la si nécessaire."
      />
      <CardBody className="space-y-4">
        <div className="space-y-2">
          {DECISIONS.map((item) => {
            const Icon = item.icon;
            const active = decision === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setDecision(item.value)}
                className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition ${
                  active
                    ? "border-primary bg-primary-soft/50"
                    : "border-line bg-surface hover:bg-surface-muted"
                }`}
              >
                <Icon
                  className={`mt-0.5 h-5 w-5 shrink-0 ${
                    active ? "text-primary" : "text-ink-soft"
                  }`}
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-medium text-ink">
                    {DECISION_LABELS[item.value]}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {requiresComment ? (
          <Alert variant="warning">
            Un commentaire motivé est obligatoire pour cette décision.
          </Alert>
        ) : null}

        <Textarea
          label={requiresComment ? "Commentaire motivé" : "Commentaire (facultatif)"}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={4}
          placeholder="Expliquez votre décision au demandeur et à l'agent."
        />
      </CardBody>
      <CardFooter>
        <Button
          variant={decision === "rejeter" ? "danger" : "primary"}
          isLoading={isPending}
          disabled={!canSubmit}
          onClick={() => onSubmit(decision, comment.trim())}
        >
          Confirmer la décision
        </Button>
      </CardFooter>
    </Card>
  );
}
