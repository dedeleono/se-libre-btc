import {
  Body,
  Container,
  Column,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
  Button,
  Tailwind,
  Hr,
} from "@react-email/components";

interface AuthEmailProps {
  host: string;
  url: string;
}

export default function AuthEmail({ host, url }: AuthEmailProps) {
  const previewText = `Iniciar sesión en Se Libre`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-[#f6f9fc] font-sans">
          <Container className="mx-auto my-[40px] max-w-[520px] p-[48px]">
            {/* Logo Section */}
            <Section className="mb-8 text-center">
              <Img
                alt="saber-ver"
                src="https://saber-ver-v2.vercel.app/logo.png"
                width="160"
                height="55"
                className="mx-auto"
              />
            </Section>

            {/* Main Content Card */}
            <Container className="rounded-xl border border-[#e5e7eb] bg-white p-10 shadow-sm">
              <Heading className="m-0 text-center text-[28px] font-semibold text-[#1f2937]">
                Iniciar sesión
              </Heading>

              <Text className="mb-10 mt-8 text-center text-[16px] leading-[26px] text-[#4b5563]">
                Haz clic en el botón de abajo para iniciar sesión en tu cuenta.
              </Text>

              <Section className="mb-4 text-center">
                <Button
                  className="rounded-lg bg-[#034180] px-12 py-4 text-[16px] font-medium text-white hover:bg-[#023366]"
                  href={url}
                >
                  Iniciar sesión
                </Button>
              </Section>
              <Text className="text-[13px] leading-6 text-[#6b7280]">
                Este enlace expirará en 24 horas.
              </Text>
            </Container>

            {/* Footer */}
            <Section className="mt-8 text-center">
              <Text className="text-[13px] leading-6 text-[#6b7280]">
                Se Libre BTC — Si no solicitaste este correo electrónico,
                puedes ignorarlo de forma segura.
              </Text>
              <Link
                href="https://www.saber-ver.com/"
                className="text-[13px] text-[#6b7280] underline hover:text-[#034180]"
              >
                www.saber-ver.com
              </Link>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
