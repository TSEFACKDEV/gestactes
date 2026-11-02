/**
 * Dépôt de fichiers.
 * Propriétaire : GUEMOGNE GERALDINE ESTHER
 * TODO :
 *  [ ] Vérifier le type MIME réel côté client (indicatif seulement).
 *  [ ] Tester le glisser-déposer et le clavier.
 */

import { useId, useRef, useState, type DragEvent } from "react";
import { LuCloudUpload, LuFileText, LuX } from "react-icons/lu";

import { ACCEPTED_FILE_TYPES, MAX_FILES, MAX_FILE_SIZE_MB } from "@/lib/constants";
import { formatFileSize } from "@/lib/format";
import { cn } from "@/lib/utils";

export function FileDropzone({
  files,
  onChange,
  onError,
  maxFiles = MAX_FILES,
  maxSizeMb = MAX_FILE_SIZE_MB,
  accept = ACCEPTED_FILE_TYPES.join(","),
}: {
  files: File[];
  onChange: (files: File[]) => void;
  onError?: (message: string) => void;
  maxFiles?: number;
  maxSizeMb?: number;
  accept?: string;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function addFiles(incoming: FileList | File[]) {
    const next = [...files];
    for (const file of Array.from(incoming)) {
      if (next.length >= maxFiles) {
        onError?.(`Vous pouvez joindre au maximum ${maxFiles} fichiers.`);
        break;
      }
      if (file.size > maxSizeMb * 1024 * 1024) {
        onError?.(`Le fichier ${file.name} dépasse ${maxSizeMb} Mo.`);
        continue;
      }
      if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
        onError?.(`Le format de ${file.name} n'est pas accepté.`);
        continue;
      }
      if (!next.some((current) => current.name === file.name && current.size === file.size)) {
        next.push(file);
      }
    }
    onChange(next);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (event.dataTransfer.files.length > 0) addFiles(event.dataTransfer.files);
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-8 text-center transition",
          dragging
            ? "border-primary bg-primary-soft"
            : "border-line bg-surface hover:border-primary/40",
        )}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
          <LuCloudUpload className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="mt-3 text-sm font-medium text-ink">
          Glissez vos pièces ici ou{" "}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-primary underline-offset-4 hover:underline"
          >
            parcourez vos fichiers
          </button>
        </p>
        <p className="mt-1 text-xs text-ink-soft">
          PDF, JPEG ou PNG — {maxSizeMb} Mo maximum par fichier, {maxFiles} fichiers maximum.
        </p>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          multiple
          accept={accept}
          className="sr-only"
          onChange={(event) => {
            if (event.target.files) addFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {files.length > 0 ? (
        <ul className="space-y-2">
          {files.map((file) => (
            <li
              key={`${file.name}-${file.size}`}
              className="flex items-center gap-3 rounded-md border border-line bg-surface px-3 py-2"
            >
              <LuFileText className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink">{file.name}</p>
                <p className="text-xs text-ink-soft">{formatFileSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => onChange(files.filter((item) => item !== file))}
                className="rounded-md p-1 text-ink-soft transition hover:bg-surface-muted hover:text-danger"
                aria-label={`Retirer ${file.name}`}
              >
                <LuX className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
