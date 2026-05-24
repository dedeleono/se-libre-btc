import { Preview } from "@/components/preview";

interface TruncatedPreviewProps {
  value: string;
  maxLength?: number;
}

export const TruncatedPreview = ({
  value,
  maxLength = 100,
}: TruncatedPreviewProps) => {
  // Check if the value is JSON
  const isJsonString = (str: string) => {
    try {
      const result = JSON.parse(str);
      return typeof result === 'object' && result !== null;
    } catch (e) {
      return false;
    }
  };

  // Remove HTML tags and decode HTML entities
  const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  };

  // If it's JSON that starts with {"root":, return a placeholder
  if (value && typeof value === 'string' && value.startsWith('{"root":')) {
    return <div className="line-clamp-1 italic text-muted-foreground">Contenido de pregunta</div>;
  }

  const plainText = stripHtml(value);
  const truncated =
    plainText.length > maxLength
      ? `${plainText.substring(0, maxLength)}...`
      : plainText;

  return <div className="line-clamp-1">{truncated}</div>;
};
