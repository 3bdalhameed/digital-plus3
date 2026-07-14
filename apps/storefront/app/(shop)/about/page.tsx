import { AboutContent } from "./AboutContent";

export const metadata = { title: "من نحن" };
// Fully static content — revalidate once per hour is generous.
export const revalidate = 3600;

export default function AboutPage() {
  return <AboutContent />;
}
