import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { buatPembatas, ipDariHeader, kunciPercobaan } from "../lib/batasPercobaan";
import { KODE_LOGIN_DIBATASI, pesanGalatLogin } from "../lib/pesanLogin";
import { LoginDibatasiError, verifikasiLogin } from "../lib/verifikasiLogin";

const MENIT = 60_000;

function jamTiruan(awal = 1_000_000) {
  let waktu = awal;
  return { sekarang: () => waktu, maju: (ms: number) => (waktu += ms) };
}

describe("buatPembatas", () => {
  it("mengizinkan sampai batas, lalu menolak", () => {
    const jam = jamTiruan();
    const p = buatPembatas({ maks: 5, jendelaMs: 15 * MENIT, sekarang: jam.sekarang });
    for (let i = 0; i < 5; i += 1) {
      assert.equal(p.periksa("k").diizinkan, true, `percobaan ke-${i + 1}`);
      p.catat("k");
    }
    const hasil = p.periksa("k");
    assert.equal(hasil.diizinkan, false);
    if (!hasil.diizinkan) assert.equal(hasil.cobaLagiDetik, 15 * 60);
  });

  it("menghitung mundur sisa waktu jendela", () => {
    const jam = jamTiruan();
    const p = buatPembatas({ maks: 1, jendelaMs: 15 * MENIT, sekarang: jam.sekarang });
    p.catat("k");
    jam.maju(10 * MENIT);
    const hasil = p.periksa("k");
    assert.equal(hasil.diizinkan, false);
    if (!hasil.diizinkan) assert.equal(hasil.cobaLagiDetik, 5 * 60);
  });

  it("jendela dihitung dari percobaan pertama, bukan terakhir", () => {
    const jam = jamTiruan();
    const p = buatPembatas({ maks: 2, jendelaMs: 15 * MENIT, sekarang: jam.sekarang });
    p.catat("k");
    jam.maju(14 * MENIT);
    p.catat("k");
    assert.equal(p.periksa("k").diizinkan, false);
    jam.maju(1 * MENIT);
    assert.equal(p.periksa("k").diizinkan, true);
  });

  it("hitungan kembali ke nol setelah jendela habis", () => {
    const jam = jamTiruan();
    const p = buatPembatas({ maks: 2, jendelaMs: 15 * MENIT, sekarang: jam.sekarang });
    p.catat("k");
    p.catat("k");
    jam.maju(15 * MENIT);
    p.catat("k");
    assert.equal(p.periksa("k").diizinkan, true, "jendela baru baru berisi satu percobaan");
  });

  it("kunci berbeda punya jatah sendiri", () => {
    const p = buatPembatas({ maks: 1, jendelaMs: 15 * MENIT });
    p.catat("a");
    assert.equal(p.periksa("a").diizinkan, false);
    assert.equal(p.periksa("b").diizinkan, true);
  });

  it("hapus mengembalikan jatah penuh", () => {
    const p = buatPembatas({ maks: 1, jendelaMs: 15 * MENIT });
    p.catat("k");
    p.hapus("k");
    assert.equal(p.periksa("k").diizinkan, true);
  });

  it("tidak mengingat lebih dari kapasitas; kunci tertua dibuang", () => {
    const jam = jamTiruan();
    const p = buatPembatas({ maks: 1, jendelaMs: 15 * MENIT, kapasitas: 3, sekarang: jam.sekarang });
    for (const k of ["a", "b", "c", "d"]) p.catat(k);
    assert.ok(p.ukuran <= 3);
    assert.equal(p.periksa("a").diizinkan, true, "a paling lama, sudah dibuang");
    assert.equal(p.periksa("d").diizinkan, false);
  });

  it("kunci kedaluwarsa dibersihkan lebih dulu sebelum membuang yang masih berlaku", () => {
    const jam = jamTiruan();
    const p = buatPembatas({ maks: 1, jendelaMs: 15 * MENIT, kapasitas: 2, sekarang: jam.sekarang });
    p.catat("lama");
    jam.maju(15 * MENIT);
    p.catat("b");
    p.catat("c");
    assert.equal(p.periksa("b").diizinkan, false, "b masih berlaku, tidak ikut dibuang");
    assert.equal(p.periksa("c").diizinkan, false);
  });
});

describe("kunciPercobaan", () => {
  it("IP dan email yang digabung tidak bisa bertabrakan", () => {
    assert.notEqual(kunciPercobaan("1.2.3.4", "a@b.c"), kunciPercobaan("1.2.3.4a", "@b.c"));
  });
});

describe("ipDariHeader", () => {
  const dari = (h: Record<string, string>) => (n: string) => h[n];

  it("mendahulukan X-Real-IP yang ditimpa proxy", () => {
    assert.equal(ipDariHeader(dari({ "x-real-ip": "9.9.9.9", "x-forwarded-for": "1.1.1.1" })), "9.9.9.9");
  });

  it("memakai entri TERAKHIR X-Forwarded-For, bukan yang dikirim klien", () => {
    assert.equal(ipDariHeader(dari({ "x-forwarded-for": "6.6.6.6, 10.0.0.1, 8.8.8.8" })), "8.8.8.8");
  });

  it("jatuh ke 'tanpa-ip' bila tidak ada header", () => {
    assert.equal(ipDariHeader(dari({})), "tanpa-ip");
    assert.equal(ipDariHeader(dari({ "x-forwarded-for": " , " })), "tanpa-ip");
  });
});

describe("verifikasiLogin", () => {
  const HASH_ASLI = "hash-budi";
  const budi = { id: 1, email: "budi@mail.com", nama: "Budi", password: HASH_ASLI };

  function siapkan(maks = 5) {
    const hashDibandingkan: string[] = [];
    const deps = {
      cariUser: async (e: string) => (e === budi.email ? budi : null),
      bandingkan: async (password: string, hash: string) => {
        hashDibandingkan.push(hash);
        return hash === HASH_ASLI && password === "benar123";
      },
      pembatas: buatPembatas({ maks, jendelaMs: 15 * MENIT }),
    };
    return { deps, hashDibandingkan };
  }
  const ip = "1.2.3.4";

  it("mengembalikan user bila kata sandi benar", async () => {
    const { deps } = siapkan();
    const user = await verifikasiLogin({ email: "Budi@Mail.com", password: "benar123", ip }, deps);
    assert.equal(user?.id, 1);
  });

  it("tetap menjalankan bcrypt terhadap hash dummy saat email tidak terdaftar", async () => {
    const { deps, hashDibandingkan } = siapkan();
    const user = await verifikasiLogin({ email: "tono@mail.com", password: "apa saja", ip }, deps);
    assert.equal(user, null);
    assert.equal(hashDibandingkan.length, 1, "bcrypt tetap dipanggil tepat sekali");
    assert.match(hashDibandingkan[0], /^\$2[aby]\$10\$/, "hash dummy ber-cost 10 seperti pendaftaran");
  });

  it("memblokir setelah 5 kali gagal untuk IP + email yang sama", async () => {
    const { deps } = siapkan();
    for (let i = 0; i < 5; i += 1) {
      assert.equal(await verifikasiLogin({ email: "budi@mail.com", password: "salah", ip }, deps), null);
    }
    await assert.rejects(
      verifikasiLogin({ email: "budi@mail.com", password: "benar123", ip }, deps),
      (e: unknown) => e instanceof LoginDibatasiError && e.message.startsWith(`${KODE_LOGIN_DIBATASI}:`)
    );
  });

  it("variasi huruf besar email tidak memberi jatah baru", async () => {
    const { deps } = siapkan(2);
    await verifikasiLogin({ email: "budi@mail.com", password: "salah", ip }, deps);
    await verifikasiLogin({ email: "BUDI@mail.com", password: "salah", ip }, deps);
    await assert.rejects(verifikasiLogin({ email: " Budi@Mail.com ", password: "salah", ip }, deps));
  });

  it("saat diblokir, database dan bcrypt tidak disentuh", async () => {
    const { deps, hashDibandingkan } = siapkan(1);
    let query = 0;
    const cariUser = deps.cariUser;
    deps.cariUser = async (e) => {
      query += 1;
      return cariUser(e);
    };
    await verifikasiLogin({ email: "budi@mail.com", password: "salah", ip }, deps);
    await assert.rejects(verifikasiLogin({ email: "budi@mail.com", password: "salah", ip }, deps));
    assert.equal(query, 1);
    assert.equal(hashDibandingkan.length, 1);
  });

  it("login berhasil menghapus hitungan gagal", async () => {
    const { deps } = siapkan(3);
    await verifikasiLogin({ email: "budi@mail.com", password: "salah", ip }, deps);
    await verifikasiLogin({ email: "budi@mail.com", password: "salah", ip }, deps);
    await verifikasiLogin({ email: "budi@mail.com", password: "benar123", ip }, deps);
    for (let i = 0; i < 3; i += 1) {
      await verifikasiLogin({ email: "budi@mail.com", password: "salah", ip }, deps);
    }
    await assert.rejects(verifikasiLogin({ email: "budi@mail.com", password: "salah", ip }, deps));
  });

  it("IP lain tidak ikut terblokir", async () => {
    const { deps } = siapkan(1);
    await verifikasiLogin({ email: "budi@mail.com", password: "salah", ip }, deps);
    const user = await verifikasiLogin({ email: "budi@mail.com", password: "benar123", ip: "5.6.7.8" }, deps);
    assert.equal(user?.id, 1);
  });
});

describe("pesanGalatLogin", () => {
  it("kata sandi salah tidak menyebut mana yang salah", () => {
    assert.equal(pesanGalatLogin("CredentialsSignin"), "Email atau kata sandi salah.");
  });

  it("menyebut sisa menit saat dibatasi, dibulatkan ke atas", () => {
    assert.equal(
      pesanGalatLogin(`${KODE_LOGIN_DIBATASI}:61`),
      "Terlalu banyak percobaan masuk. Coba lagi dalam 2 menit."
    );
  });

  it("pesan umum untuk galat lain", () => {
    assert.equal(pesanGalatLogin(undefined), "Gagal masuk. Coba lagi sebentar lagi.");
    assert.equal(pesanGalatLogin("Configuration"), "Gagal masuk. Coba lagi sebentar lagi.");
  });
});
