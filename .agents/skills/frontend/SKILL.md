---
name: codebase-memory-usage-nextjs
description: Panduan teknis menelusuri dan memahami codebase Next.js frontend menggunakan tool codebase-memory-mcp (search_graph, trace_path, get_code_snippet, query_graph, get_architecture), termasuk fallback CLI kalau tool tidak tersedia langsung. Gunakan skill ini setiap kali perlu mencari komponen/hook/route, menelusuri dependency/pemanggil suatu fungsi, membaca implementasi kode, menjalankan query struktural, atau memahami arsitektur (App Router, komponen, API route, data flow) sebelum melakukan perubahan kode yang signifikan di repo Next.js ini.
---

# Codebase Memory Usage (Next.js Frontend)

Skill ini murni prosedural: cara memakai tool investigasi kode. Untuk kapan tool ini **wajib** dipakai (kriteria "perubahan signifikan"), lihat rules project (`nextjs-frontend-rules.md`) — bukan di sini.

## Urutan Prioritas Penggunaan Tool

1. **`search_graph`** — Mencari fungsi, komponen, hook, route, variable berdasarkan pattern regex.
2. **`trace_path`** — Menelusuri dependensi/pemanggil dari fungsi/komponen/hook (inbound/outbound), termasuk siapa yang consume suatu shared component/context/util.
3. **`get_code_snippet`** — Membaca potongan kode definisi/implementasi.
4. **`query_graph`** — Menjalankan query Cypher untuk pencarian struktural kompleks (mis. semua page yang memakai komponen tertentu).
5. **`get_architecture`** — Mendapatkan gambaran arsitektur tingkat tinggi (struktur App Router, data flow Server/Client Component, API route layer).

Gunakan `grep_search` atau pencarian file manual HANYA jika tool di atas tidak memberikan hasil memadai, atau saat mencari string literal spesifik (pesan error, nama env variable, config non-code).

## Perintah CLI Fallback

Jika host environment tidak menyediakan tool `codebase-memory-mcp` secara langsung dalam deklarasi tool agent, jalankan command CLI berikut:

**Format Perintah:**

```
~/.local/bin/codebase-memory-mcp cli <tool> <arguments_json>
```

**Contoh:**

- Mencari file/fungsi/komponen dengan pattern:
  ```
  ~/.local/bin/codebase-memory-mcp cli search_graph '{"name_pattern": ".*UserProfile.*"}'
  ```
- Menelusuri pemanggil fungsi/hook (inbound):
  ```
  ~/.local/bin/codebase-memory-mcp cli trace_path '{"function_name": "useUserSession", "direction": "inbound"}'
  ```
- Mendapatkan potongan kode:
  ```
  ~/.local/bin/codebase-memory-mcp cli get_code_snippet '{"qualified_name": "app/components/UserProfile/UserProfile.tsx"}'
  ```

## Jika Command Gagal / Error / Timeout

1. **Coba ulang 1x** dengan query yang disederhanakan (pattern regex dipersempit).
2. Jika masih gagal → **turun ke `grep_search` / pencarian file manual** sebagai fallback kedua (mis. `grep -r "useUserSession" app/`), sambil beri tahu user bahwa codebase-memory tidak bisa diakses.
3. **Jangan diam-diam skip verifikasi** dan langsung nulis kode tanpa context sama sekali — minimal grep manual dulu.
4. **Jika grep manual pun tidak memberi hasil memadai** (dead-end) → berhenti, laporkan ke user secara eksplisit apa yang sudah dicoba dan apa yang tidak ditemukan, jangan lanjut menulis kode berdasarkan asumsi/tebakan tanpa context sama sekali.

## Guard: Secret di Output Tool

Sebelum menampilkan hasil `get_code_snippet` / `search_graph` / `grep_search` ke user, cek apakah snippet mengandung pola menyerupai secret (`API_KEY=`, `-----BEGIN PRIVATE KEY-----`, token panjang high-entropy, connection string dengan password). Jika ya: redact nilainya jadi `[REDACTED]`, tampilkan hanya struktur/nama variabel, dan beri tahu user. Perhatikan juga env variable dengan prefix `NEXT_PUBLIC_` bukan secret (memang didesain exposed ke client) — tapi tetap redact env variable server-only tanpa prefix tersebut. Ini berlaku untuk semua sumber tool di atas, termasuk fallback CLI/grep — lihat rules §6 untuk kebijakan lengkap soal secrets.

## Laporan ke User

Kalau memakai fallback (codebase-memory-mcp gagal → grep manual), sebutkan itu eksplisit di respon ke user — jangan hanya dicatat internal (lihat rules §11 Audit Trail).
