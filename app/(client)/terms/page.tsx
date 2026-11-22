import LegalDocumentPage, { legalMetadata } from "@/components/legal/legal-document";

export function generateMetadata() {
  return legalMetadata("terms");
}

export default function TermsPage() {
  return <LegalDocumentPage document="terms" />;
}
