import { FileText, Download, FileDownIcon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface ResourcesCardProps {
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
  }>;
}

export const ResourcesCard = ({ attachments }: ResourcesCardProps) => {
  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          <Label
            htmlFor="resources"
            className="text-sm font-semibold flex items-center gap-x-2"
          >
            <FileDownIcon className="h-4 w-4" />
            Recursos
          </Label>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {attachments && attachments.length > 0 && (
          <div className="space-y-2">
            {/* <h3 className="text-sm font-medium">Additional Materials</h3> */}
            <div className="space-y-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center p-3 w-full bg-[hsl(var(--primary)/0.1)] border-[var(--naranja-500)] border text-[var(--terracota-700)] rounded-md"
                >
                  <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="text-sm line-clamp-1 flex-1">
                    {attachment.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2"
                    onClick={() => window.open(attachment.url, "_blank")}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
