/**
 * Comparateur de versions.
 * Propriétaire : METAMMO TEUMA DANIELA CLEDYA
 * TODO :
 *  [ ] Brancher sur l'endpoint des versions précédentes.
 *  [ ] Tester les ajouts, suppressions et lignes longues.
 */

import { diffLines, type Change } from "diff";

function lineClass(change: Change): string {
  if (change.added) return "bg-success-soft text-success";
  if (change.removed) return "bg-danger-soft text-danger";
  return "text-ink-soft";
}

export function DiffViewer({
  before,
  after,
  emptyLabel = "Aucune différence entre les deux versions.",
}: {
  before: string;
  after: string;
  emptyLabel?: string;
}) {
  const changes = diffLines(before, after);

  if (changes.length === 1 && !changes[0].added && !changes[0].removed) {
    return <p className="text-sm text-ink-soft">{emptyLabel}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border border-line bg-surface">
      <pre className="min-w-full p-4 font-mono text-xs leading-relaxed">
        {changes.map((change, index) => (
          <span
            key={`${index}-${change.value.slice(0, 12)}`}
            className={`block whitespace-pre-wrap px-2 ${lineClass(change)}`}
          >
            {change.value}
          </span>
        ))}
      </pre>
    </div>
  );
}
