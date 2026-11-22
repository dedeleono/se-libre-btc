import type { Locale } from "@/lib/i18n/messages";

/** Both documents carry one shared date. Change it whenever either text changes. */
export const LEGAL_UPDATED_AT = "2026-11-22";

export const SUPPORT_EMAIL = "soporte@guatelibre.org";

export const legalDocumentKeys = ["terms", "privacy"] as const;
export type LegalDocumentKey = (typeof legalDocumentKeys)[number];

export const legalDocumentPaths: Record<LegalDocumentKey, `/${string}`> = {
  terms: "/terms",
  privacy: "/privacy",
};

/** A string is a paragraph; an array of strings is a bulleted list. */
export type LegalBlock = string | readonly string[];

export type LegalSection = {
  /** Anchor id. It stays the same in every locale so shared links keep working. */
  id: string;
  heading: string;
  blocks: readonly LegalBlock[];
};

export type LegalDocument = {
  title: string;
  summary: string;
  sections: readonly LegalSection[];
};

const es: Record<LegalDocumentKey, LegalDocument> = {
  terms: {
    title: "Términos del servicio",
    summary:
      "Estas reglas explican cómo puedes usar Dinero Libre, la plataforma gratuita de educación sobre Bitcoin y soberanía financiera de Se Libre. Al crear una cuenta o usar la plataforma, aceptas estos términos.",
    sections: [
      {
        id: "service",
        heading: "Qué es Dinero Libre",
        blocks: [
          "Dinero Libre es una plataforma de educación en línea operada por Se Libre, una organización de Guatemala. Ofrece cursos, rutas de aprendizaje, cohortes con sesiones en vivo, cuestionarios, certificados y un foro.",
          "El acceso a los cursos es gratuito. Si algún día ofrecemos contenido de pago, verás el precio antes de pagar.",
        ],
      },
      {
        id: "not-financial-advice",
        heading: "Educación, no asesoría financiera",
        blocks: [
          "Todo el contenido tiene fines educativos. No es asesoría financiera, de inversión, legal ni fiscal, ni una recomendación para comprar, vender o guardar Bitcoin ni ningún otro activo.",
          [
            "El precio de Bitcoin cambia mucho y puedes perder dinero.",
            "Si pierdes tus claves privadas o tu frase de recuperación, nadie puede recuperar tus fondos, tampoco nosotros.",
            "Las decisiones sobre tu dinero son tuyas. Si lo necesitas, consulta a una persona profesional.",
          ],
          "Nunca te pediremos tus claves privadas, tu frase de recuperación ni que nos envíes fondos. Si alguien lo hace en nuestro nombre, es una estafa.",
        ],
      },
      {
        id: "account",
        heading: "Tu cuenta",
        blocks: [
          "Entras con un enlace que enviamos a tu correo o con tu cuenta de Google. Cuida el acceso a tu correo: quien lo controle puede entrar a tu cuenta.",
          "Tu cuenta es personal; no la compartas. Usa datos verdaderos en tu perfil, porque tu nombre aparece en tus certificados y en lo que publicas en el foro.",
        ],
      },
      {
        id: "minors",
        heading: "Menores de edad",
        blocks: [
          "La plataforma es para personas de 13 años o más. Si tienes entre 13 y 17 años, necesitas el permiso de tu madre, padre o tutor para crear una cuenta, y te recomendamos que una persona adulta te acompañe mientras aprendes.",
          "Tu madre, padre o tutor puede escribirnos para revisar o cerrar tu cuenta.",
        ],
      },
      {
        id: "conduct",
        heading: "Normas de convivencia",
        blocks: [
          "En el foro, en los comentarios de los capítulos y en cualquier otro espacio donde participes:",
          [
            "Trata a las demás personas con respeto. No acoses, amenaces ni discrimines a nadie.",
            "No publiques spam, publicidad ni enlaces engañosos.",
            "No promuevas estafas, esquemas de inversión ni ganancias garantizadas.",
            "No pidas ni compartas claves privadas, frases de recuperación ni datos personales de otras personas.",
            "No publiques contenido ilegal, sexual o violento, ni contenido que no tienes derecho a compartir.",
            "No intentes entrar a cuentas ajenas ni interferir con el funcionamiento de la plataforma.",
          ],
          "Podemos quitar el contenido que no cumpla estas normas y suspender o cerrar, de forma temporal o definitiva, las cuentas que las incumplan.",
        ],
      },
      {
        id: "your-content",
        heading: "Lo que publicas",
        blocks: [
          "Lo que escribes en el foro y en los comentarios sigue siendo tuyo. Al publicarlo, nos permites mostrarlo dentro de la plataforma a las personas que tienen acceso a ese espacio.",
          "Tus notas personales en los capítulos son para ti: no las mostramos a otras personas en la plataforma.",
        ],
      },
      {
        id: "intellectual-property",
        heading: "Propiedad intelectual",
        blocks: [
          "Los cursos, videos, textos, cuestionarios, diseños y la marca Dinero Libre pertenecen a Se Libre o a quienes los crearon y nos permiten usarlos.",
          "Puedes usarlos para tu aprendizaje personal y compartir enlaces a la plataforma. No los copies, vendas ni publiques en otro lugar sin nuestro permiso por escrito.",
          "Algunos videos se muestran desde YouTube; al verlos, también aplican las condiciones de YouTube.",
        ],
      },
      {
        id: "certificates",
        heading: "Certificados",
        blocks: [
          "Recibes un certificado cuando completas un curso y obtienes 100 % en su examen final. Los datos del certificado quedan fijos al emitirse.",
          "Cada certificado tiene un código único y una página pública de verificación que muestra el nombre en el certificado, el curso y la fecha de emisión.",
          "Podemos revocar un certificado si se emitió por error, si no cumplía los requisitos del curso o si se obtuvo con trampa o con la cuenta de otra persona. Un certificado revocado deja de aparecer como válido en su página de verificación.",
          "El certificado reconoce que completaste un curso de Dinero Libre. No es un título académico oficial ni una certificación profesional.",
        ],
      },
      {
        id: "availability",
        heading: "Disponibilidad",
        blocks: [
          "Trabajamos para que la plataforma funcione bien, pero puede tener fallas, pausas por mantenimiento o interrupciones. Podemos cambiar, agregar o retirar cursos y funciones.",
          "Como el servicio es gratuito, no garantizamos que esté disponible siempre ni que esté libre de errores.",
        ],
      },
      {
        id: "liability",
        heading: "Límites de responsabilidad",
        blocks: [
          "Ofrecemos la plataforma y su contenido tal como están. En la medida en que la ley lo permita, Se Libre no responde por pérdidas de dinero, de bitcoin o de datos que resulten de decisiones que tomes con base en el contenido, ni por daños indirectos por usar la plataforma o no poder usarla.",
          "Nada de esto limita los derechos que la ley te reconoce y que no se pueden renunciar.",
        ],
      },
      {
        id: "closing",
        heading: "Cierre de cuenta",
        blocks: [
          `Puedes dejar de usar la plataforma cuando quieras y pedirnos que cerremos tu cuenta escribiendo a ${SUPPORT_EMAIL}. También podemos cerrar una cuenta que incumpla estos términos.`,
        ],
      },
      {
        id: "changes",
        heading: "Cambios a estos términos",
        blocks: [
          "Podemos actualizar estos términos. Cuando lo hagamos, cambiaremos la fecha de «Última actualización» al inicio de esta página, y si el cambio es importante, te avisaremos en la plataforma o por correo.",
          "Si sigues usando la plataforma después de un cambio, aceptas la nueva versión.",
        ],
      },
      {
        id: "law",
        heading: "Ley aplicable",
        blocks: ["Estos términos se rigen por las leyes de la República de Guatemala."],
      },
      {
        id: "contact",
        heading: "Contacto",
        blocks: [`Si tienes preguntas sobre estos términos, escríbenos a ${SUPPORT_EMAIL}.`],
      },
    ],
  },
  privacy: {
    title: "Política de privacidad",
    summary:
      "Aquí explicamos qué datos recopila Dinero Libre, para qué los usamos, quién puede verlos y qué puedes hacer con ellos. No vendemos tus datos ni mostramos publicidad.",
    sections: [
      {
        id: "responsible",
        heading: "Quién es responsable",
        blocks: [
          `Dinero Libre es operada por Se Libre, una organización de Guatemala. Se Libre decide cómo se usan los datos de la plataforma. Para cualquier tema de privacidad, escríbenos a ${SUPPORT_EMAIL}.`,
        ],
      },
      {
        id: "data-we-collect",
        heading: "Qué datos recopilamos",
        blocks: [
          "Datos de tu cuenta y tu perfil:",
          [
            "Tu correo electrónico, que necesitas para entrar.",
            "Tu nombre.",
            "Tu rango de edad, tu país y, si aplica, tu región o departamento, que te pedimos al completar tu perfil.",
            "Tu número de teléfono, solo si decides agregarlo.",
            "Tu foto de perfil, si la subes. Si entras con Google, usamos la foto de tu cuenta de Google.",
          ],
          "Datos de tu aprendizaje:",
          [
            "Los cursos, rutas y cohortes en los que te inscribes.",
            "Tu progreso en cada capítulo.",
            "Tus intentos en los cuestionarios: respuestas, puntajes y fechas.",
            "Tus certificados: nombre en el certificado, curso, fecha, puntaje del examen final y código.",
            "Las notas personales que escribes en los capítulos.",
            "Lo que publicas en el foro y en los comentarios de los capítulos, y qué publicaciones del foro has visto.",
            "Las notificaciones que recibes en la plataforma y si ya las leíste.",
          ],
          "Datos de inicio de sesión: cada vez que entras, guardamos una sesión con su fecha de vencimiento, tu dirección IP y el tipo de navegador y dispositivo que usas. Si entras con Google, guardamos el identificador de tu cuenta de Google y los permisos de acceso que Google nos entrega para iniciar tu sesión.",
          "Pagos: si compras un contenido de pago, guardamos el monto, el producto, el estado del pago y tu correo. Los datos de tu tarjeta los recibe Recurrente, nuestro proveedor de pagos; nosotros no los guardamos.",
          "Mensajes: si usas el formulario de contacto, recibimos por correo tu nombre, tu correo y tu mensaje.",
        ],
      },
      {
        id: "how-we-use-it",
        heading: "Para qué usamos tus datos",
        blocks: [
          [
            "Crear tu cuenta y permitirte entrar.",
            "Mostrarte tus cursos, guardar tu progreso y calificar tus cuestionarios.",
            "Emitir tus certificados y permitir que otras personas los verifiquen.",
            "Hacer funcionar el foro y los comentarios.",
            "Enviarte los correos del servicio: el enlace para entrar, invitaciones y avisos sobre tus cursos y cohortes. El equipo también puede enviar correos informativos a grupos de estudiantes.",
            "Entender quién usa la plataforma, por ejemplo cuántas personas hay por rango de edad o país, para mejorar los cursos.",
            "Proteger la plataforma, prevenir abusos y cumplir la ley.",
          ],
          "No vendemos tus datos, no mostramos publicidad y no usamos herramientas de analítica de terceros.",
        ],
      },
      {
        id: "who-can-see-it",
        heading: "Quién puede ver tu información",
        blocks: [
          [
            "Las personas inscritas en el mismo curso, ruta o cohorte pueden ver tu nombre, tu foto y lo que publicas en el foro y en los comentarios.",
            "Cualquier persona con el código o el enlace de tu certificado puede ver su página de verificación, con el nombre en el certificado, el curso y la fecha de emisión.",
            "El equipo de Se Libre que administra la plataforma puede ver tu perfil, tus inscripciones, tu progreso y tus resultados, para dar seguimiento y soporte.",
            "Tus notas personales no se muestran a otras personas en la plataforma.",
          ],
        ],
      },
      {
        id: "service-providers",
        heading: "Servicios que usamos",
        blocks: [
          "Para operar la plataforma usamos estos proveedores, que tratan datos en nuestro nombre. Algunos operan fuera de Guatemala.",
          [
            "Vercel aloja la aplicación y atiende cada visita.",
            "Supabase aloja la base de datos donde se guardan tu cuenta y tu aprendizaje.",
            "Backblaze B2 guarda los archivos subidos, como fotos de perfil y los videos, imágenes y documentos de los cursos.",
            "Un proveedor de correo electrónico (SMTP) envía los correos de la plataforma.",
            "Google te permite entrar con tu cuenta de Google, si eliges esa opción. También usamos Google Fonts: tu navegador descarga las tipografías de servidores de Google, que reciben tu dirección IP.",
            "YouTube muestra algunos videos de los cursos dentro de la plataforma. Al reproducirlos, YouTube puede usar sus propias cookies y recibir datos de tu navegador, según su propia política de privacidad.",
            "Recurrente procesa los pagos, solo si compras un contenido de pago.",
          ],
          "Los enlaces a otros sitios, como la comunidad en Keet, Instagram, TikTok o la página de donaciones de guatelibre.org, se rigen por las políticas de esos sitios.",
        ],
      },
      {
        id: "cookies",
        heading: "Cookies y almacenamiento en tu navegador",
        blocks: [
          "Usamos cookies y el almacenamiento local de tu navegador solo para que la plataforma funcione. No usamos cookies de publicidad ni de seguimiento.",
          [
            "Sesión: mantiene tu sesión iniciada. Dura hasta 7 días y se renueva mientras usas la plataforma.",
            "Idioma: recuerda si prefieres español o inglés, durante un año.",
            "Tema: recuerda si prefieres el modo claro o el oscuro.",
            "Interfaz: recuerda detalles como si cerraste un aviso o contrajiste el menú lateral.",
            "Pagos y vista previa: guardan por un tiempo el estado de un pago en curso o si abriste el capítulo de introducción de un curso.",
          ],
          "Los videos de YouTube pueden agregar sus propias cookies, como explicamos arriba.",
        ],
      },
      {
        id: "retention",
        heading: "Cuánto tiempo guardamos tus datos",
        blocks: [
          "Guardamos tus datos mientras tu cuenta esté activa. Si nos pides cerrar tu cuenta, la desactivamos. Si además nos pides borrar tus datos, los eliminamos, salvo lo que debamos conservar por ley o para resolver un problema pendiente, como el registro de un pago.",
          "Conservamos los certificados emitidos para que su verificación siga funcionando, a menos que nos pidas eliminarlos.",
        ],
      },
      {
        id: "your-rights",
        heading: "Tus derechos",
        blocks: [
          [
            "Ver y corregir los datos de tu perfil cuando quieras, desde tu perfil.",
            "Pedirnos una copia de tus datos.",
            "Pedirnos que corrijamos o eliminemos tus datos.",
            "Pedirnos que dejemos de enviarte correos informativos.",
          ],
          `Para cualquiera de estas solicitudes, escríbenos a ${SUPPORT_EMAIL} desde el correo de tu cuenta.`,
        ],
      },
      {
        id: "minors",
        heading: "Menores de edad",
        blocks: [
          "Aceptamos estudiantes desde los 13 años. Si tienes entre 13 y 17 años, pide permiso a tu madre, padre o tutor antes de crear tu cuenta y antes de compartir datos como tu teléfono o tu foto.",
          "Recomendamos que una persona adulta te acompañe mientras aprendes, sobre todo en el foro.",
          "Una madre, padre o tutor puede escribirnos para revisar, corregir o eliminar los datos de su hija o hijo. Si sabemos que una persona menor de 13 años creó una cuenta, la eliminamos.",
        ],
      },
      {
        id: "security",
        heading: "Seguridad",
        blocks: [
          "Usamos conexiones cifradas (HTTPS), enlaces de acceso que vencen a los 10 minutos y cookies de sesión protegidas. Ningún sistema es perfectamente seguro: si crees que alguien entró a tu cuenta, escríbenos.",
        ],
      },
      {
        id: "changes",
        heading: "Cambios a esta política",
        blocks: [
          "Podemos actualizar esta política. Cuando lo hagamos, cambiaremos la fecha de «Última actualización» al inicio de esta página, y si el cambio es importante, te avisaremos en la plataforma o por correo.",
        ],
      },
      {
        id: "contact",
        heading: "Contacto",
        blocks: [`Si tienes preguntas sobre tu privacidad, escríbenos a ${SUPPORT_EMAIL}.`],
      },
    ],
  },
};

const en: Record<LegalDocumentKey, LegalDocument> = {
  terms: {
    title: "Terms of service",
    summary:
      "These rules explain how you can use Dinero Libre, Se Libre's free platform for Bitcoin and financial-sovereignty education. By creating an account or using the platform, you accept these terms.",
    sections: [
      {
        id: "service",
        heading: "What Dinero Libre is",
        blocks: [
          "Dinero Libre is an online education platform run by Se Libre, an organization in Guatemala. It offers courses, learning paths, cohorts with live sessions, quizzes, certificates and a forum.",
          "Access to the courses is free. If we ever offer paid content, you will see the price before you pay.",
        ],
      },
      {
        id: "not-financial-advice",
        heading: "Education, not financial advice",
        blocks: [
          "All content is for education. It is not financial, investment, legal or tax advice, and it is not a recommendation to buy, sell or hold Bitcoin or any other asset.",
          [
            "The price of Bitcoin changes a lot, and you can lose money.",
            "If you lose your private keys or your recovery phrase, nobody can recover your funds, including us.",
            "Decisions about your money are yours. If you need to, talk to a professional.",
          ],
          "We will never ask for your private keys or your recovery phrase, or ask you to send us funds. If someone does this in our name, it is a scam.",
        ],
      },
      {
        id: "account",
        heading: "Your account",
        blocks: [
          "You sign in with a link we send to your email or with your Google account. Protect access to your email: whoever controls it can get into your account.",
          "Your account is personal; don't share it. Use real details in your profile, because your name appears on your certificates and on what you post in the forum.",
        ],
      },
      {
        id: "minors",
        heading: "Minors",
        blocks: [
          "The platform is for people aged 13 or older. If you are between 13 and 17, you need permission from a parent or guardian to create an account, and we recommend that an adult supports you while you learn.",
          "Your parent or guardian can write to us to review or close your account.",
        ],
      },
      {
        id: "conduct",
        heading: "Community rules",
        blocks: [
          "In the forum, in chapter comments and anywhere else you take part:",
          [
            "Treat other people with respect. Don't harass, threaten or discriminate against anyone.",
            "Don't post spam, advertising or misleading links.",
            "Don't promote scams, investment schemes or guaranteed returns.",
            "Don't ask for or share private keys, recovery phrases or other people's personal data.",
            "Don't post illegal, sexual or violent content, or content you don't have the right to share.",
            "Don't try to get into other people's accounts or interfere with how the platform works.",
          ],
          "We can remove content that breaks these rules and suspend or close, temporarily or permanently, accounts that break them.",
        ],
      },
      {
        id: "your-content",
        heading: "What you post",
        blocks: [
          "What you write in the forum and in comments remains yours. By posting it, you allow us to show it on the platform to the people who have access to that space.",
          "Your personal notes in chapters are for you: we don't show them to other people on the platform.",
        ],
      },
      {
        id: "intellectual-property",
        heading: "Intellectual property",
        blocks: [
          "The courses, videos, texts, quizzes, designs and the Dinero Libre brand belong to Se Libre or to the people who created them and let us use them.",
          "You can use them for your own learning and share links to the platform. Don't copy, sell or publish them elsewhere without our written permission.",
          "Some videos are shown from YouTube; when you watch them, YouTube's terms also apply.",
        ],
      },
      {
        id: "certificates",
        heading: "Certificates",
        blocks: [
          "You receive a certificate when you complete a course and score 100% on its final exam. The certificate's details are fixed when it is issued.",
          "Each certificate has a unique code and a public verification page that shows the name on the certificate, the course and the issue date.",
          "We can revoke a certificate if it was issued by mistake, if it did not meet the course requirements, or if it was earned by cheating or with someone else's account. A revoked certificate no longer shows as valid on its verification page.",
          "The certificate recognizes that you completed a Dinero Libre course. It is not an official academic degree or a professional certification.",
        ],
      },
      {
        id: "availability",
        heading: "Availability",
        blocks: [
          "We work to keep the platform running well, but it can have faults, maintenance pauses or outages. We can change, add or remove courses and features.",
          "Because the service is free, we don't guarantee that it will always be available or free of errors.",
        ],
      },
      {
        id: "liability",
        heading: "Limits of liability",
        blocks: [
          "We offer the platform and its content as they are. To the extent the law allows, Se Libre is not responsible for losses of money, bitcoin or data that result from decisions you make based on the content, or for indirect damage from using the platform or being unable to use it.",
          "None of this limits the rights the law gives you that cannot be waived.",
        ],
      },
      {
        id: "closing",
        heading: "Closing your account",
        blocks: [
          `You can stop using the platform at any time and ask us to close your account by writing to ${SUPPORT_EMAIL}. We can also close an account that breaks these terms.`,
        ],
      },
      {
        id: "changes",
        heading: "Changes to these terms",
        blocks: [
          "We can update these terms. When we do, we will change the “Last updated” date at the top of this page, and if the change is significant, we will tell you on the platform or by email.",
          "If you keep using the platform after a change, you accept the new version.",
        ],
      },
      {
        id: "law",
        heading: "Governing law",
        blocks: ["These terms are governed by the laws of the Republic of Guatemala."],
      },
      {
        id: "contact",
        heading: "Contact",
        blocks: [`If you have questions about these terms, write to us at ${SUPPORT_EMAIL}.`],
      },
    ],
  },
  privacy: {
    title: "Privacy policy",
    summary:
      "This page explains what data Dinero Libre collects, what we use it for, who can see it and what you can do about it. We don't sell your data or show ads.",
    sections: [
      {
        id: "responsible",
        heading: "Who is responsible",
        blocks: [
          `Dinero Libre is run by Se Libre, an organization in Guatemala. Se Libre decides how the platform's data is used. For any privacy question, write to us at ${SUPPORT_EMAIL}.`,
        ],
      },
      {
        id: "data-we-collect",
        heading: "What data we collect",
        blocks: [
          "Your account and profile:",
          [
            "Your email address, which you need to sign in.",
            "Your name.",
            "Your age range, your country and, where it applies, your region or department, which we ask for when you complete your profile.",
            "Your phone number, only if you choose to add it.",
            "Your profile photo, if you upload one. If you sign in with Google, we use your Google account photo.",
          ],
          "Your learning:",
          [
            "The courses, learning paths and cohorts you enroll in.",
            "Your progress in each chapter.",
            "Your quiz attempts: answers, scores and dates.",
            "Your certificates: the name on the certificate, the course, the date, the final exam score and the code.",
            "The personal notes you write in chapters.",
            "What you post in the forum and in chapter comments, and which forum posts you have viewed.",
            "The notifications you receive on the platform and whether you have read them.",
          ],
          "Sign-in data: each time you sign in, we store a session with its expiry date, your IP address and the type of browser and device you use. If you sign in with Google, we store your Google account identifier and the access permissions Google gives us to sign you in.",
          "Payments: if you buy paid content, we store the amount, the product, the payment status and your email. Your card details go to Recurrente, our payment provider; we don't store them.",
          "Messages: if you use the contact form, we receive your name, your email and your message by email.",
        ],
      },
      {
        id: "how-we-use-it",
        heading: "What we use your data for",
        blocks: [
          [
            "Creating your account and letting you sign in.",
            "Showing you your courses, saving your progress and grading your quizzes.",
            "Issuing your certificates and letting other people verify them.",
            "Running the forum and comments.",
            "Sending you service emails: the sign-in link, invitations and notices about your courses and cohorts. The team can also send informational emails to groups of students.",
            "Understanding who uses the platform, for example how many people there are per age range or country, to improve the courses.",
            "Protecting the platform, preventing abuse and complying with the law.",
          ],
          "We don't sell your data, we don't show ads and we don't use third-party analytics tools.",
        ],
      },
      {
        id: "who-can-see-it",
        heading: "Who can see your information",
        blocks: [
          [
            "People enrolled in the same course, learning path or cohort can see your name, your photo and what you post in the forum and in comments.",
            "Anyone with your certificate's code or link can see its verification page, with the name on the certificate, the course and the issue date.",
            "The Se Libre team that runs the platform can see your profile, enrollments, progress and results, to follow up and give support.",
            "Your personal notes are not shown to other people on the platform.",
          ],
        ],
      },
      {
        id: "service-providers",
        heading: "Services we use",
        blocks: [
          "To run the platform we use these providers, which handle data on our behalf. Some of them operate outside Guatemala.",
          [
            "Vercel hosts the application and serves every visit.",
            "Supabase hosts the database where your account and your learning are stored.",
            "Backblaze B2 stores uploaded files, such as profile photos and course videos, images and documents.",
            "An email provider (SMTP) sends the platform's emails.",
            "Google lets you sign in with your Google account, if you choose that option. We also use Google Fonts: your browser downloads the typefaces from Google servers, which receive your IP address.",
            "YouTube shows some course videos inside the platform. When you play them, YouTube can use its own cookies and receive data from your browser, under its own privacy policy.",
            "Recurrente processes payments, only if you buy paid content.",
          ],
          "Links to other sites, such as the Keet community, Instagram, TikTok or the guatelibre.org donation page, are covered by those sites' own policies.",
        ],
      },
      {
        id: "cookies",
        heading: "Cookies and browser storage",
        blocks: [
          "We use cookies and your browser's local storage only to make the platform work. We don't use advertising or tracking cookies.",
          [
            "Session: keeps you signed in. It lasts up to 7 days and renews while you use the platform.",
            "Language: remembers whether you prefer Spanish or English, for one year.",
            "Theme: remembers whether you prefer light or dark mode.",
            "Interface: remembers details such as whether you dismissed a notice or collapsed the sidebar.",
            "Payments and preview: keep, for a while, the status of a payment in progress or whether you opened a course's introduction chapter.",
          ],
          "YouTube videos can add their own cookies, as explained above.",
        ],
      },
      {
        id: "retention",
        heading: "How long we keep your data",
        blocks: [
          "We keep your data while your account is active. If you ask us to close your account, we deactivate it. If you also ask us to delete your data, we delete it, except what we must keep by law or to resolve an open issue, such as the record of a payment.",
          "We keep issued certificates so their verification keeps working, unless you ask us to delete them.",
        ],
      },
      {
        id: "your-rights",
        heading: "Your rights",
        blocks: [
          [
            "See and correct your profile details at any time, from your profile.",
            "Ask us for a copy of your data.",
            "Ask us to correct or delete your data.",
            "Ask us to stop sending you informational emails.",
          ],
          `For any of these requests, write to ${SUPPORT_EMAIL} from your account's email address.`,
        ],
      },
      {
        id: "minors",
        heading: "Minors",
        blocks: [
          "We accept students aged 13 and older. If you are between 13 and 17, ask a parent or guardian for permission before you create your account and before you share details such as your phone number or your photo.",
          "We recommend that an adult supports you while you learn, especially in the forum.",
          "A parent or guardian can write to us to review, correct or delete their child's data. If we learn that someone under 13 created an account, we delete it.",
        ],
      },
      {
        id: "security",
        heading: "Security",
        blocks: [
          "We use encrypted connections (HTTPS), sign-in links that expire after 10 minutes and protected session cookies. No system is perfectly secure: if you think someone got into your account, write to us.",
        ],
      },
      {
        id: "changes",
        heading: "Changes to this policy",
        blocks: [
          "We can update this policy. When we do, we will change the “Last updated” date at the top of this page, and if the change is significant, we will tell you on the platform or by email.",
        ],
      },
      {
        id: "contact",
        heading: "Contact",
        blocks: [`If you have questions about your privacy, write to us at ${SUPPORT_EMAIL}.`],
      },
    ],
  },
};

export const legalDocuments: Record<Locale, Record<LegalDocumentKey, LegalDocument>> = { es, en };
