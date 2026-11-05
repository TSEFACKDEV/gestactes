/**
 * Types partagés de l'application.
 * Propriétaire : TSEFACK CALVIN KLEIN (contrat gelé).
 * Les membres définissent leurs types locaux dans leur feature si nécessaire.
 * TODO : maintenir l'alignement avec docs/api-contract.md et ajouter les tests.
 */

export type Role = "citoyen" | "agent" | "validateur" | "admin";

export type Statut =
  | "demandee"
  | "en_instruction"
  | "en_validation"
  | "validee"
  | "signee"
  | "archivee"
  | "rejetee"
  | "annulee";

export interface UserSummary {
  id: number;
  first_name: string;
  last_name: string;
  role: Role;
}

export interface User extends UserSummary {
  email: string;
  is_active: boolean;
  created_at: string;
  /** Alias utilisés par les pages publiques / profil. */
  nom: string;
  prenom: string;
  actif: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface SelectOption {
  value: string;
  label: string;
}

export type FieldType =
  | "text"
  | "textarea"
  | "date"
  | "number"
  | "select"
  | "checkbox"
  | "file";

export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string | null;
  help?: string | null;
  options?: SelectOption[] | null;
}

export interface TypeActeSummary {
  id: number;
  code: string;
  label: string;
}

export interface TypeActe extends TypeActeSummary {
  description: string;
  form_schema: FormField[];
  template_md: string;
  is_active: boolean;
}

export interface PieceJointe {
  id: number;
  filename: string;
  content_type: string;
  size_bytes: number;
  sha256: string;
  created_at: string;
}

export interface DemandeListItem {
  id: number;
  numero: string;
  type: TypeActeSummary;
  demandeur: UserSummary;
  statut: Statut;
  assigned_agent: UserSummary | null;
  pr_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface SignatureManifest {
  numero: string;
  sha256_acte_json: string;
  sha256_acte_md: string;
  signataire: {
    id: number;
    nom: string;
    prenom: string;
    role: Role;
  };
  signe_le: string;
  algorithme: string;
  version: number;
}

export interface Demande extends DemandeListItem {
  donnees: Record<string, unknown>;
  acte_md: string | null;
  issue_number: number | null;
  issue_url: string | null;
  branch_name: string | null;
  pr_number: number | null;
  assigned_validator: UserSummary | null;
  complement_attendu: boolean;
  complement_message: string | null;
  rejection_reason: string | null;
  signature: SignatureManifest | null;
  signed_at: string | null;
  merge_commit_sha: string | null;
  tag_name: string | null;
  pieces: PieceJointe[];
}

export interface SignatureResult {
  demande: Demande;
  signature: SignatureManifest;
  merge_commit_sha: string;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  demande_id: number | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationList {
  items: Notification[];
  unread_count: number;
}

export interface HistoriqueItem {
  type: "commit" | "audit";
  action: string;
  actor: string;
  message: string;
  sha: string | null;
  created_at: string;
}

export interface DemandeDiff {
  before: string;
  after: string;
}

export interface AuditEvent {
  id: number;
  demande_id: number | null;
  actor: UserSummary | null;
  action: string;
  details: Record<string, unknown>;
  commit_sha: string | null;
  created_at: string;
}

export interface Stats {
  total: number;
  par_statut: Record<Statut, number>;
  par_type: Record<string, number>;
  delai_moyen_heures: number;
}

export interface Verification {
  valide: boolean;
  numero: string;
  type: string;
  statut: Statut;
  signe_le: string | null;
  signataire: string | null;
  sha256: string | null;
}

export interface DemandeCreatePayload {
  type_code: string;
  donnees: Record<string, unknown>;
}

export type DecisionType = "approuver" | "demander_corrections" | "rejeter";

export interface ApiErrorResponse {
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, string>;
    request_id?: string;
  };
  detail?: string;
}
