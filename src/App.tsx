import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { StoreProvider } from "@/lib/store";
import { AuthModal } from "@/components/sections/Auth";
import { CartDrawer } from "@/components/sections/Catalog";
import { ScrollBar } from "@/components/animations/ScrollBar";
import { Mascot } from "@/components/animations/Mascot";
import Home from "@/pages/Home";
import Shop from "@/pages/Shop";

function Pages() {
  const { pathname } = useLocation();
  return (
    <div key={pathname} className="enter">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tienda" element={<Shop />} />
      </Routes>
    </div>
  );
}

function FloatingMascot() {
  const { pathname } = useLocation();
  return pathname === "/" ? <Mascot /> : null;
}

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <ScrollBar />
        <Pages />
        <FloatingMascot />
        <AuthModal />
        <CartDrawer />
      </BrowserRouter>
    </StoreProvider>
  );
}
