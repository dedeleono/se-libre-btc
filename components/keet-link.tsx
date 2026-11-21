"use client";

import { MessageCircle } from "lucide-react";

import { useLocale } from "@/lib/i18n";

interface KeetLinkProps {
  communityUrl: string;
  position?: "bottom-right" | "bottom-left";
}

const KeetLink: React.FC<KeetLinkProps> = ({
  communityUrl,
  position = "bottom-right",
}) => {
  const { t } = useLocale();
  const positionStyles = {
    "bottom-right": "right-4",
    "bottom-left": "left-4",
  };

  return (
    <a
      href={communityUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed bottom-4 ${positionStyles[position]} z-50 flex h-14 w-14 items-center justify-center rounded-[2px] border-2 border-foreground bg-primary text-primary-foreground shadow-[3px_3px_0_hsl(var(--foreground))] transition-transform duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 dark:shadow-[3px_3px_0_var(--naranja-500)]`}
      aria-label={t.common.joinKeetCommunity}
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
};

export default KeetLink;
