import type { Product } from "@/lib/types";
import { reducedMotion } from "./helpers";

/** Hace "rebotar" el botón del carrito (el que tenga el atributo data-cart-target). */
function bump(target: HTMLElement) {
  target.animate(
    [{ transform: "scale(1)" }, { transform: "scale(1.35) rotate(-8deg)" }, { transform: "scale(0.92)" }, { transform: "scale(1)" }],
    { duration: 480, easing: "ease-out" },
  );
}

/**
 * Lanza una miniatura del producto desde el botón "Añadir" hasta el icono del carrito, siguiendo un arco.
 * Usa la Web Animations API con estilos en línea, así no depende de ningún CSS.
 */
export function flyToCart(from: HTMLElement, p: Product) {
  const target = document.querySelector<HTMLElement>("[data-cart-target]");
  if (!target || reducedMotion()) return;

  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const size = 46;
  const x0 = a.left + a.width / 2 - size / 2;
  const y0 = a.top + a.height / 2 - size / 2;
  const x1 = b.left + b.width / 2 - size / 2;
  const y1 = b.top + b.height / 2 - size / 2;
  const xm = (x0 + x1) / 2;
  const ym = Math.min(y0, y1) - 90;

  const dot = document.createElement("span");
  dot.setAttribute("aria-hidden", "true");
  Object.assign(dot.style, {
    position: "fixed",
    left: "0",
    top: "0",
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: "50%",
    zIndex: "80",
    pointerEvents: "none",
    background: p.image ? `center / cover no-repeat url("${p.image}"), var(--primary)` : "var(--primary)",
    border: "2px solid var(--primary)",
    boxShadow: "0 8px 24px rgba(0,0,0,.45)",
  });
  document.body.appendChild(dot);

  const anim = dot.animate(
    [
      { transform: `translate(${x0}px, ${y0}px) scale(1)`, opacity: 1, offset: 0 },
      { transform: `translate(${xm}px, ${ym}px) scale(0.85)`, opacity: 1, offset: 0.5, easing: "ease-in" },
      { transform: `translate(${x1}px, ${y1}px) scale(0.2)`, opacity: 0.4, offset: 1 },
    ],
    { duration: 800, easing: "ease-out" },
  );
  anim.onfinish = () => {
    dot.remove();
    bump(target);
  };
  anim.oncancel = () => dot.remove();
}
