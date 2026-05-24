"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";

const HeroSection = () => {
    return (
      <div className="relative min-h-[600px] h-screen">
        <div className="absolute inset-0">
          <Image
            src="/students.webp"
            alt="Students learning"
            fill
            className="object-cover brightness-[0.85] dark:brightness-[0.7]"
            priority
            sizes="100vw"
          />
        </div>

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 h-full flex items-center">
          <div className="flex flex-col items-center text-center font-['Open_Sans']">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold tracking-tight text-white sm:text-6xl max-w-3xl"
            >
              Aprende y domina el desarrollo moderno
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6 text-lg leading-8 text-gray-100 max-w-2xl"
            >
              Únete a nuestra comunidad de estudiantes y eleva tus habilidades
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-10 flex gap-x-6"
            >
              <Link
                href="/checkout"
                className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-white rounded-lg transition-all duration-300 transform hover:scale-[1.015] bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500/90 dark:hover:bg-emerald-600/90 shadow-lg hover:shadow-emerald-500/25"
              >
                Comenzar
                <ArrowRight className="w-5 h-5" />
              </Link>
              {/* <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-white rounded-lg transition-all duration-300 transform hover:scale-[1.015] bg-sky-700 hover:bg-sky-800 dark:bg-sky-600/90 dark:hover:bg-sky-700/90 shadow-lg hover:shadow-sky-500/25"
              >
                Más información
                <Info className="w-5 h-5" />
              </Link> */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="inline-flex items-center gap-2 px-6 py-7 text-base font-semibold text-white rounded-lg transition-all duration-300 transform hover:scale-[1.015] bg-sky-700 hover:bg-sky-800 dark:bg-sky-600/90 dark:hover:bg-sky-700/90 shadow-lg hover:shadow-sky-500/25">
                    Ver Tutorial
                    <Info className="w-5 h-5" />
                  </Button>
                </DialogTrigger>

                {/* Modal with iFrame */}
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">
                      Como inscribirte utilizando nuestra plataforma
                    </DialogTitle>
                  </DialogHeader>

                  {/* Embedded iFrame */}
                  <div className="relative w-full h-96">
                    <iframe
                      width="100%"
                      height="400px"
                      src="https://dubble.so/guides/como-inscribirte-75vmd82feuerl3r4sgma?embed=1"
                    ></iframe>
                  </div>
                </DialogContent>
              </Dialog>
            </motion.div>
          </div>
        </div>
      </div>
    );
};

export default HeroSection;
