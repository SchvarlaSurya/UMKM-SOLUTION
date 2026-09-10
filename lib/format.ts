/** Format angka jadi Rupiah dengan pemisah ribuan: 17225 -> "Rp 17.225". */
export function formatRupiah(nilai: number): string {
  return `Rp ${Math.round(nilai).toLocaleString("id-ID")}`;
}

/** Format persentase satu desimal ala Indonesia: 21.74 -> "21,7%". */
export function formatPersen(nilai: number, desimal = 1): string {
  return `${nilai.toLocaleString("id-ID", {
    minimumFractionDigits: desimal,
    maximumFractionDigits: desimal,
  })}%`;
}

/** Format tanggal panjang: "9 September 2026". */
export function formatTanggal(tanggal: Date | string): string {
  const d = typeof tanggal === "string" ? new Date(tanggal) : tanggal;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Format tanggal pendek untuk sumbu grafik: "10 Agu". */
export function formatTanggalPendek(tanggal: Date | string): string {
  const d = typeof tanggal === "string" ? new Date(tanggal) : tanggal;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

/** Ambil inisial dari nama untuk avatar: "Dapur Bu Sari" -> "DB". */
export function inisial(nama: string): string {
  return nama
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((kata) => kata[0]?.toUpperCase() ?? "")
    .join("");
}
