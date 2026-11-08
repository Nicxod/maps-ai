# maps-ai

Responsive, free, AI-powered location and discovery app for travelers in Japan.

## Fitur Utama

- **100% Free Maps Stack**: Leaflet + OpenStreetMap tiles, Nominatim geocoder, dan OSRM foot router (tanpa Google Maps API berbayar).
- **Perkiraan Harga Cerdas dengan AI (Google Gemini)**: Menganalisis estimasi harga riil per orang (dalam Yen) dan tips wisatawan secara akurat untuk setiap tempat.
- **Dukungan 3 Bahasa (Multi-Language)**:
  - 🇮🇩 Bahasa Indonesia (ID)
  - 🇬🇧 English (EN)
  - 🇯🇵 日本語 (JA)
- **Kategori Lengkap**: Tempat makan, kafe, konbini (7-Eleven, Lawson, FamilyMart), supermarket, apotek/drugstore, pusat belanja, toko elektronik, dan tempat wisata.
- **Jarak & Estimasi Jalan Kaki**: Menghitung rute aktual pejalan kaki dengan durasi menit berjalan.
- **Tampilan Fleksibel**: Tampilan daftar (*list view*) dan peta interaktif (*map view*).
- **Responsif & Mobile-Friendly**: Dioptimalkan untuk semua ukuran layar (desktop, tablet, smartphone).

## Cara Menjalankan Secara Lokal

1. Clone repositori:
```bash
git clone https://github.com/Nicxod/maps-ai.git
cd maps-ai
```

2. Install dependensi:
```bash
npm install
```

3. Buat file `.env.local`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

4. Jalankan server development:
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

## Deploy ke Vercel

1. Buka [Vercel Dashboard](https://vercel.com/) dan import repository **`Nicxod/maps-ai`**.
2. Pada bagian **Environment Variables**, tambahkan:
   - `GEMINI_API_KEY`: *(Masukkan Gemini API key Anda)*
3. Klik **Deploy**!
   Aplikasi akan otomatis ter-build dan siap diakses secara publik.
