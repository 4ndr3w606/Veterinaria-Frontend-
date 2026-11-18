import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, api } from "@/lib/api";
import type { Booking, BookingInput } from "@/lib/types";

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const bookingRequestId = useRef(0);
  const activeBookingEmailRef = useRef<string | null>(null);
  const lastAutomaticBookingSync = useRef(0);

  const fetchBookings = useCallback(async (email: string) => {
    const requestId = ++bookingRequestId.current;
    if (activeBookingEmailRef.current !== email) return;

    try {
      const list = await api.getBookings(email);
      if (requestId === bookingRequestId.current && activeBookingEmailRef.current === email) {
        setBookings(list);
        setBookingsError(null);
      }
    } catch (error: unknown) {
      if (requestId === bookingRequestId.current && activeBookingEmailRef.current === email) {
        setBookings([]);
        setBookingsError(error instanceof ApiError ? error.message : "No se pudieron cargar tus citas.");
      }
    } finally {
      if (requestId === bookingRequestId.current && activeBookingEmailRef.current === email) {
        setBookingsLoading(false);
      }
    }
  }, []);

  const refreshBookings = useCallback(async () => {
    const email = activeBookingEmailRef.current;
    if (!email) return;
    setBookingsLoading(true);
    setBookingsError(null);
    await fetchBookings(email);
  }, [fetchBookings]);
  useEffect(() => {
    const syncWhenActive = () => {
      if (document.visibilityState === "hidden" || !activeBookingEmailRef.current) return;
      const now = Date.now();
      if (now - lastAutomaticBookingSync.current < 1500) return;
      lastAutomaticBookingSync.current = now;
      void refreshBookings();
    };
    window.addEventListener("focus", syncWhenActive);
    document.addEventListener("visibilitychange", syncWhenActive);
    return () => {
      window.removeEventListener("focus", syncWhenActive);
      document.removeEventListener("visibilitychange", syncWhenActive);
    };
  }, [refreshBookings]);
  // Se ejecuta en el evento de sesión, antes de que una respuesta anterior pueda aplicarse.
  const setBookingUser = useCallback((email: string | null) => {
    activeBookingEmailRef.current = email;
    bookingRequestId.current += 1;
    setBookings([]);
    setBookingsLoading(email !== null);
    setBookingsError(null);
    if (email) void fetchBookings(email);
  }, [fetchBookings]);

  const getBookingAvailability = useCallback((date: string) => api.getBookingAvailability(date), []);

  return {
    bookings,
    bookingsLoading,
    bookingsError,
    setBookingUser,
    refreshBookings,
    getBookingAvailability,
    book: async (booking: BookingInput): Promise<string | null> => {
      const email = activeBookingEmailRef.current;
      if (!email) return "Inicia sesión para reservar.";
      try {
        await api.createBooking(booking, email);
        if (activeBookingEmailRef.current === email) await refreshBookings();
        return null;
      } catch (error) {
        if (error instanceof ApiError && error.code === "INVALID_API_RESPONSE") {
          return "No pudimos confirmar la respuesta de la reserva. Actualiza Mis citas antes de volver a reservar.";
        }
        if (error instanceof ApiError && error.status === 409) return "Ese horario ya está ocupado.";
        if (error instanceof ApiError && error.status === 401) return "Tu sesión no está autorizada para reservar.";
        if (error instanceof ApiError && error.status === 422) return error.message;
        return "No pudimos registrar la cita. Inténtalo de nuevo."; 
      }
    },
    cancel: async (id: string): Promise<string | null> => {
      const email = activeBookingEmailRef.current;
      if (!email) return "Inicia sesión para cancelar."; 
      try {
        await api.cancelBooking(id, email);
        if (activeBookingEmailRef.current === email) await refreshBookings();
        return null;
      } catch (error) {
        if (error instanceof ApiError && error.code === "INVALID_API_RESPONSE") {
          return "No pudimos confirmar la cancelación. Actualiza Mis citas para comprobar su estado.";
        }
        if (error instanceof ApiError && error.status === 404) return "No encontramos esa cita.";
        if (error instanceof ApiError && error.status === 401) return "Tu sesión no está autorizada para cancelar citas.";
        return "No pudimos cancelar la cita. Inténtalo de nuevo."; 
      }
    },
  };
}
