import { permanentRedirect } from "next/navigation";

/** The tutor now lives in the learning paths, with progress saved to the account. */
export default function BackendTutorPage() {
  permanentRedirect("/paths/backend-step-tutor");
}
