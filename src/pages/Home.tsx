import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { go } from "@/lib/utils";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { Marquee } from "@/components/sections/Marquee";
import { About } from "@/components/sections/About";
import { Services } from "@/components/sections/Services";
import { AnimalLibrary } from "@/components/sections/AnimalLibrary";
import { Stats } from "@/components/sections/Stats";
import { Reviews } from "@/components/sections/Reviews";
import { Booking } from "@/components/sections/Booking";
import { Visit } from "@/components/sections/Visit";

export default function Home() {
  const { hash, key } = useLocation();
  useEffect(() => { if (hash === "#cita" || hash === "#especies") go(hash.slice(1)); }, [hash, key]);
  return (
    <>
      <Navbar />
      
      <main>
      
        <Hero />
        <Marquee />
        <About />
        <Services />
        <AnimalLibrary />
        <Stats />
        <Visit />
        <Reviews />
        <Booking />
      </main>
      <Footer />
      
    </>
  );
}
