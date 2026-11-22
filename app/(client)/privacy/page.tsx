import LegalDocumentPage, { legalMetadata } from "@/components/legal/legal-document";

export function generateMetadata() {
  return legalMetadata("privacy");
}

export default function PrivacyPage() {
  return <LegalDocumentPage document="privacy" />;
}
