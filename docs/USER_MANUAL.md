# Paircoder — User Manual

Panduan praktis penggunaan platform wawancara teknis real-time **Paircoder** bagi Interviewer dan Kandidat.

---

## 1. Peran & Alur Pengguna

Platform Paircoder dirancang untuk wawancara teknis tanpa friksi pendaftaran yang rumit:
- **Interviewer:** Memiliki akun untuk membuat ruang wawancara, mengamati kode, mengevaluasi kemampuan teknis, dan membagikan kartu nilai (scorecard).
- **Kandidat:** Cukup bergabung via tautan unik (`/room/{slug}/join`) tanpa perlu registrasi akun.
- **Hiring Manager / Stakeholder:** Mengakses kartu nilai kandidat melalui tautan publik aman (`/scorecards/{share_token}`).

---

## 2. Langkah-Langkah Sesi Wawancara

### Langkah 1: Masuk & Buat Ruang Wawancara (Interviewer)
1. Buka halaman utama Paircoder dan klik **Start Interview Free**.
2. Masuk melalui form **Interviewer Portal** (atau buat akun baru).
3. Di **Dashboard**, klik tombol **+ Create New Room**.
4. Sistem akan membuat ruang baru dengan slug unik 12-karakter (contoh: `a8f9-c2e1-4b7d`).

### Langkah 2: Pre-Flight Lobby & Bagikan Tautan
1. Masuk ke ruang **Lobby**.
2. Salin tautan **Candidate Invitation Link** (`https://paircoder.dev/room/{slug}/join`).
3. Kirimkan tautan tersebut ke kandidat via email, chat, atau kalender meeting.
4. Pilih bahasa pemrograman utama sesi wawancara (TypeScript, Python, Go, Java, dll.).
5. Saat indikator peserta menunjukkan status koneksi kandidat telah aktif, klik **Enter Live Room**.

### Langkah 3: Sesi Live Coding & Eksekusi
1. **Editor Bersama (CRDT):**
   - Kedua pihak dapat mengetik secara bersamaan tanpa konflik baris atau overwrite data.
   - Posisi kursor dan nama interviewer (Biru) serta kandidat (Hijau/Amber) terlihat secara langsung.
2. **Uji Coba Kode (Judge0 Engine):**
   - Masukkan input uji coba pada kolom **Standard Input (stdin)** bila diperlukan.
   - Klik **Run Code** untuk mengompilasi dan menjalankan kode di lingkungan terisolasi.
   - Hasil eksekusi (`stdout`, `stderr`, waktu eksekusi, penggunaan memori) langsung muncul di panel Console.
   - *Catatan: Setiap ruang dibatasi maksimal 10 eksekusi per menit demi pencegahan penyalahgunaan.*

### Langkah 4: Mengakhiri Sesi & Pengisian Scorecard
1. Klik tombol **End Session** di pojok kanan atas toolbar editor.
2. Sesi ruang akan berstatus `ended` dan editor terkunci dari perubahan lebih lanjut.
3. Halaman formulir **Scorecard** akan terbuka:
   - Geser slider 1 s/d 5 untuk 4 pilar kompetensi:
     - **Problem Solving & Algorithms**
     - **Code Quality & Idioms**
     - **Communication & Collaboration**
     - **Execution Speed & Debugging**
   - Tuliskan catatan teknis kualitatif pada kolom **Interviewer Technical Notes**.
4. Klik **Save & Preview Public Link** untuk mengunci penilaian dan menerbitkan **32-Character Share Token**.

### Langkah 5: Keystroke Replay & Verifikasi
1. Kapan pun dibutuhkan, buka tab **Replay** untuk meninjau rekaman sesi.
2. Gunakan scrubber timeline untuk melihat bagaimana kandidat berpikir:
   - Meninjau saat kandidat ragu-ragu, menghapus pendekatan yang salah, dan menyusun algoritma akhir.
   - Mengatur kecepatan putar (1x, 2x, atau 5x).
   - Melompat ke penanda waktu penting (*Keystroke Milestones*).

---

## 3. Akses Publik Hiring Manager (No-Auth)

Hiring manager atau tim penilai lain dapat membuka tautan kartu nilai:
`https://paircoder.dev/scorecards/tok_94fa2e109bc8721104aef912`
- Menampilkan ringkasan visual nilai 4 pilar dan rata-rata skor.
- Menampilkan catatan kualitatif evaluator secara utuh.
- Menyediakan tautan langsung menuju rekaman keystroke replay sesi tanpa perlu login.
