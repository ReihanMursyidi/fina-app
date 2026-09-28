'use client';

import { logoutUser } from "@/features/auth/action";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

interface IdleTimerProps {
   timeoutMinutes?: number;
}

export function IdleTimer({ timeoutMinutes = 15 }: IdleTimerProps) {
   const router = useRouter();
   // Menyimpan referensi waktu agar bisa di-reset
   const timeoutRef = useRef<NodeJS.Timeout | null>(null);

   useEffect(() => {
      const handleLogout = async () => {
         try {
            await logoutUser();
            toast.info('Your session expired due to inactivity.');
            router.push('/');
         } catch (error) {
            console.error('Failed to perform auto-logout:', error);
         }
      };

      const resetTimer = () => {
         if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
         }
         // Reset timer (Waktu dalam milisecond: Menit * 60 * 1000)
         timeoutRef.current = setTimeout(handleLogout, timeoutMinutes * 60 * 1000);
      };

      // Daftar aktivitas yg dianggap "User sedang aktif"
      const events = ['mousemove', 'keydown', 'wheel', 'mousedown', 'touchstart', 'scroll'];
      
      // Pasang pendeteksi ke seluruh window browser
      events.forEach((event) => window.addEventListener(event, resetTimer));

      // Mulai hitung mundur saat komponen di-load
      resetTimer();

      // Bersihkan detektor saat user pindah halaman
      return () => {
         if (timeoutRef.current) clearTimeout(timeoutRef.current);
         events.forEach((event) => window.removeEventListener(event, resetTimer));
      };
   }, [router, timeoutMinutes]);

   return null;
}