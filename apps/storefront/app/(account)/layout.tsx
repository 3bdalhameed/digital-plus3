import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="mx-auto min-h-screen max-w-[90rem] px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      <Footer />
    </>
  );
}
