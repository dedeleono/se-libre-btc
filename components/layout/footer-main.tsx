import Link from "next/link";
import React from "react";
// import FooterCards from "../footercards/page";
import Logo from "./logo";

const Footer = () => {
  return (
    <footer className="bg-muted/5 text-muted pt-16 backdrop-blur-sm font-['Open_Sans'] border-t-2 border-primary/10">
      <div className="container md:max-w-[95rem] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-24">
          {/* Logo and Description Section */}
          <div className="md:col-span-6 space-y-6">
            <div className="w-48 transition-transform duration-300 hover:scale-105">
              <Logo width={192} height={48} className="w-full h-auto" />
            </div>
            {/* <p className="text-muted-foreground leading-relaxed w-full">
              description
            </p> */}
          </div>

          {/* Sitemap Section */}
          <div className="md:col-span-3">
            <h2 className="text-foreground text-xl font-semibold mb-6 relative after:content-[''] after:absolute after:-bottom-2 after:left-0 after:w-12 after:h-1 after:bg-primary">
              Home
            </h2>
            <nav className="space-y-4">
              <Link
                href="/"
                className="block text-muted-foreground hover:text-foreground transition-all duration-300 hover:translate-x-2"
              >
                Inicio
              </Link>
              <Link
                href="/about"
                className="block text-muted-foreground hover:text-foreground transition-all duration-300 hover:translate-x-2"
              >
                Acerca de Nosotros
              </Link>
              <Link
                href="/contact"
                className="block text-muted-foreground hover:text-foreground transition-all duration-300 hover:translate-x-2"
              >
                Contáctanos
              </Link>
            </nav>
          </div>

          {/* Follow Us Section */}
          <div className="md:col-span-3">
            <h2 className="text-foreground text-xl font-semibold mb-6 relative after:content-[''] after:absolute after:-bottom-2 after:left-0 after:w-12 after:h-1 after:bg-primary">
              Siguenos
            </h2>
            <nav className="space-y-4">
              <Link
                href="#"
                className="group flex items-center text-muted-foreground hover:text-foreground transition-all duration-300"
              >
                <span className="inline-block transition-transform duration-300 group-hover:translate-x-2">
                  Instagram
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-2 opacity-0 transition-all duration-300 group-hover:opacity-100"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
              <Link
                href="#"
                className="group flex items-center text-muted-foreground hover:text-foreground transition-all duration-300"
              >
                <span className="inline-block transition-transform duration-300 group-hover:translate-x-2">
                  TikTok
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-2 opacity-0 transition-all duration-300 group-hover:opacity-100"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </nav>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="py-4 border-t border-border/30 flex items-center justify-center ">
          <p className="text-muted-foreground text-xs m-0">
            © 2025 Colegio Saber Ver. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
