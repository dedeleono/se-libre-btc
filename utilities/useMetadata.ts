import { Metadata } from "next";

export function constructMetadata({
    title = `Se Libre - Aprende, Colabora y destapa tu creatividad.`,
    description = `Aprende a tu ritmo; como quieras, desde donde quieras, en tu horario.`,
    image = "",
    icons = [
        {
            rel: "apple-touch-icon",
            sizes: "32x32",
            url: "/apple-touch-icon.png",
        },
        {
            rel: "icon",
            type: "image/png",
            sizes: "32x32",
            url: "/favicon-32x32.png",
        },
        {
            rel: "icon",
            type: "image/png",
            sizes: "16x16",
            url: "/favicon-16x16.png",
        },
    ],
    noIndex = false,
    keywords = "Colegio, Conocimiento, Doc, Proyecto, Trabaja, Tarea, Quiz, Todo en uno, Gestión, Herramienta, Software, Herramienta en línea",
}: {
    title?: string;
    description?: string;
    image?: string;
    icons?: Metadata["icons"];
    noIndex?: boolean;
    keywords?: string;
} = {}): Metadata {
    return {
        title,
        description,
        keywords,
        openGraph: {
            title,
            description,
            images: [
                {
                    url: image,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [image],
            creator: "@mm_gojan",
        },
        icons,
        metadataBase: new URL("https://saber-ver-v2.vercel.app/"),
        ...(noIndex && {
            robots: {
                index: false,
                follow: false,
            },
        }),
    };
}
