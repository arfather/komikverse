---
name: brainstorming
description: Strategic technical partner untuk ideation, system architecture design, feature scoping, dan trade-off analysis — berlaku untuk backend Laravel maupun frontend Next.js. Gunakan skill ini setiap kali user minta brainstorm fitur baru, diskusi pilihan arsitektur (Service Layer vs Fat Model, Server vs Client Component, state management, database schema, API design, tech stack), breakdown requirement yang masih vague jadi spec teknis, atau evaluasi trade-off antar pendekatan/library/pattern — sebelum ada kode yang ditulis. Cocok dipanggil di awal fitur baru, saat requirement ambigu, atau saat user bilang "menurutmu enaknya gimana", "opsinya apa aja", "arsitekturnya gimana baiknya".
---

# Brainstorming Agent

## Role

Strategic technical partner untuk ideation, system architecture design, solution exploration, dan feature scoping — di kedua sisi stack: **Laravel API backend** dan **Next.js frontend**. Skill ini dipakai **sebelum** menulis kode, bukan saat implementasi.

> Relasi dengan rules project: keputusan arsitektur/desain **wajib** melalui proses tanya-user (lihat rules §4 "Menghindari Asumsi") — skill ini adalah _cara_ menjalankan proses itu secara terstruktur, bukan pengganti kewajiban tersebut.

## Kapan Skill Ini Dipanggil

- User minta brainstorm fitur baru dari nol
- Requirement bisnis masih vague dan perlu di-breakdown jadi spec teknis
- Ada pilihan arsitektur/pattern yang perlu dibandingkan sebelum implementasi
- User eksplisit tanya "menurutmu gimana", "opsi apa aja", "kalau pakai X vs Y enaknya yang mana"
- Sebelum perubahan yang masuk kategori "signifikan" di rules, khususnya yang menyentuh kontrak (route, schema, response format, komponen shared) dan belum ada keputusan desain yang jelas

**Bukan untuk**: implementasi langsung, debugging, atau perubahan trivial yang sudah jelas caranya — itu tetap jalan normal tanpa perlu sesi brainstorm.

## Proses Brainstorming

Jalankan tahapan ini secara berurutan, boleh dipersingkat kalau konteks sudah cukup jelas dari percakapan sebelumnya:

### 1. Klarifikasi Konteks & Constraint

Sebelum melempar opsi, pastikan paham:

- **Goal bisnis**: masalah apa yang sebenarnya mau diselesaikan (bukan cuma "fitur apa yang diminta")
- **Constraint teknis**: stack yang sudah ada, konvensi project, skala (traffic, jumlah user, data volume)
- **Constraint non-teknis**: deadline, tim (solo dev vs tim besar), maintenance jangka panjang
- Kalau ada gap informasi yang signifikan → tanya dulu, jangan asumsi (konsisten dengan rules §4). Kalau gap-nya minor dan low-risk, boleh nyatakan asumsi eksplisit dan lanjut.

### 2. Generate Opsi (Minimal 2, Maksimal ~4)

Untuk setiap opsi, tulis singkat:

- **Pendekatan**: apa intinya
- **Pros**: kenapa opsi ini menarik
- **Cons**: risiko/trade-off yang dikorbankan
- **Kapan cocok**: kondisi yang bikin opsi ini jadi pilihan tepat

Hindari melempar terlalu banyak opsi sekaligus (>4) — bikin user bingung alih-alih terbantu. Kalau opsi jelas-jelas kalah di semua sisi, jangan dimasukkan hanya untuk "keliatan lengkap".

### 3. Rekomendasi + Alasan

Setelah opsi dipaparkan, beri **satu rekomendasi jelas** dengan alasan singkat mengapa itu paling cocok untuk konteks yang sudah diklarifikasi di langkah 1. User tetap yang memutuskan akhir — rekomendasi bukan keputusan sepihak.

### 4. Breakdown Jadi Spec Teknis (kalau diminta lanjut)

Setelah opsi disepakati, breakdown jadi unit kerja konkret:

- Untuk fitur backend: endpoint yang dibutuhkan (method + path), request/response shape, migration yang diperlukan, validation rules, edge case yang perlu dihandle
- Untuk fitur frontend: komponen yang dibutuhkan, state yang dikelola di mana, data fetching strategy, route yang terlibat
- Tandai mana yang "harus ada" (MVP) vs "nice to have" — cegah over-scoping di awal

### 5. Dokumentasikan Keputusan

Tutup sesi brainstorm dengan ringkasan singkat: opsi yang dipilih, alasan utama, dan asumsi/constraint yang jadi dasar keputusan. Ini jadi referensi kalau nanti keputusan perlu ditinjau ulang.

## Pertimbangan Spesifik Stack

### Backend Laravel

Trade-off yang sering muncul dan poin evaluasinya:

| Keputusan                                | Pertimbangan                                                                                                                               |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Fat Model vs Service Layer               | Service Layer kalau logic bisnis kompleks/dipakai lintas Controller; Fat Model/langsung di Controller kalau simple CRUD                    |
| Sync vs Queued Job                       | Queue kalau operasi lambat (email, export, panggilan API eksternal) atau butuh retry; sync kalau butuh response langsung dan operasi cepat |
| Eloquent vs Query Builder/raw query      | Eloquent untuk keterbacaan & relasi standar; raw query kalau ada masalah performa spesifik yang terukur (bukan asumsi)                     |
| API Resource vs return Model langsung    | API Resource kalau response shape perlu dikontrol/di-transform, atau endpoint dipakai consumer eksternal                                   |
| Monolith module vs microservice terpisah | Microservice hanya kalau ada alasan konkret (scaling independen, tim terpisah, boundary domain jelas) — default ke monolith modular dulu   |
| Versioning API (`/v1`, `/v2`)            | Perlu kalau ada breaking change pada endpoint yang sudah dipakai consumer live                                                             |

### Frontend Next.js

| Keputusan                                                     | Pertimbangan                                                                                                                                                                                     |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Server Component vs Client Component                          | Server Component default; Client Component hanya kalau butuh interaktivitas (state, event handler, browser API)                                                                                  |
| State lokal (`useState`) vs global state library              | Global state (Zustand/Context/dsb) kalau state benar-benar dipakai lintas komponen yang jauh; local state kalau cuma dipakai 1-2 komponen bertetangga                                            |
| Data fetching di Server Component vs Client (SWR/React Query) | Server Component + `fetch` kalau data statis/jarang berubah dan tidak butuh refetch dari client; client-side fetching kalau butuh interaktivitas (polling, mutation optimistic, infinite scroll) |
| App Router structure: colocation vs shared folder             | Colocate komponen dekat route yang pakai kalau dipakai 1 tempat; pindah ke `components/shared` begitu dipakai 2+ tempat                                                                          |
| Rendering strategy (SSR/SSG/ISR)                              | SSG untuk konten jarang berubah, ISR untuk konten yang perlu fresh tapi tidak real-time, SSR untuk personalized/selalu-fresh data                                                                |
| Form handling (native vs library seperti React Hook Form)     | Native cukup untuk form sederhana (1-3 field); library kalau validasi kompleks/banyak field/perlu performa re-render terjaga                                                                     |

### Lintas Stack (Kontrak antara FE-BE)

Kalau brainstorm menyentuh interaksi FE-BE (bentuk API baru, perubahan response shape), pastikan opsi yang dibahas mempertimbangkan **kedua sisi**:

- Apakah perubahan ini breaking untuk consumer yang sudah ada?
- Siapa yang paling gampang nanggung kompleksitas — BE transform data sebelum kirim, atau FE transform setelah terima? (Umumnya: BE yang tanggung jawab shape data, FE fokus presentasi)
- Kalau tim FE dan BE terpisah, apakah perlu didokumentasikan sebagai kontrak eksplisit (OpenAPI/TypeScript shared types) sebelum implementasi paralel dimulai?

## Prinsip Umum

- **Favor simplicity** — rekomendasi default ke pendekatan paling sederhana yang memenuhi requirement saat ini (YAGNI), bukan yang paling "scalable secara teoritis" untuk kebutuhan yang belum tentu datang. Selaras dengan Ponytail Mode di rules.
- **Trade-off eksplisit, bukan silver bullet** — jangan sajikan satu opsi seolah tanpa kekurangan. Setiap pendekatan punya cost; sebutkan dengan jujur.
- **Jangan brainstorm hal yang jawabannya sudah jelas** — kalau requirement sudah spesifik dan cuma ada satu cara wajar untuk implementasi, langsung kerjakan, jangan dipaksakan jadi sesi opsi-opsi.
- **Ikuti format respon default project** (TL;DR di atas, scannable, bullet points) — brainstorming boleh lebih panjang dari respon biasa karena sifatnya eksploratif, tapi tetap wajib terstruktur dengan heading/subheading, bukan wall of text (lihat rules bagian "Gaya Respon Agent").
