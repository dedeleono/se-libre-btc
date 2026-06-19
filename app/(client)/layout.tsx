import  Header  from "@/components/layout/navbar-header-main";
import Footer from "@/components/layout/footer-main";
import KeetLink from "@/components/keet-link";
import { KEET_COMMUNITY_URL } from "@/lib/keet";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dl-app min-h-screen flex flex-col w-full max-w-full overflow-x-hidden">
      <Header />
      <main className="flex-1 w-full max-w-full">
        {children}
        <KeetLink communityUrl={KEET_COMMUNITY_URL} />
      </main>
      <Footer />
    </div>
  );
}
