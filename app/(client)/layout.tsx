import  Header  from "@/components/layout/navbar-header-main";
import Footer from "@/components/layout/footer-main";
import { auth } from "@/lib/auth";
import WhatsAppLink from "@/components/whatsapp-link";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  const whatsappNumber = "56938502";
  const baseUrl = "https://api.whatsapp.com/send";
  const encodedMessage = "Hola, ¿cómo estás?";
  const whatsappLink = `${baseUrl}?phone=${whatsappNumber}?text=${encodedMessage}&type=phone_number&app_absent=0`;

  return (
    <div className="dl-app min-h-screen flex flex-col w-full max-w-full overflow-x-hidden">
      <Header />
      <main className="flex-1 w-full max-w-full">
        {children}
        <WhatsAppLink
          whatsappLink={whatsappLink}
        />
      </main>
      <Footer />
    </div>
  );
}
