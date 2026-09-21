# Agent Rules: Vite + React Router Frontend

_Versi: 2.0 — Terakhir diperbarui: 2025-07-26_
_Changelog: v2.0 disesuaikan dengan stack aktual project: Vite + React Router + TypeScript + Zustand + Tailwind CSS (bukan Next.js)._

> Catatan: Untuk cara teknis menggunakan tool `codebase-memory-mcp` (command CLI, urutan prioritas tool investigasi kode), lihat skill terpisah **`codebase-memory-usage`**. Dokumen ini hanya berisi kebijakan/batasan — bukan panduan teknis penggunaan tool.

## Kebijakan Analisis & Perubahan Kode

Agent **WAJIB** memprioritaskan analisis via `codebase-memory-mcp` (lihat skill `codebase-memory-usage`) sebelum melakukan perubahan kode yang **signifikan**, yaitu jika salah satu kondisi ini terpenuhi:

- Menyentuh **lebih dari 1 file**, ATAU
- Perubahan **lebih dari ~15 baris**, ATAU
- Menyangkut fungsi/komponen/hook yang dipakai di tempat lain (butuh cek dependency), ATAU
- Menambah/mengubah **route (React Router)**, **API contract**, atau kontrak antar-modul (props interface, shared type, context)

**Perubahan trivial** (typo, ubah string/konstanta, komentar, styling CSS kecil, log statement) **boleh langsung dieksekusi** tanpa trace codebase memory dulu — supaya nggak lambat buat hal sepele.

Jika ragu apakah termasuk "signifikan" atau "trivial" → default ke trace dulu (safer default).

### Cakupan "Signifikan" untuk Perubahan Non-Kode

Kriteria di atas ditulis dengan asumsi implisit "kode" — untuk file konfigurasi/infra, berlaku perluasan berikut:

- **`.env.example`, `vite.config.ts`, `docker-compose.yml`, config CI/CD (GitHub Actions, dsb)** → **selalu dianggap signifikan**, terlepas dari jumlah baris, karena berpotensi mengubah kontrak build/deploy/runtime.
- **File config yang dibaca banyak komponen/route** (misal `tailwind.config.js`, `tsconfig.json`, shared context/provider di `src/providers.tsx` atau `src/lib/store.ts`) → signifikan jika mengubah key/value yang direferensikan lintas modul; trivial jika hanya mengubah komentar atau formatting.
- **Dokumentasi murni** (README, `.md` non-agent-rules) → tetap trivial, tidak perlu trace, kecuali dokumen tersebut adalah spesifikasi kontrak (API docs/design system docs yang jadi source of truth).
- Kalau ragu apakah suatu file config termasuk "kontrak antar-modul" → default ke trace dulu (konsisten dengan safer default di atas).

## Kebijakan Tambahan & Batasan Keamanan

### 1. Build Frontend

Dilarang menjalankan `npm run build`, `vite build`, atau perintah sejenis yang **menempati/mengganggu port server lokal yang sedang aktif** (mis. `vite dev` yang lagi jalan di port 5173).

**Exception yang diizinkan** (tidak menyentuh port dev):

- `tsc --noEmit` atau type-check sejenis
- `vite build` **hanya jika** dijalankan dengan output ke folder terpisah dan port berbeda dari dev server aktif, atau di environment CI/sandbox terpisah
- Lint/format check (`eslint`, `prettier --check`)

Jika ragu apakah suatu command aman → tanyakan ke user dulu sebelum eksekusi.

### 2. Database

Dilarang keras menghapus atau memodifikasi data database dalam bentuk apa pun — **tanpa konfirmasi eksplisit dari user**. (Berlaku jika frontend punya API route yang langsung akses DB, mis. via Supabase client di `src/lib/supabase.ts`.)

### 3. Data Hasil Testing

Jika pengujian (E2E/integration, mis. Playwright/Cypress) mengharuskan penambahan data ke database:

- Catat/tandai data testing tersebut (misal prefix nama, flag khusus) agar mudah diidentifikasi
- **Wajib dihapus kembali** setelah selesai uji coba
- Jika proses cleanup gagal/terlewat, laporkan ke user secara eksplisit — jangan biarkan tanpa laporan

### 4. Menghindari Asumsi (dengan nuansa)

- **Keputusan arsitektur/desain** (mis. state management library, struktur folder, routing pattern), **ambiguitas requirement bisnis, atau hal yang berdampak luas** → **wajib tanya user**, dilarang asumsi.
- **Detail kecil yang reasonable & low-risk** (misal penamaan variabel lokal, format pesan log, urutan import) → **boleh jalan dengan asumsi wajar**, tapi **wajib nyatakan asumsi itu** secara eksplisit di respon (misal: "Asumsi: saya pakai format tanggal ISO 8601 karena belum ada standar eksplisit di codebase").

### 5. Version Control (Git)

- Dilarang `git push --force` ke branch shared (main/develop/staging) tanpa konfirmasi eksplisit user.
- Dilarang `git reset --hard` atau `git clean -fd` tanpa konfirmasi (berpotensi hilang kerja belum ter-commit).
- Commit message wajib deskriptif (bukan "fix", "update", "wip") — jelaskan **apa** dan **kenapa**.
- Jangan commit langsung ke branch utama jika repo punya konvensi branching (feature/fix branch) — cek konvensi yang ada dulu.
- **Branch naming fallback**: kalau repo **belum punya konvensi branching** yang jelas, tanya user dulu preferensi naming (misal `feature/`, `fix/`, `chore/`). Kalau user nggak respon dan mendesak lanjut → default ke `feature/<deskripsi-singkat-kebab-case>` sambil nyatakan asumsi ini eksplisit di respon.

### 6. Secrets & Environment

- Dilarang menampilkan, mencetak (print/log), atau meng-commit isi file `.env`/`.env.local`, API key, token, credential, atau secret apa pun.
- Perhatikan khusus Vite: variabel dengan prefix `VITE_` sudah didesain untuk exposed ke client, jadi **bukan** secret — tapi variabel tanpa prefix itu (server-only) tetap wajib dijaga seperti secret pada umumnya. Jangan sampai secret server-only tidak sengaja diberi prefix `VITE_` atau dipakai di client code.
- Jika perlu referensi env variable, sebut **nama variabelnya saja**, jangan nilainya.
- Pastikan `.env`, `.env.local`, dan file secret sejenis tetap ada di `.gitignore`; jika belum, beri tahu user.
- **Guard pada output tool** (`get_code_snippet`, `search_graph`, `grep_search`, atau tool manapun yang mengembalikan isi file): sebelum menampilkan hasil ke user atau menyertakannya dalam respon/commit, agent **wajib** memeriksa apakah snippet tersebut mengandung pola yang menyerupai secret (misal `API_KEY=`, `-----BEGIN PRIVATE KEY-----`, token panjang high-entropy, connection string dengan password embedded). Jika terdeteksi:
  - **Redact** nilainya (ganti dengan `[REDACTED]`), tampilkan hanya struktur/nama variabelnya.
  - Beri tahu user bahwa ada kemungkinan secret hardcoded ditemukan di file tersebut, dan sarankan untuk dipindahkan ke `.env`.
- Hal ini berlaku juga untuk file yang diambil lewat `codebase-memory-mcp` maupun fallback CLI/grep — sumber tool tidak mengubah kewajiban redaction ini.

### 7. Testing & Verifikasi

Agent **WAJIB** menjalankan verifikasi sebelum menyatakan task **selesai**:

- Untuk perubahan **signifikan** (sesuai kriteria di bagian atas) → jalankan test suite relevan (unit/integration/component test yang menyentuh file yang diubah) sebelum lapor "done"
- Jika **fitur/komponen baru** ditambahkan tanpa test coverage yang ada → tulis minimal test dasar (happy path/render test), **kecuali** user eksplisit bilang skip
- Jika test **gagal** dijalankan (environment issue, dsb) → laporkan eksplisit ke user, jangan diam-diam skip dan bilang "selesai"
- Lint/type-check (`tsc --noEmit`, `eslint`, dsb) **wajib** dijalankan untuk perubahan >1 file sebelum commit

### 8. Resolusi Konflik Antar-Aturan

Kalau ada perubahan yang kelihatannya **trivial** (misal: ubah 1 baris string) tapi ternyata **menyentuh route/schema/kontrak antar-modul** → kondisi "signifikan" **selalu menang**. Urutan cek:

1. Cek dulu apakah menyentuh route/schema/dependency lintas modul (termasuk shared component/hook/context)
2. Baru cek jumlah baris/file
3. Kalau ragu di langkah manapun → default ke trace dulu (safer default, sesuai kebijakan awal)

### 9. Dependency & Package Baru

Sebelum menambah dependency baru (`npm install`, `pnpm add`, dsb):

- **Pin versi eksplisit** (bukan `^` atau `latest`) kecuali user minta lain
- Kalau package punya known vulnerability (cek `npm audit` kalau tool tersedia) → beri tahu user sebelum install, jangan diam-diam lanjut
- Dilarang install package yang **tidak dipakai langsung** di kode (no speculative/"just in case" deps)
- Tambahan dependency baru masuk kategori **signifikan** → wajib disebutkan alasannya di commit message
- Perhatikan bundle size — untuk library besar, pertimbangkan alternatif ringan kecuali sudah jadi convention project

### 10. Rollback Policy

Kalau perubahan yang sudah dilaporkan "selesai" ternyata menyebabkan masalah (test baru gagal setelah deploy, bug regresi ditemukan, dsb):

- **Perubahan signifikan yang belum di-push ke shared branch** → agent boleh langsung `git revert`/`git reset` pada branch lokal/feature branch miliknya sendiri, tanpa perlu konfirmasi tambahan (karena belum shared), tapi tetap wajib laporkan ke user apa yang di-revert dan kenapa.
- **Perubahan yang sudah di-push ke shared branch (main/develop/staging)** → **wajib tanya user dulu** sebelum revert, sama seperti aturan force-push (§5). Jangan revert commit orang lain tanpa konfirmasi.
- **Perubahan yang menyentuh database** (migration, seed) → rollback migration **wajib** pakai mekanisme rollback resmi ORM. Jika mekanisme rollback tidak ada atau tidak reversible → **wajib** lapor ke user sebelum melakukan apa pun, karena berisiko data loss (lihat §2).
- Setiap rollback, baik lokal maupun shared, **wajib dicatat** di respon ke user: apa yang di-revert, kenapa, dan status akhirnya (berhasil/gagal/butuh manual intervention).
- Kalau rollback sendiri gagal (misal conflict saat revert) → **jangan** coba force-resolve secara sepihak — stop dan minta arahan user.

### 11. Audit Trail & Observability

Agent wajib menjaga jejak aktivitas yang bisa ditelusuri, terpisah dari git history:

- Untuk setiap task yang melibatkan perubahan **signifikan**, sertakan ringkasan singkat di respon akhir: tool apa saja yang dipakai untuk investigasi (`trace_path`, `grep_search`, dsb), file apa saja yang disentuh (Component/Hook/Route/Store/dsb), dan hasil verifikasi (test/lint) — bukan cuma "done", tapi "done, berikut yang saya cek".
- Kalau agent mengambil fallback (misal codebase-memory-mcp gagal → grep manual), itu **wajib** disebutkan eksplisit di respon, bukan cuma dicatat internal.
- Kalau ada command yang dijalankan tapi hasilnya tidak dipakai/tidak relevan (dead end), tidak perlu dilaporkan detail — cukup ringkas di TL;DR kalau itu mempengaruhi durasi/pendekatan.
- Tujuan section ini bukan menambah birokrasi, tapi memastikan user bisa audit "kenapa agent yakin ini aman" tanpa harus re-trace semua langkah sendiri.

### 12. Vite + React Router Specific: Routing & Data Fetching

- Perubahan **route React Router** (`src/pages/*.tsx`, `src/App.tsx` routes config) yang mengubah path/params/loader → selalu signifikan, karena berdampak ke navigasi dan SEO.
- **API contract** (response shape dari `fetchEncrypted` di `src/lib/crypto.ts`, Supabase schema di `src/lib/supabase.ts`) → perubahan di sini termasuk signifikan, potensi breaking change.
- **Global store** (`src/lib/store.ts` — Zustand) yang mengubah state shape/action signature → selalu signifikan, karena dipakai lintas komponen.
- **Environment config** (`vite.config.ts`, `.env`) yang mengubah proxy/API base URL → selalu signifikan.

## Gaya Respon Agent (ADHD Mode - Default)

Agent **WAJIB** menggunakan format respon ADHD-friendly secara default:

1. **TL;DR di Atas** — poin utama/ringkasan jawaban selalu di paling atas.
2. **Singkat & Direct** — langsung ke inti, tanpa basa-basi.
3. **Visual & Scannable** — bullet points, **bold** pada kata kunci, pemisah visual jelas.
4. **Bite-Sized Steps** — instruksi teknis disajikan sebagai langkah-langkah kecil yang mudah dieksekusi.

**Exception clause:** Untuk keputusan **arsitektur/desain kompleks** (mis. pilih state management, routing strategy, caching) yang butuh penjelasan trade-off, agent boleh keluar dari format bullet-singkat, TAPI:

- Tetap wajib ada **TL;DR di atas** sebagai ringkasan sebelum elaborasi panjang
- Elaborasi panjang harus tetap terstruktur (heading/subheading), bukan wall of text

## 13. Gaya Kode (Ponytail Mode)

Agent WAJIB berpikir seperti senior dev yang malas — malas dalam artian efisien, bukan asal-asalan. Kode terbaik adalah kode yang tidak pernah ditulis.

### Urutan Cek Sebelum Menulis Kode Baru

Sebelum implementasi apa pun, agent wajib berhenti di rung pertama yang terpenuhi, urut dari atas:

1. **Perlu dibangun sama sekali?** → Kalau tidak, skip (YAGNI).
2. **Standard library/bahasa (TS/JS) sudah bisa?** → Pakai itu.
3. **Native platform/browser feature sudah cover?** → Pakai itu (contoh: `<input type="date">` daripada install date-picker library; native `<dialog>` daripada modal library kalau requirement sederhana).
4. **Fitur bawaan Vite/React Router sudah cover?** → Pakai itu (contoh: `React.lazy` + `Suspense` untuk code splitting, `useNavigate`/`useParams` untuk routing, `<Outlet>` untuk nested routes).
5. **Dependency yang sudah terpasang di project bisa menyelesaikan?** → Pakai itu, jangan tambah dependency baru (cek `package.json`: Zustand, Radix UI, React Hook Form, Zod, date-fns, lucide-react, dll).
6. **Bisa diselesaikan dalam satu baris/komponen kecil?** → Tulis itu saja.
7. Baru kalau semua di atas tidak cukup → tulis kode minimum yang berfungsi.

### Aturan Turunan

- Dilarang membuat abstraksi (custom hook, wrapper component, HOC, context provider terpisah, dsb) yang tidak diminta eksplisit oleh user atau tidak dibutuhkan oleh requirement yang ada.
- Dilarang menambah dependency baru kalau masih bisa dihindari — ini memperketat §9, bukan menggantikannya (kalau memang perlu dependency baru, §9 tetap berlaku penuh: pin versi, cek vulnerability, sebutkan alasan di commit).
- Dilarang menulis boilerplate yang tidak diminta (contoh: bikin full CRUD page + form + table lengkap padahal cuma diminta satu komponen display sederhana).
- Prioritaskan deletion over addition — kalau ada cara menghapus/menyederhanakan kode existing (component gemuk, prop drilling, logic duplikat) yang mencapai efek sama, tawarkan itu ke user (terutama saat diminta review/refactor).
- Boring over clever — hindari pattern/trik pintar (over-abstracted render props, magic generic types) yang sulit dibaca demi "elegan"; pilih yang paling mudah dipahami dev lain.
- Fewest files possible — jangan pecah kode ke banyak file kecil (Trait/Interface/Helper terpisah) kalau tidak ada alasan struktural yang jelas.
- Kalau user minta sesuatu yang kelihatan over-engineered untuk kebutuhannya (mis. minta state management library global buat satu form sederhana), agent boleh tanya balik: "Apakah benar butuh X, atau `useState` lokal sudah cukup?" — tapi kalau user tetap insist setelah ditanya, jalankan sesuai permintaan user, jangan menolak.
- Setiap simplifikasi/shortcut yang disengaja (misal skip edge case tertentu, pakai library bawaan alih-alih custom logic) wajib ditandai dengan komentar `// ponytail: <alasan singkat + upgrade path>` di kode, supaya reviewer/dev berikutnya tahu itu keputusan sadar, bukan kelalaian.

### Batas — Tidak Berlaku "Malas" untuk:

Prinsip di atas tidak pernah jadi alasan mengorbankan hal berikut — ini best-effort penuh, bukan area shortcut:

- **Validasi input di trust boundary** (form input, data dari API eksternal, Supabase)
- **Error handling yang mencegah data loss**
- **Security** (auth, sanitasi, secrets — konsisten dengan §6, terutama proteksi server-only env dari client code)
- **Accessibility** (semantic HTML, keyboard navigation, ARIA attribute yang relevan — untuk kode UI/komponen)
- Apa pun yang diminta eksplisit oleh user — kalau user secara spesifik minta abstraksi/pattern tertentu, itu bukan lagi "abstraksi yang tidak diminta"

### Relasi dengan Kriteria "Signifikan" (bagian atas dokumen)

Ponytail Mode tidak mengubah definisi "perubahan signifikan" di bagian atas — trace via codebase-memory-mcp tetap wajib sesuai kriteria yang sudah ada, terlepas dari seberapa sedikit baris kode yang akhirnya ditulis. Justru sebaliknya: makin sedikit kode yang ditulis, makin penting memastikan solusi minimal itu memang cocok dengan konteks codebase existing (nama komponen/hook yang sudah ada, pattern yang sudah dipakai, dependency yang sudah ada) — jadi trace/search_graph di awal tetap relevan untuk menemukan solusi minimal itu, bukan cuma untuk perubahan besar.

## 14. Spesifikasi Stack Frontend (Strict Rules)

- **Bahasa & Ekstensi File:** Gunakan **TypeScript / TSX (`.tsx` / `.ts`)**. Project sudah pakai TypeScript — **wajib mempertahankan type safety**.
- **Styling:** Gunakan **Tailwind CSS** untuk semua styling UI & komponen (sudah terpasang + shadcn/ui theme).
- **Router:** Gunakan **React Router v6** (`react-router-dom`, `src/App.tsx` untuk route config, `src/pages/` untuk page components).
- **HTTP Client / API Calls:** Wajib menggunakan **`fetchEncrypted`** dari `src/lib/crypto.ts` untuk call ke API backend (handle enkripsi/dekripsi otomatis). Dilarang membuat `fetch` manual atau Axios instance baru jika `fetchEncrypted` sudah cover kebutuhan. Untuk Supabase analytics: gunakan client dari `src/lib/supabase.ts`.
- **State Management:** Gunakan **Zustand** (`src/lib/store.ts`) untuk global state (bookmarks, reading history, theme, reader settings, cache comic data, dll). Native React State (`useState`, `useContext`) untuk local component state. Penyimpanan persist via `localStorage`/`sessionStorage` (Zustand `persist` middleware sudah dipakai).
- **UI Components:** Gunakan **shadcn/ui** (Radix UI + Tailwind) dari `src/components/ui/` — sudah tersedia 40+ komponen. Import: `import { Button } from '@/components/ui/button'`.
- **Forms:** Gunakan **React Hook Form + Zod** (`@hookform/resolvers/zod`) untuk validasi form.
- **Animations:** Gunakan **Framer Motion** untuk animasi kompleks, Tailwind `animate-*` untuk simple transitions.
- **Icons:** Gunakan **lucide-react** (sudah terpasang).
- **Date Handling:** Gunakan **date-fns** (sudah terpasang).
- **Analytics/Tracking:** Gunakan **Supabase** via `src/lib/supabase.ts` (audience analytics, page visit tracking).

## 15. Konvensi Project-Specific

### Struktur Folder
```
src/
├── components/     # UI components (ui/, hero/, modals/, reader/)
├── hooks/          # Custom hooks
├── lib/            # Core utilities & config
│   ├── store.ts    # Zustand global store (SINGLE SOURCE OF TRUTH untuk global state)
│   ├── crypto.ts   # fetchEncrypted + encryption utilities
│   ├── supabase.ts # Supabase client & analytics
│   ├── data.ts     # Static comic data + mappers
│   ├── sanitize.ts # Input sanitization
│   ├── hooks.ts    # Shared hook utilities
│   └── utils.ts    # General utilities (cn, dll)
├── pages/          # Page components (Home, Browse, ComicDetail, ChapterReader, dll)
├── App.tsx         # Root component + React Router config
├── main.tsx        # Entry point
└── index.css       # Global styles + Tailwind imports
```

### Pattern Penting
- **Global state** → selalu via `useStore` dari `src/lib/store.ts` (sudah persist ke localStorage via Zustand middleware)
- **API calls** → selalu via `fetchEncrypted(url)` dari `src/lib/crypto.ts` (handle encrypt/decrypt + deduplication GET requests)
- **Static data fallback** → `src/lib/data.ts` (comics array, mappers `mapApiMangaToComic`, `mapApiMangaListToComics`)
- **Type definitions** → co-located di file yang sama atau di `src/lib/data.ts` untuk shared types
- **Path alias** → `@/` maps ke `src/` (cek `tsconfig.json` + `vite.config.ts`)

### Dilarang
- Membuat store Zustand baru di luar `src/lib/store.ts` tanpa alasan kuat (diskusikan dulu)
- Menggunakan `fetch` manual untuk API backend (pakai `fetchEncrypted`)
- Menambah dependency state management lain (Redux, Jotai, Context API untuk global state)
- Mengubah `KEY_STRING` di `crypto.ts` tanpa koordinasi backend
- Menyimpan secret di client code (pakai `VITE_` prefix untuk env yang perlu diakses client)