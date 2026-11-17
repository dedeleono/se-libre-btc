// TEMPORARY: deleted before the PR (plan 006, Step 10).
const p = (text: string) =>
  `<p class="PlaygroundEditorTheme__paragraph" dir="ltr"><span style="white-space: pre-wrap;">${text}</span></p>`;
const cell = (tag: "th" | "td", text: string) =>
  `<${tag} class="PlaygroundEditorTheme__tableCell${tag === "th" ? " PlaygroundEditorTheme__tableCellHeader" : ""}" style="border: 1px solid black; width: 92px; vertical-align: top; text-align: start;${tag === "th" ? " background-color: rgb(242, 243, 245);" : ""}">${p(text)}</${tag}>`;
const row = (tag: "th" | "td", cells: string[]) => `<tr>${cells.map((c) => cell(tag, c)).join("")}</tr>`;

const LONG_URL = "https://ejemplo.org/recursos/ahorro/preferencia-temporal/modulo-7/leccion-1?fuente=libreta"; // 90 chars
const HEX = "a3f1c9e07b2d48f6915e0c7d2b8a4f6e3c1d9b7a5e2f08c4d6b1a9e7f3c2d5b8"; // 64 chars

export const LESSON_FIXTURES = {
  "long-description": {
    title: "LECCION 1: AHORRA FUERA DEL SISTEMA Y LA BAJA PREFERENCIA TEMPORAL",
    description:
      `<h2 class="PlaygroundEditorTheme__h2" dir="ltr"><span style="background-color: rgb(247, 147, 26); white-space: pre-wrap;">EL AHORRO ES EL MOTOR DE LA CIVILIZACION</span></h2>` +
      p("Ahorrar es renunciar hoy a un consumo para tener más opciones mañana. Cada generación que ahorró construyó herramientas, caminos y conocimiento que heredaron las siguientes.") +
      p("La preferencia temporal mide cuánto valoras el presente frente al futuro. Cuando el dinero pierde valor cada año, el sistema te empuja a gastar ahora y a pensar en plazos cada vez más cortos.") +
      p("Ahorrar fuera del sistema significa guardar valor en un activo que nadie puede imprimir ni congelar. Bitcoin tiene una oferta fija de 21 millones y reglas que no dependen de ningún banco.") +
      p("En esta lección vas a comparar tres formas de ahorro y a calcular cuánto poder de compra pierdes al guardar quetzales en una cuenta tradicional durante diez años."),
    richContent: p("Empieza por anotar cuánto ahorras cada mes y en qué lo guardas.") + p("Usa la libreta digital para registrar tus respuestas."),
  },
  "table-url": {
    title: "LECCION 2: COMPARA TUS OPCIONES DE AHORRO",
    description: p("Una tabla para comparar opciones y un par de enlaces largos."),
    richContent:
      `<h3 class="PlaygroundEditorTheme__h3" dir="ltr"><span style="white-space: pre-wrap;">Comparación de opciones</span></h3>` +
      `<table class="PlaygroundEditorTheme__table"><colgroup>${'<col style="width: 92px;">'.repeat(6)}</colgroup><tbody>` +
      row("th", ["Opción", "Rendimiento anual", "Inflación", "Custodia", "Liquidez", "Riesgo de confiscación"]) +
      row("td", ["Cuenta bancaria", "2 %", "4 %", "Banco", "Alta", "Medio"]) +
      row("td", ["Efectivo", "0 %", "4 %", "Tú", "Alta", "Bajo"]) +
      row("td", ["Bitcoin en autocustodia", "Variable", "No aplica", "Tú, con tu frase semilla", "Alta", "Bajo"]) +
      `</tbody></table>` +
      `<p class="PlaygroundEditorTheme__paragraph" dir="ltr"><span style="white-space: pre-wrap;">Lee más en </span><a href="${LONG_URL}" class="PlaygroundEditorTheme__link"><span style="white-space: pre-wrap;">${LONG_URL}</span></a></p>` +
      p(`Identificador de transacción: ${HEX}`) +
      `<ul class="PlaygroundEditorTheme__ul"><li value="1" class="PlaygroundEditorTheme__listItem"><span style="white-space: pre-wrap;">Anota tu meta de ahorro.</span></li><li value="2" class="PlaygroundEditorTheme__listItem"><span style="white-space: pre-wrap;">Revisa la tabla cada mes.</span></li></ul>` +
      `<blockquote class="PlaygroundEditorTheme__quote" dir="ltr"><span style="white-space: pre-wrap;">No confíes, verifica.</span></blockquote>` +
      `<p class="PlaygroundEditorTheme__paragraph" dir="ltr"><span style="white-space: pre-wrap;">Comando: </span><code spellcheck="false" style="white-space: pre-wrap;"><span class="PlaygroundEditorTheme__textCode">bitcoin-cli getblockcount</span></code></p>`,
  },
  "legacy-wrapper": {
    title: "LECCION 3: CONTENIDO ANTIGUO",
    description: "",
    richContent: `<div class="ContentEditable__root" contenteditable="true" role="textbox" spellcheck="true" data-lexical-editor="true">${p("Contenido antiguo guardado con el contenedor del editor.")}</div>`,
  },
} as const;

export type LessonFixtureId = keyof typeof LESSON_FIXTURES;
