/**
 * Upload des pièces justificatives.
 * Propriétaire : JEUDIEU TSAGUE AUDREY DANIELLE
 * TODO : brancher les données réelles et couvrir les états d'erreur.
 */

import { FileDropzone } from "@/components/ui/FileDropzone";

export function PieceUploader({
  files,
  onChange,
  onError,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  onError?: (message: string) => void;
}) {
  return (
    <FileDropzone files={files} onChange={onChange} onError={onError} />
  );
}
