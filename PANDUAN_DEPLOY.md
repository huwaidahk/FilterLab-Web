# Panduan deploy FilterLab ke Firebase

Perkiraan waktu: 20 sampai 30 menit. Semua layanan yang dipakai tersedia di paket gratis (Spark).

## A. Menyiapkan proyek Firebase

1. Buka https://console.firebase.google.com dengan akun Google-mu, klik **Create a project**, beri nama (misalnya `filterlab-unnes`). Google Analytics boleh dimatikan.
2. **Build > Authentication > Get started > Sign-in method > Google > Enable**. Isi *Project support email*, lalu simpan.
3. **Build > Firestore Database > Create database**. Pilih lokasi `asia-southeast2` (Jakarta), mode **production**.
4. **Project settings (ikon roda gigi) > General > Your apps > ikon Web (`</>`)**. Daftarkan aplikasi (jangan centang Hosting dulu), lalu salin nilai `firebaseConfig`.

## B. Mengisi berkas konfigurasi

5. Buka `firebase-config.js`, ganti `ISI_API_KEY`, `ISI_PROJECT_ID`, dan `ISI_APP_ID` dengan nilai dari langkah 4. API key Firebase memang tidak rahasia; keamanan data dijaga oleh aturan di `firestore.rules`.
6. Buka `firestore.rules`, ganti `GANTI-dosen@mail.unnes.ac.id` dengan email pengajar atau peneliti yang boleh melihat semua data. Boleh lebih dari satu, pisahkan dengan koma.
7. Buka `.firebaserc`, ganti `ISI_PROJECT_ID` dengan ID proyekmu.

## C. Deploy

8. Pasang Node.js (https://nodejs.org), lalu di terminal:
   ```
   npm install -g firebase-tools
   firebase login
   ```
9. Masuk ke folder website (yang berisi `firebase.json`), lalu:
   ```
   firebase deploy --only hosting,firestore:rules
   ```
10. Setelah selesai, terminal menampilkan alamat seperti `https://ISI_PROJECT_ID.web.app`. Itu alamat websitemu.

Catatan: kalau Firebase meminta mengaktifkan layanan lain atau menawarkan inisialisasi ulang, pilih **Hosting** dan **Firestore** saja, dan jangan menimpa `firebase.json` maupun `firestore.rules` yang sudah ada.

## D. Pengujian

11. Buka alamat website, klik **Masuk dengan akun UNNES**, dan masuk dengan akun mahasiswa. Isi satu jawaban, tunggu status "Tersinkron", lalu buka di perangkat lain dengan akun yang sama; progres harus muncul.
12. Coba masuk dengan akun Gmail biasa. Website harus menolak dan menampilkan pesan bahwa hanya akun UNNES yang boleh masuk.
13. Masuk dengan akun pengajar yang kamu daftarkan di langkah 6. Tautan "Buka panel pengajar" muncul di sidebar; di panel itu kamu bisa melihat semua mahasiswa dan mengunduh CSV.
14. Kalau muncul `auth/unauthorized-domain`, tambahkan domain websitemu di **Authentication > Settings > Authorized domains**.

## E. Catatan penting

- Website ini harus dibuka lewat alamat hosting (`https://...`) atau server lokal, bukan dengan klik dua kali berkas `index.html`. Browser memblokir modul JavaScript pada alamat `file://`, sehingga login tidak berfungsi. Pembelajaran tanpa login tetap berjalan.
- Pembatasan akun UNNES yang sebenarnya ada di `firestore.rules`, bukan di kode browser. Akun non-UNNES mungkin sempat tercatat di Authentication, tetapi tidak bisa membaca atau menulis data apa pun.
- Pola email yang diterima adalah `@unnes.ac.id` beserta subdomainnya. Kalau mau lebih ketat, ganti pola di `firestore.rules` dan `firebase-config.js` dengan daftar domain yang kamu pastikan (misalnya `students.unnes.ac.id` dan `mail.unnes.ac.id`).
- Skor kuis dihitung di browser, sehingga mahasiswa yang paham teknis dapat mengubahnya. Jangan dipakai sebagai satu-satunya dasar nilai akhir.
- Kuota gratis Firestore (sekitar 50.000 pembacaan dan 20.000 penulisan per hari) cukup untuk beberapa kelas karena penyimpanan digabung dan ditunda beberapa detik. Pasang peringatan anggaran di Google Cloud bila khawatir.
- Data berisi nama, email, dan jawaban mahasiswa. Bila dipakai untuk penelitian, sampaikan penggunaan datanya, urus persetujuan sesuai ketentuan institusimu, dan hapus data yang sudah tidak diperlukan.
