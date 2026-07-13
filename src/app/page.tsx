import NovaHero from "@/components/NovaHero";
import { Suspense } from "react";

export default function Home() {
  return (
    <main className="bg-black min-h-screen">
      <Suspense fallback={<div className="h-screen bg-black" />}>
        <NovaHero />
      </Suspense>
    </main>
  );
}
