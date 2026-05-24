import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Button,
  Tailwind,
} from "@react-email/components";

interface InvitationEmailProps {
  inviteUrl: string;
  userEmail: string;
  host: string;
  url: string;
}

export default function InvitationEmail({
  inviteUrl,
  userEmail,
}: InvitationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Has sido invitado a unirte a Colegio Saber Ver</Preview>
      <Tailwind>
        <Body className="bg-white font-sans">
          <Container className="mx-auto py-8 px-4">
            <Heading className="text-2xl font-bold text-center mb-4 text-[#034180]">
              Bienvenido a Colegio Saber Ver
            </Heading>
            <Text className="text-gray-600 mb-4">
              Has sido invitado a unirte a Colegio Saber Ver. Haz clic en el botón
              a continuación para configurar tu cuenta.
            </Text>
            <Text className="text-gray-600 mb-4">
              También puedes iniciar sesión con Google usando este correo: {userEmail}
            </Text>
            <Button
              className="bg-[#034180] text-white px-6 py-3 rounded-md font-medium hover:bg-[#023366]"
              href={inviteUrl}
            >
              Aceptar Invitación
            </Button>
            <Text className="text-gray-500 text-sm mt-4">
              Este enlace de invitación expirará en 24 horas.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}