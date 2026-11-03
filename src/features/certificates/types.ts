export type CertificateStatus = "ACHIEVED" | "STUDYING" | "PLANNED";

/** A certificate as the dashboard lists it. Dates are `YYYY-MM-DD`. */
export interface CertificateSummary {
  id: string;
  name: string;
  issuer: string;
  status: CertificateStatus;
  imageUrl: string | null;
  credentialId: string | null;
  score: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  /** When studying began, or is planned to begin. */
  startDate: string | null;
  /** When the learner expects to finish. */
  targetDate: string | null;
  /** From the linked study list's steps once it has any; otherwise what the learner typed. */
  progress: number;
  /** The study list ("Danh sách học") this certificate is studied with. */
  studyList: LinkedStudyList | null;
}

export interface LinkedStudyList {
  id: string;
  title: string;
  stepCount: number;
  doneStepCount: number;
  progress: number;
}

export interface CertificateResource {
  id: string;
  title: string;
  url: string;
}

export interface CertificateDetail extends CertificateSummary {
  verifyUrl: string | null;
  notes: string | null;
  createdAt: string;
  resources: CertificateResource[];
}

/** What the form sends; an empty string clears an optional field. */
export interface CertificateInput {
  name: string;
  issuer: string;
  status: CertificateStatus;
  imageUrl?: string;
  credentialId?: string;
  verifyUrl?: string;
  score?: string;
  issuedAt?: string;
  expiresAt?: string;
  startDate?: string;
  targetDate?: string;
  progress?: number;
  notes?: string;
  /** The study list to link; an empty string unlinks. */
  studyListId?: string;
}
