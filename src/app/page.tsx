import NovaHero from "@/components/NovaHero";
import CustomCursor from "@/components/CustomCursor";
import SpeedPass from "@/components/SpeedPass";
import Philosophy from "@/components/Philosophy";
import Principles from "@/components/Principles";
import PrivateAccess from "@/components/PrivateAccess";
import FinalIdentity from "@/components/FinalIdentity";
import { Suspense } from "react";

export default function Home() {
  return (
    <main className="bg-black min-h-screen">
      <CustomCursor />
      
      <Suspense fallback={<div className="h-screen bg-black" />}>
        <NovaHero />
      </Suspense>

      <SpeedPass />
      <Philosophy />
      <Principles />
      <PrivateAccess />
      <FinalIdentity />
    </main>
  );
}
