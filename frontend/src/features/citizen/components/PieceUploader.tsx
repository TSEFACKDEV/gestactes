/**
 * Upload des pièces justificatives.
 * Propriétaire : JEUDIEU TSAGUE AUDREY DANIELLE
 *
 * S'appuie sur `FileDropzone` (composant partagé, non modifié). Règles du
 * contrat API : 3 fichiers maximum, 5 Mo par fichier, PDF/JPEG/PNG.
 * La validation reste contrôlée par le serveur (413/422) : celle-ci améliore
 * seulement le retour immédiat.
 */

import { useRef, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { FileDropzone } from "@/components/ui/FileDropzone";
import {
  ACCEPTED_FILE_TYPES,
  MAX_FILES,
  MAX_FILE_SIZE_MB,
} from "@/lib/constants";
import { formatFileSize } from "@/lib/format";

/** Retourne le premier problème bloquant, ou `null` si les pièces sont acceptables. */
export function validatePieces(files: File[]): string | null {
  if (files.length > MAX_FILES) {
    return `Vous pouvez joindre au maximum ${MAX_FILES} fichiers.`;
  }
  for (const file of files) {
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return `Le fichier ${file.name} dépasse ${MAX_FILE_SIZE_MB} Mo.`;
    }
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      return `Le format de ${file.name} n'est pas accepté (PDF, JPEG ou PNG uniquement).`;
    }
  }
  return null;
}

export function PieceUploader({
  files,
  onChange,
  onError,
  uploadProgress = null,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  /** Reçoit chaque refus, par exemple pour un récapitulatif global. */
  onError?: (message: string) => void;
  /** Progression de l'envoi (0-100) ; `null` hors envoi. */
  uploadProgress?: number | null;
}) {
  const [messages, setMessages] = useState<string[]>([]);
  // `FileDropzone` signale les refus puis appelle toujours `onChange` dans le
  // même tour : on regroupe les messages pour ne pas les effacer aussitôt.
  const pending = useRef<string[]>([]);

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  return (
    <div className="space-y-3">
      <FileDropzone
        files={files}
        onError={(message) => {
          pending.current.push(message);
          onError?.(message);
        }}
        onChange={(next) => {
          setMessages(pending.current);
          pending.current = [];
          onChange(next);
        }}
      />

      {messages.length > 0 ? (
        <Alert variant="danger" title="Certaines pièces n'ont pas été ajoutées">
          <ul className="list-disc space-y-0.5 pl-4">
            {messages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </Alert>
      ) : null}

      <p className="text-xs text-ink-soft" aria-live="polite">
        {files.length} / {MAX_FILES} fichier{files.length > 1 ? "s" : ""} joint
        {files.length > 1 ? "s" : ""}
        {files.length > 0 ? ` — ${formatFileSize(totalSize)}` : ""}
      </p>

      {uploadProgress !== null ? (
        <div>
          <div
            role="progressbar"
            aria-label="Envoi des pièces"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={uploadProgress}
            className="h-1.5 overflow-hidden rounded-full bg-surface-muted"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-150"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-ink-soft">Envoi en cours… {uploadProgress} %</p>
        </div>
      ) : null}
    </div>
  );
}
