"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { animate, stagger, utils } from "animejs";
import { cn } from "@/lib/cn";
import { durasiGerak } from "@/lib/gerak";
import { lupakanAngka } from "@/lib/ingatanAngka";
import { inisial } from "@/lib/format";
import { navItems } from "./nav-items";
import {
  IconKeluar,
  IconLogo,
  IconPensil,
  IconToko,
  IconTutup,
} from "@/components/ui/icons";
import { Button } from "@/components/ui/Button";
import { ModalKonfirmasi } from "@/components/ui/ModalKonfirmasi";

type SidebarProps = {
  namaUsaha: string;
  kategoriUsaha: string;
  namaPemilik: string;
  peran: string;
  email?: string;
  /** Dipakai versi drawer di layar kecil. */
  onTutup?: () => void;
};

export function Sidebar({
  namaUsaha,
  kategoriUsaha,
  namaPemilik,
  peran,
  email,
  onTutup,
}: SidebarProps) {
  const pathname = usePathname();
  const [konfirmasiKeluar, setKonfirmasiKeluar] = useState(false);
  const [keluar, mulaiKeluar] = useTransition();
  const refDaftarMenu = useRef<HTMLUListElement>(null);
  const refPenanda = useRef<HTMLSpanElement>(null);
  /** Penanda sudah pernah dipasang di posisi yang sah. */
  const penandaTerpasang = useRef(false);

  // Sidebar yang sama dipakai dua kali: menetap di layar besar, dan sebagai
  // drawer di layar kecil. Hanya versi drawer yang dianimasikan — versi tetap
  // sudah ada sejak halaman dimuat, tidak ada momen "masuk" untuk dianimasikan.
  const modeDrawer = Boolean(onTutup);

  useEffect(() => {
    if (!modeDrawer) return;
    const daftar = refDaftarMenu.current;
    if (!daftar) return;

    const item = Array.from(daftar.children) as HTMLElement[];
    if (item.length === 0) return;

    // Menyusul sedikit di belakang panel yang sedang menggeser masuk, supaya
    // isinya terbaca sebagai satu gerakan, bukan dua animasi yang berlomba.
    //
    // Angkanya dipilih agar ekornya pendek: item terakhir mulai pada 90 + 4×30
    // = 210ms dan selesai pada 430ms, jadi hanya ~110ms setelah panel mendarat
    // di 320ms. Jeda yang lebih panjang membuat menu terasa lamban dibuka.
    animate(item, {
      opacity: [0, 1],
      translateX: [-10, 0],
      duration: durasiGerak(220),
      delay: stagger(30, { start: durasiGerak(90) }),
      ease: "outQuad",
    });

    return () => {
      utils.remove(item);
    };
  }, [modeDrawer]);

  /**
   * Penanda menu aktif: sorotan yang timbul di belakang item terpilih.
   *
   * Sengaja tidak meluncur antar item. Luncuran menarik mata mengikuti
   * kotaknya berpindah, padahal yang perlu diperhatikan adalah tujuannya —
   * dan pada daftar sependek ini perjalanannya tidak menjelaskan apa pun.
   * Masukan QA dari Person C.
   *
   * Diukur setelah tata letak selesai (useLayoutEffect) supaya posisinya tidak
   * diambil dari ukuran yang basi.
   */
  useLayoutEffect(() => {
    const daftar = refDaftarMenu.current;
    const penanda = refPenanda.current;
    if (!daftar || !penanda) return;

    const indeksAktif = navItems.findIndex(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    );

    // Halaman di luar daftar menu (misal profil usaha) tidak punya item aktif.
    if (indeksAktif < 0) {
      if (penandaTerpasang.current) {
        penandaTerpasang.current = false;
        animate(penanda, {
          opacity: 0,
          duration: durasiGerak(140),
          ease: "outQuad",
        });
      } else {
        utils.set(penanda, { opacity: 0 });
      }
      return;
    }

    const target = daftar.children[indeksAktif] as HTMLElement | undefined;
    if (!target) return;

    const posisi = { translateY: target.offsetTop, height: target.offsetHeight };

    // Arrow function, bukan deklarasi: TypeScript hanya mempertahankan
    // penyempitan tipe `penanda` di dalam closure yang tidak terangkat.
    /** Sorotan dipasang di tempatnya lalu timbul dari belakang item. */
    const timbul = () => {
      utils.set(penanda, { ...posisi, opacity: 0, scale: 0.96 });
      animate(penanda, {
        opacity: 1,
        scale: 1,
        duration: durasiGerak(200),
        ease: "outQuint",
      });
    };

    // Sisa animasi sebelumnya dibuang lebih dulu. Berpindah menu dua kali
    // dengan cepat kalau tidak begini membuat `onComplete` yang lama ikut
    // menjalankan `timbul` ke posisi yang sudah tidak berlaku.
    utils.remove(penanda);

    // Belum punya posisi sah — saat pertama dipasang, atau sesudah sempat
    // disembunyikan karena halaman di luar daftar menu.
    if (!penandaTerpasang.current) {
      penandaTerpasang.current = true;
      timbul();
      return;
    }

    // Padam dulu di tempat lamanya, baru timbul di tempat yang baru. Dengan
    // satu elemen, ini satu-satunya cara berpindah tanpa terlihat menempuh
    // jarak di antara keduanya.
    const msPadam = durasiGerak(100);
    if (msPadam === 0) {
      timbul();
      return;
    }

    animate(penanda, {
      opacity: 0,
      duration: msPadam,
      ease: "inQuad",
      onComplete: timbul,
    });
  }, [pathname]);

  function keluarSekarang() {
    // Halaman berpindah ke /login setelah sesi dihapus, jadi modal tidak perlu
    // ditutup sendiri; biarkan tombolnya tetap menampilkan status berjalan.
    mulaiKeluar(async () => {
      // Angka ringkasan yang diingat melekat pada tab, bukan pada akun. Tanpa
      // dibersihkan, masuk dengan akun lain di tab yang sama membuat angka
      // pertama yang tampil dianimasikan dari angka pemilik sebelumnya.
      lupakanAngka();
      await signOut({ callbackUrl: "/login" });
    });
  }

  return (
    <div className="flex h-full w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex items-center justify-between gap-2 px-4 py-4">
        <Link href="/dashboard" className="flex items-center gap-2 text-sidebar-foreground">
          <span className="flex size-8 items-center justify-center rounded-card bg-primary text-primary-foreground">
            <IconLogo width={18} height={18} />
          </span>
          <span className="text-base font-semibold tracking-tight">
            ruang<span className="text-primary">margin</span>
          </span>
        </Link>
        {onTutup && (
          <Button varian="ghost" ukuran="sm" onClick={onTutup} aria-label="Tutup menu" className="px-2 lg:hidden">
            <IconTutup />
          </Button>
        )}
      </div>

      {/* Kartu identitas sekaligus jalan masuk ke halaman profil usaha, supaya
          daftar menu tidak perlu bertambah panjang. */}
      <Link
        href="/profil-usaha"
        onClick={onTutup}
        aria-current={pathname === "/profil-usaha" ? "page" : undefined}
        className={cn(
          "mx-3 flex items-center gap-3 rounded-card border px-3 py-2.5 transition-colors",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          pathname === "/profil-usaha"
            ? "border-primary/40 bg-sidebar-accent"
            : "border-sidebar-border bg-background hover:border-primary/40",
        )}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-card bg-accent text-accent-foreground">
          <IconToko width={18} height={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-sidebar-foreground">
            {namaUsaha}
          </span>
          <span className="block truncate text-xs text-muted-foreground">{kategoriUsaha}</span>
        </span>
        <IconPensil width={14} height={14} className="shrink-0 text-muted-foreground" />
      </Link>

      <nav aria-label="Navigasi utama" className="mt-5 flex-1 px-3">
        <p className="px-2 pb-2 text-[0.6875rem] font-medium tracking-[0.14em] text-muted-foreground uppercase">
          Ruang usaha
        </p>
        {/* Penanda dipisah dari <ul> supaya daftar menu tetap hanya berisi
            <li>, dan supaya offsetTop tiap item terukur terhadap kotak ini. */}
        <div className="relative">
          <span
            ref={refPenanda}
            aria-hidden="true"
            style={{ opacity: 0 }}
            className="pointer-events-none absolute inset-x-0 top-0 rounded-card bg-sidebar-accent"
          />
          <ul ref={refDaftarMenu} className="flex flex-col gap-0.5">
            {navItems.map((item) => {
              const aktif =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Ikon = item.ikon;
              return (
                <li
                  key={item.href}
                  // `relative` menaikkan item di atas penanda: elemen
                  // berposisi tergambar setelah yang statis, jadi tanpa ini
                  // penandanya justru menutupi tulisan menu.
                  className="relative"
                  // Nilai awal ditulis di sini, bukan menunggu efeknya jalan:
                  // tanpa ini item sempat tergambar penuh satu frame lalu
                  // berkedip kembali ke nol saat animasi dimulai.
                  style={modeDrawer ? { opacity: 0 } : undefined}
                >
                  <Link
                    href={item.href}
                    aria-current={aktif ? "page" : undefined}
                    onClick={onTutup}
                    className={cn(
                      "flex items-center gap-2.5 rounded-card px-2.5 py-2 text-sm transition-colors",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                      // Latar item aktif sekarang dipegang penanda yang
                      // meluncur, jadi di sini tinggal warna dan tebal huruf.
                      aktif
                        ? "font-medium text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Ikon width={18} height={18} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      <div className="flex items-center gap-2.5 border-t border-sidebar-border px-4 py-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
          {inisial(namaPemilik)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-sidebar-foreground">{peran}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {email ?? namaPemilik}
          </span>
        </span>
        <Button
          varian="ghost"
          ukuran="sm"
          aria-label="Keluar"
          className="px-2"
          onClick={() => setKonfirmasiKeluar(true)}
        >
          <IconKeluar width={18} height={18} />
        </Button>
      </div>

      <ModalKonfirmasi
        terbuka={konfirmasiKeluar}
        judul="Keluar dari akun?"
        subjudul="Data usahamu tetap tersimpan."
        labelKonfirmasi="Keluar"
        labelSedangProses="Keluar…"
        labelBatal="Tetap di sini"
        memproses={keluar}
        onTutup={() => setKonfirmasiKeluar(false)}
        onKonfirmasi={keluarSekarang}
      >
        <p className="text-sm text-foreground">
          Kamu akan keluar dari <span className="font-semibold">{email ?? namaPemilik}</span>.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Untuk membukanya lagi, masuk dengan email dan kata sandi yang sama.
        </p>
      </ModalKonfirmasi>
    </div>
  );
}
