"use client";

import { useEffect, useId, useRef, type MouseEvent, type ReactNode } from "react";
import { animate, utils } from "animejs";
import { cn } from "@/lib/cn";
import { durasiGerak } from "@/lib/gerak";
import { Button } from "./Button";
import { IconTutup } from "./icons";

/** Membuka lebih lambat dari menutup: membatalkan harus terasa langsung. */
const DURASI_BUKA = 200;
const DURASI_TUTUP = 150;
/** Lembar bawah menempuh jarak jauh lebih panjang, jadi diberi waktu lebih. */
const DURASI_BUKA_LEMBAR = 280;
const DURASI_TUTUP_LEMBAR = 200;

/** Sama dengan breakpoint `sm` Tailwind, tempat modal berhenti jadi lembar. */
const LAYAR_KECIL = "(max-width: 639.98px)";

function berbentukLembar() {
  return window.matchMedia(LAYAR_KECIL).matches;
}

/**
 * Keadaan modal sebelum masuk dan sesudah keluar. `--opasitas-latar` dibaca
 * `dialog::backdrop` di globals.css — pseudo-element tidak bisa dijadikan
 * target anime.js, jadi kegelapan latarnya dititipkan lewat custom property.
 *
 * Bentuknya berbeda menurut lebar layar. Di layar kecil modalnya menempel ke
 * tepi bawah, jadi yang masuk akal adalah menggeser naik dari bawah layar,
 * tanpa memudar dan tanpa mengecil: lembar yang ikut memudar terbaca seperti
 * dialog yang kebetulan berada di bawah, bukan sesuatu yang ditarik masuk.
 * Satuannya dijaga tetap persen di kedua ujung, karena beralih dari "100%" ke
 * 0 tanpa satuan membuat anime.js menafsirkannya sebagai piksel.
 */
const TERSEMBUNYI_DIALOG = {
  opacity: 0,
  scale: 0.96,
  translateY: 8,
  "--opasitas-latar": 0,
};

const TERLIHAT_DIALOG = {
  opacity: 1,
  scale: 1,
  translateY: 0,
  "--opasitas-latar": 1,
};

const TERSEMBUNYI_LEMBAR = {
  opacity: 1,
  scale: 1,
  translateY: "100%",
  "--opasitas-latar": 0,
};

const TERLIHAT_LEMBAR = {
  opacity: 1,
  scale: 1,
  translateY: "0%",
  "--opasitas-latar": 1,
};

/**
 * Pola modal sesuai dokumentasi prototipe bagian 7:
 * judul + subjudul deskriptif -> konten -> aksi kanan bawah
 * (sekunder di kiri, primer di kanan).
 *
 * Memakai <dialog> native: Esc menutup, fokus otomatis dikelola browser,
 * latar belakang tidak bisa di-tab.
 */
export function Modal({
  terbuka,
  onTutup,
  judul,
  subjudul,
  children,
  aksiPrimer,
  aksiSekunder,
  lebar = "md",
}: {
  terbuka: boolean;
  onTutup: () => void;
  judul: string;
  subjudul?: ReactNode;
  children: ReactNode;
  aksiPrimer?: ReactNode;
  aksiSekunder?: ReactNode;
  lebar?: "md" | "lg";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  // Animasi keluar hanya boleh berjalan sekali. Tanpa penjaga ini, efek yang
  // dijalankan dua kali (Strict Mode di pengembangan) memutar dua animasi dan
  // memanggil close() dua kali, sehingga `onTutup` ikut terpanggil ganda.
  const sedangMenutup = useRef(false);
  const idJudul = useId();
  const idSubjudul = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    // Bentuknya dibaca tiap kali animasi dimulai, bukan sekali saja: pengguna
    // bisa memutar perangkatnya selagi modal terbuka.
    const lembar = berbentukLembar();

    if (terbuka) {
      utils.remove(dialog);
      sedangMenutup.current = false;

      if (!dialog.open) {
        // Keadaan awal ditulis sebelum showModal(). Efek ini memang berjalan
        // setelah paint, tapi saat paint itu dialognya masih tertutup dan
        // tidak tergambar sama sekali, jadi tidak ada kedipan.
        utils.set(dialog, lembar ? TERSEMBUNYI_LEMBAR : TERSEMBUNYI_DIALOG);
        dialog.showModal();
      }

      // Tanpa nilai awal, dan tidak berhenti lebih dulu kalau dialog sudah
      // terbuka: membuka kembali di tengah animasi keluar harus membalikkan
      // arahnya dari posisi saat itu, bukan membiarkannya tertinggal separuh.
      animate(dialog, {
        ...(lembar ? TERLIHAT_LEMBAR : TERLIHAT_DIALOG),
        duration: durasiGerak(lembar ? DURASI_BUKA_LEMBAR : DURASI_BUKA),
        ease: "outQuint",
      });
      return;
    }

    if (!dialog.open || sedangMenutup.current) return;

    // close() mencabut dialog dari top layer seketika, jadi animasi keluar
    // harus selesai lebih dulu — bukan sekadar menunda pelepasan dari DOM.
    sedangMenutup.current = true;
    utils.remove(dialog);
    animate(dialog, {
      ...(lembar ? TERSEMBUNYI_LEMBAR : TERSEMBUNYI_DIALOG),
      duration: durasiGerak(lembar ? DURASI_TUTUP_LEMBAR : DURASI_TUTUP),
      ease: "inQuad",
      onComplete: () => {
        sedangMenutup.current = false;
        dialog.close();
      },
    });
  }, [terbuka]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    // Esc bawaan menutup dialog seketika dan melewati animasi keluar. Dibatalkan
    // di sini lalu dialirkan ke onTutup, supaya jalurnya sama dengan tombol
    // tutup dan klik latar: induk mematikan `terbuka`, efek di atas yang
    // menganimasikan lalu memanggil close().
    const tanganiBatal = (peristiwa: Event) => {
      peristiwa.preventDefault();
      onTutup();
    };
    const tanganiTutup = () => onTutup();

    dialog.addEventListener("cancel", tanganiBatal);
    dialog.addEventListener("close", tanganiTutup);
    return () => {
      dialog.removeEventListener("cancel", tanganiBatal);
      dialog.removeEventListener("close", tanganiTutup);
    };
  }, [onTutup]);

  function klikBackdrop(e: MouseEvent<HTMLDialogElement>) {
    if (e.target === ref.current) onTutup();
  }

  return (
    <dialog
      ref={ref}
      onClick={klikBackdrop}
      aria-labelledby={idJudul}
      aria-describedby={subjudul ? idSubjudul : undefined}
      className={cn(
        // `open:flex`, bukan `flex`: gaya penulis mengalahkan gaya bawaan
        // peramban, jadi `display: flex` tanpa syarat akan membatalkan
        // `dialog:not([open]) { display: none }` dan modalnya ikut tergambar
        // saat tertutup.
        "flex-col overflow-hidden border border-border bg-card p-0 text-foreground open:flex",
        "backdrop:bg-foreground/40",

        // Layar kecil: lembar yang menempel ke tepi bawah. Sebelumnya modalnya
        // selebar `100vw - 2rem`, menyisakan 16px latar di kiri dan kanan —
        // terlalu sempit untuk terbaca sebagai dialog mengambang, terlalu
        // lebar untuk terbaca sebagai lembar penuh. Sudut bawah dan garis tepi
        // samping ikut dilepas supaya tepinya benar-benar menyatu dengan layar.
        "mt-auto mb-0 w-full max-w-none rounded-card rounded-b-none border-x-0 border-b-0",
        // 90dvh, bukan penuh: sisa di atasnya memberi tahu bahwa halaman masih
        // ada di belakang, sekaligus jadi tempat menekan untuk menutup.
        "max-h-[90dvh]",

        // sm ke atas: dialog mengambang di tengah, seperti sebelumnya.
        "sm:m-auto sm:max-h-[calc(100dvh-2rem)] sm:w-[calc(100vw-2rem)]",
        "sm:rounded-b-card sm:border-x sm:border-b",
        lebar === "lg" ? "sm:max-w-2xl" : "sm:max-w-lg",
      )}
    >
      <div className="flex shrink-0 items-start justify-between gap-4 px-5 pt-5">
        <div>
          <h2 id={idJudul} className="text-base font-semibold">
            {judul}
          </h2>
          {subjudul && (
            <p id={idSubjudul} className="mt-1 text-sm text-muted-foreground">
              {subjudul}
            </p>
          )}
        </div>
        <Button
          varian="ghost"
          ukuran="sm"
          onClick={onTutup}
          aria-label="Tutup"
          className="-mr-1 -mt-1 px-2"
        >
          <IconTutup />
        </Button>
      </div>

      {/*
        Yang menggulir sekarang badan modalnya, bukan seluruh dialog. Dengan
        begitu baris aksi tetap menempel di dasar dan tidak ikut hanyut ke
        bawah isi yang panjang: di form produk & resep, tombol Simpan tadinya
        berada 469px di bawah lipatan pada resep dua bahan, dan 775px pada
        empat bahan — makin rumit resepnya, makin jauh tombol simpannya.

        `min-h-0` wajib: anak flex tidak boleh menyusut di bawah tinggi
        isinya tanpa itu, dan gulirannya tidak akan pernah terbentuk.
      */}
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>

      {(aksiPrimer || aksiSekunder) && (
        <div
          className={cn(
            "flex shrink-0 items-center justify-between gap-3 border-t border-border bg-card px-5 py-4",
            // Sebagai lembar, baris ini menempel persis di tepi bawah layar.
            // Di perangkat dengan indikator home, tombolnya jatuh tepat di
            // bawah garis itu; `safe-area-inset-bottom` mengembalikan ruangnya.
            "pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pb-4",
          )}
        >
          <div>{aksiSekunder}</div>
          <div>{aksiPrimer}</div>
        </div>
      )}
    </dialog>
  );
}
