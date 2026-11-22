import Footer from "@/components/layout/footer-main";
import Header from "@/components/layout/navbar-header-main";
import { MAIN_CONTENT_ID } from "@/components/layout/skip-link";

export default function CoursePreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dl-app flex min-h-screen flex-col">
      <Header />
      <main id={MAIN_CONTENT_ID} className="flex-1 w-full">
        {children}
      </main>
      <Footer />
    </div>
  );
}
