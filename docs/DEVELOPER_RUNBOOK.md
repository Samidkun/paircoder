# Paircoder — Developer Runbook

Dokumen teknis dan panduan operasional pengembangan untuk pemelihara dan pengembang Paircoder.

---

## 1. Arsitektur Sistem

```
+-------------------------------------------------------------+
|                      Client Layer                           |
|  React 19 + TypeScript + CodeMirror 6 + Yjs + Tailwind 4    |
+------------------------------+------------------------------+
                               |
            +------------------+------------------+
            | HTTP / REST                         | WebSocket (WSS)
            v                                     v
+-----------------------+             +-----------------------+
|  Laravel 12 Backend   |             |  Laravel Reverb WSS   |
|  - Fortify / Sanctum  |             |  - room.{slug}        |
|  - Room Lifecycle     |             |  - Yjs relay          |
|  - RateLimiter 10/min |             |  - Presence channel   |
+-----------+-----------+             +-----------------------+
            |
            +-------------------+-----------------+
            |                   |                 |
            v                   v                 v
+-----------------------+ +-----------+ +---------------------+
| PostgreSQL 18         | | Judge0 CE | | Keystrokes Delta    |
| - Users / Rooms UUID  | | Public API| | Ordered by ts_ms    |
| - Scorecard Token (32)| | Sandbox   | | BigSerial PK        |
+-----------------------+ +-----------+ +---------------------+
```

---

## 2. Prasyarat Lingkungan

- **PHP:** 8.3+ (diuji pada PHP 8.5) dengan ekstensi `pdo_pgsql`, `openssl`, `mbstring`.
- **Database:** PostgreSQL 15+ (diuji pada PostgreSQL 18.6).
- **Node.js:** v22+ (diuji pada v26.8), package manager `pnpm` v11+.
- **Browser:** Chromium / Google Chrome untuk menjalankan uji Playwright E2E.

---

## 3. Setup Lokal (Step-by-Step)

### A. Persiapan Database
```bash
# Masuk ke psql dan buat database development dan testing
psql -U postgres -c "CREATE DATABASE paircoder;"
psql -U postgres -c "CREATE DATABASE paircoder_test;"
```

### B. Konfigurasi Backend (Laravel 12)
```bash
cd backend
composer install

# Salin environment file jika belum ada
cp .env.example .env
php artisan key:generate

# Konfigurasi PostgreSQL di .env:
# DB_CONNECTION=pgsql
# DB_HOST=127.0.0.1
# DB_PORT=5432
# DB_DATABASE=paircoder
# DB_USERNAME=postgres
# DB_PASSWORD=

# Jalankan migrasi database
php artisan migrate
```

### C. Konfigurasi Frontend (React 19 + Vite)
```bash
cd ../frontend
pnpm install
pnpm approve-builds esbuild
```

---

## 4. Menjalankan Layanan Pengembangan

Jalankan 3 proses terpisah di terminal:

1. **Backend API Server:**
   ```bash
   cd backend
   php artisan serve --port=8000
   ```

2. **WebSocket Reverb Server:**
   ```bash
   cd backend
   php artisan reverb:start --port=8080
   ```

3. **Frontend Vite Dev Server:**
   ```bash
   cd frontend
   pnpm dev
   ```
   Akses aplikasi di browser pada: `http://localhost:5173`

---

## 5. Pengujian & Verifikasi Kualitas

### A. PHPUnit Feature & Acceptance Criteria Suite (Backend)
```bash
cd backend
./vendor/bin/phpunit
# Expected: 19 tests, 112 assertions, ALL GREEN
```

### B. Uji Konvergensi CRDT Yjs (Tanpa Konflik)
```bash
cd frontend
node test-crdt.mjs
# Expected: ✓ AC-13 PASS: Yjs CRDT converged with 0 conflicts and 0 data loss.
```

### C. Build Produksi & Type-Check Frontend
```bash
cd frontend
pnpm build
# Expected: built in ~1.5s tanpa error TypeScript
```

### D. Playwright Browser End-to-End Suite
```bash
cd frontend
pnpm exec playwright test
# Expected: 6 passed (all 6 user journeys verified)
```

---

## 6. Detail Endpoint API (Frozen Contract)

| Method | Endpoint | Deskripsi | Otorisasi |
|---|---|---|---|
| `POST` | `/api/auth/register` | Mendaftarkan akun interviewer baru | Public |
| `POST` | `/api/auth/login` | Masuk ke portal interviewer | Public |
| `POST` | `/api/auth/logout` | Keluar dari sesi interviewer | Auth: Sanctum |
| `GET` | `/api/rooms` | Daftar seluruh sesi room interviewer | Auth: Sanctum |
| `POST` | `/api/rooms` | Membuat room baru (format slug `xxxx-xxxx-xxxx`) | Auth: Sanctum |
| `GET` | `/api/rooms/{slug}` | Mendapatkan detail status & partisipan room | Public |
| `POST` | `/api/rooms/{slug}/join` | Kandidat bergabung ke sesi room | Public |
| `POST` | `/api/rooms/{slug}/run` | Proxy eksekusi Judge0 (dibatasi 10 req/menit/room) | Public |
| `POST` | `/api/rooms/{slug}/end` | Mengakhiri sesi room secara permanen | Auth: Sanctum |
| `POST` | `/api/rooms/{slug}/keystrokes`| Menyimpan batch delta ketikan realtime | Public |
| `GET` | `/api/rooms/{slug}/replay` | Mengambil urutan delta ketikan berdasar waktu | Public |
| `POST` | `/api/rooms/{slug}/scorecard`| Menyimpan kartu nilai evaluasi 4 pilar | Auth: Sanctum |
| `GET` | `/api/rooms/{slug}/scorecard`| Mengambil kartu nilai milik interviewer | Auth: Sanctum |
| `GET` | `/api/scorecards/{share_token}` | Mengakses kartu nilai kandidat untuk hiring manager | Public (No-Auth) |

---

## 7. Pertimbangan Keamanan & Skalabilitas

1. **Rate Limiting Eksekusi Kode:**
   Setiap ruangan dibatasi `10 runs / menit` via `RateLimiter::tooManyAttempts('room-run:' . $slug, 10)`. Request ke-11 mengembalikan HTTP 429 dengan header `retry_after`.
2. **Kerahasiaan Evaluasi:**
   Pembuatan scorecard hanya diizinkan untuk interviewer pemilik ruang yang terotentikasi. Token publik dibuat dengan entropi tinggi (`tok_` + 28 karakter acak) sehingga tidak dapat ditebak secara brute-force.
3. **Penyimpanan Keystroke Skala Tinggi:**
   Tabel `keystrokes` menggunakan `BigSerial` untuk primary key dan index gabungan `(room_id, ts_ms)` agar query rekaman replay instan meskipun terdapat puluhan ribu delta ketikan per sesi.
