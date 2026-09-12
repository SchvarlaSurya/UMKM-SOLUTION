import { IconCentang, IconLogo } from "@/components/ui/icons";

/**
 * Sisi dekoratif halaman masuk & daftar.
 *
 * Isinya berbeda menurut keadaan pengunjung: yang kembali diingatkan pada
 * angka yang menunggunya, yang baru diberi gambaran apa yang akan didapat.
 * Hanya tampil dari lg ke atas; di layar kecil ruangnya dipakai form.
 */

type Varian = "masuk" | "daftar";

const ISI: Record<Varian, { hook: string; kalimat: string; poin: string[] }> = {
  masuk: {
    hook: "Angkanya sudah menunggu.",
    kalimat:
      "Harga bahan bergerak diam-diam. Masuk sebentar, lihat mana produk yang marginnya mulai bocor hari ini.",
    poin: [
      "HPP terhitung ulang tiap harga bahan berubah",
      "Produk bermargin tipis ditandai otomatis",
      "Riwayat harga tersimpan sendiri",
    ],
  },
  daftar: {
    hook: "Setiap porsi, terhitung.",
    kalimat:
      "Catat bahan dan biaya sekali, lalu biarkan HPP dan margin tiap produk terhitung sendiri — termasuk gas, listrik, dan komisi aplikasi.",
    poin: [
      "Tidak perlu rumus atau spreadsheet",
      "Biaya kecil yang sering luput ikut dihitung",
      "Data usahamu terpisah dari pengguna lain",
    ],
  },
};

/** Dedaunan dan rempah, digambar seadanya dengan warna brand. Dekoratif saja. */
function IlustrasiDapur() {
  return (
    <svg
      viewBox="0 0 320 260"
      fill="none"
      aria-hidden="true"
      className="h-auto w-full max-w-sm"
    >
      <circle cx="160" cy="130" r="108" fill="currentColor" opacity="0.08" />
      <circle cx="160" cy="130" r="74" fill="currentColor" opacity="0.08" />

      {/* Tangkai utama dengan daun berpasangan */}
      <path
        d="M160 214V96"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.55"
      />
      {[0, 1, 2].map((baris) => {
        const y = 118 + baris * 30;
        return (
          <g key={baris} opacity={0.75 - baris * 0.12}>
            <path
              d={`M160 ${y}c-26 0-42-10-46-26 20-8 40-2 46 26Z`}
              fill="currentColor"
              opacity="0.5"
            />
            <path
              d={`M160 ${y}c26 0 42-10 46-26-20-8-40-2-46 26Z`}
              fill="currentColor"
              opacity="0.35"
            />
          </g>
        );
      })}

      {/* Pucuk */}
      <path
        d="M160 96c0-20 10-34 28-40 2 22-8 36-28 40Z"
        fill="currentColor"
        opacity="0.6"
      />

      {/* Butiran rempah yang berserak */}
      {[
        [78, 74],
        [246, 86],
        [96, 186],
        [236, 178],
        [120, 58],
        [214, 214],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={i % 2 === 0 ? 5 : 3.5} fill="currentColor" opacity="0.3" />
      ))}

      {/* Garis dasar, seperti permukaan meja */}
      <path
        d="M96 214h128"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
}

export function PanelSambutan({ varian }: { varian: Varian }) {
  const { hook, kalimat, poin } = ISI[varian];

  return (
    <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary px-10 py-12 text-primary-foreground lg:flex">
      <div className="flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-card bg-primary-foreground/15">
          <IconLogo width={20} height={20} />
        </span>
        <span className="text-base font-semibold tracking-tight">ruangmargin</span>
      </div>

      <div className="relative">
        <div className="flex justify-center text-primary-foreground">
          <IlustrasiDapur />
        </div>

        <h2 className="mt-8 text-3xl font-semibold tracking-tight text-balance">{hook}</h2>
        <p className="mt-3 max-w-md text-sm/6 text-primary-foreground/80">{kalimat}</p>

        <ul className="mt-6 flex flex-col gap-2.5">
          {poin.map((baris) => (
            <li key={baris} className="flex items-start gap-2.5 text-sm text-primary-foreground/90">
              <IconCentang width={16} height={16} className="mt-0.5 shrink-0" />
              {baris}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-primary-foreground/70">
        Kenali angka. Jaga untung.
      </p>
    </aside>
  );
}
