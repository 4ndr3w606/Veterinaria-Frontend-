import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { StoreProvider } from "@/lib/store";
import { AuthModal } from "@/components/sections/Auth";
import { CartDrawer } from "@/components/sections/CartDrawer";
import { ScrollBar } from "@/components/animations/ScrollBar";
import { Mascot } from "@/components/animations/Mascot";
import Home from "@/pages/Home";
import Shop from "@/pages/Shop";

const Species = lazy(() => import("@/pages/Species"));
const Checkout = lazy(() => import("@/pages/Checkout"));

function Pages() {
  const { pathname } = useLocation();
  return (
    <div key={pathname} className="enter">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tienda" element={<Shop />} />
        <Route path="/especies" element={<Suspense fallback={<p role="status" className="p-12">Cargando biblioteca animal…</p>}><Species /></Suspense>} />
        <Route path="/finalizar-compra" element={<Suspense fallback={<p role="status" className="p-12">Cargando el formulario de compra…</p>}><Checkout /></Suspense>} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <ScrollBar />
        <Pages />
        {/* Luma (el chatbot) está disponible en todas las páginas */}
        <Mascot />
        <AuthModal />
        <CartDrawer />
      </BrowserRouter>
    </StoreProvider>
  );
}
