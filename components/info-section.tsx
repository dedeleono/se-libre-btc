"use client";

import { BookOpen, File, Computer } from "lucide-react";

import React from "react";
import { motion } from "framer-motion";
import { useLocale } from "@/lib/i18n";

const InfoSection = () => {
  const { t } = useLocale();
  const features = [
    {
      title: t.public.features[0].title,
      description: t.public.features[0].description,
      icon: BookOpen,
    },
    {
      title: t.public.features[1].title,
      description: t.public.features[1].description,
      icon: File,
    },
    {
      title: t.public.features[2].title,
      description: t.public.features[2].description,
      icon: Computer,
    },
  ];
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2 }}
            className="group relative rounded-2xl dark:bg-background/30 backdrop-blur-lg dark:border-accent/10 dark:border-2 bg-white p-6 shadow-lg transition-all hover:shadow-xl font-['Open_Sans']"
          >
            <div className="absolute -inset-px bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 transition-opacity group-hover:opacity-10 rounded-2xl" />
            <feature.icon className="h-8 w-8 text-emerald-600" />
            <h3 className="mt-4 text-xl font-bold text-nowrap">{feature.title}</h3>
            <p className="mt-2 text-gray-600 text-sm">{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default InfoSection;
