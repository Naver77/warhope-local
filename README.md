Warhope E-Commerce - UTS Web 2

Project ini dibuat untuk memenuhi tugas Ujian Tengah Semester (UTS) mata kuliah Pemrograman Web 2. Aplikasi ini merupakan simulasi toko online yang dibangun menggunakan Next.js (sebagai Static Site), Tailwind CSS, dan LocalStorage sebagai simulasi database.

🧑‍💻 Identitas Mahasiswa

Nama: [NAMA DEPAN] [NAMA BELAKANG]
NIM: [NIM ANDA]
Kelas: [KELAS ANDA]

🚀 Fitur Aplikasi

Sesuai dengan ketentuan UTS, project ini memiliki fitur-fitur berikut:

Authentication (Simulasi): Login & Register dengan validasi (email unik, password min. 6 karakter) disimpan di LocalStorage.

Product Management: Menampilkan list dan detail produk yang di-fetch dari file products.json.

Search & Filter: Pencarian produk berdasarkan nama dan kategori.

Cart (Keranjang): Menambah, menghapus, mengubah kuantitas item, serta kalkulasi total harga otomatis.

Checkout: Form pengiriman lengkap dan simulasi pembayaran (menyimpan data transaksi ke LocalStorage dengan ID unik).

Order History: Menampilkan riwayat pesanan (user dashboard).

Fitur Bonus: Wishlist produk, simulasi rating/ulasan produk, UI/UX rapi dengan Tailwind CSS.

🛠️ Teknologi yang Digunakan

Frontend Framework: Next.js (App Router) - Static Export

Styling: Tailwind CSS & Lucide React (Icons)

State Management: Zustand (dengan middleware persist untuk sinkronisasi LocalStorage)

Database (Simulasi): File JSON statis & Browser LocalStorage

💻 Cara Menjalankan Project (Local)

Pastikan Anda sudah menginstal Node.js.

Clone repository ini:

git clone [URL_GITHUB_ANDA]
cd warhope-ecom


Install dependensi (library) yang dibutuhkan:

npm install


Jalankan server development:

npm run dev


Buka http://localhost:3000 di browser Anda.

🌐 Link Demo Aplikasi

Aplikasi ini telah di-deploy dan dapat diakses secara online melalui GitHub Pages pada tautan berikut:

[Masukkan Link URL GitHub Pages Anda Di Sini, contoh: https://www.google.com/search?q=https://username.github.io/NamaDepan_NamaBelakang_UTS_Web2]