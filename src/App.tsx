import { ScrollBar } from "@/components/animations/ScrollBar";
import { Mascot } from "@/components/animations/Mascot";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

import { Hero } from "@/components/sections/Hero";
import { Marquee } from "@/components/sections/Marquee";
import { About } from "@/components/sections/About";
import { Stats } from "@/components/sections/Stats";
import { Services } from "@/components/sections/Services";
import { Visit } from "@/components/sections/Visit";
import { Reviews } from "@/components/sections/Reviews";
import { Booking } from "@/components/sections/Booking";

export default function App() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <ScrollBar />
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <About />
        <Stats />
        <Services />
        <Visit />
        <Reviews />
        <Booking />
      </main>
      <Footer />
      <Mascot />
    </div>
  );
}