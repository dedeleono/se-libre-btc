import  Header  from "@/components/layout/navbar-header-main";
import Footer from "@/components/layout/footer-main";
import KeetLink from "@/components/keet-link";
import { KEET_COMMUNITY_URL } from "@/lib/keet";
import { MAIN_CONTENT_ID } from "@/components/layout/skip-link";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dl-app min-h-screen flex flex-col">
      <Header />
      <main id={MAIN_CONTENT_ID} className="flex-1 w-full max-w-full">
        {children}
      </main>
      <KeetLink communityUrl={KEET_COMMUNITY_URL} />
      <Footer />
    </div>
  );
}
