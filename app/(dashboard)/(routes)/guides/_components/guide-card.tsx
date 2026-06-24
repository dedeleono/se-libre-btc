"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ReactNode } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; 
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { ImageIcon, Search } from "lucide-react";
import Image from "next/image";
import { useLocale } from "@/lib/i18n";

interface GuideContent {
  title: string;
  description: string;
  embedUrl: string;
}

interface GuideCardProps {
  guides: GuideContent[];
}

const ExpandableGuideCards = ({
  guides,
}: {
  guides: { embedUrl: string, title: string, description: string, imageUrl?: string }[];
}) => {
  const { t } = useLocale();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredGuides = guides.filter(
    (guide) =>
      guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="relative w-full max-w-md mx-auto">
        <Input
          type="text"
          placeholder={t.public.searchGuide}
          className="w-full p-4 pl-12 pr-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-foreground/5 dark:text-white dark:border-border backdrop-blur-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
          <Search className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredGuides.length > 0 ? (
          filteredGuides.map((guide, index) => (
            <Dialog key={index}>
              <DialogTrigger asChild>
                <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 rounded-xl overflow-hidden border hover:border-primary/20 dark:hover:border-primary/30">
                  {/* Thumbnail Image */}
                  {guide.imageUrl ? (
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={guide.imageUrl}
                        alt={guide.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        width={500}
                        height={500}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                  ) : (
                    <div className="h-48 flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20">
                      <ImageIcon className="w-12 h-12 text-primary/40" />
                    </div>
                  )}

                  {/* Card Content */}
                  <CardHeader className="p-6">
                    <CardTitle className="text-xl font-semibold text-foreground dark:text-white group-hover:text-primary transition-colors">
                      {guide.title}
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground line-clamp-2">
                      {guide.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </DialogTrigger>

              {/* Modal Pop-Up */}
              <DialogContent className="max-w-5xl bg-white dark:bg-background rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-foreground dark:text-white">{guide.title}</h2>
                </div>
                <div className="relative rounded-lg overflow-hidden border">
                  <iframe
                    src={guide.embedUrl}
                    width="100%"
                    height="600"
                    className="border-0"
                    allowFullScreen
                    frameBorder="0"
                  />
                </div>
              </DialogContent>
            </Dialog>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <ImageIcon className="w-16 h-16 text-muted-foreground/40" />
              <p className="text-lg font-medium text-muted-foreground">
                No se encontraron guías que coincidan con tu búsqueda
              </p>
              <p className="text-sm text-muted-foreground/60">
                Intenta con diferentes términos de búsqueda
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpandableGuideCards;
