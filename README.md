# MONOPOLY İSTANBUL — DİJİTAL PARA VE BORÇ TAKİP UYGULAMASI

Arkadaşlarınızla fiziksel Monopoly İstanbul oynarken kâğıt para sayma, bozuk para arama ve kimin kime ne kadar borcu olduğunu hesaplama karmaşasını ortadan kaldıran, modern, hızlı ve mobil öncelikli finansal para takip web uygulaması.

> **Önemli Not:** Bu uygulama fiziksel oyunun yanında para kontrolü ve oyuncular arası borç takibi için kullanılır. Mülk yönetimi, dijital oyun tahtası veya zar gibi fiziksel oyunun keyfini bozan karmaşık modüller içermez.

---

## 🚀 Öne Çıkan Özellikler

1. **Hesapsız ve Anında Katılım:**
   - E-posta veya şifre gerekmez.
   - Oda oluşturan kişi oyunun kurucusu ve **Bankacısı** olur.
   - Her yeni katılan oyuncu otomatik **1.500 ₺** başlangıç bakiyesiyle başlar.
   - Sayfa yenilendiğinde oturum (`session_token`) güvenle korunur.

2. **Koyu Premium Minimal Tasarım:**
   - Modern fintech ve bankacılık uygulaması hissi veren koyu arayüz.
   - Belirlenen özel renk paleti:
     - Ana Arka Plan: `#0B0D10`
     - Kart Arka Planı: `#14171C`
     - İkincil Yüzey: `#1B1F26`
     - Kenarlık: `#282D35`
     - Ana Metin: `#F3F4F6`
     - İkincil Metin: `#9299A5`
     - Pozitif Para: `#39D98A`
     - Negatif Para: `#FF626C`
     - Vurgu Rengi: `#72E3A1`
   - Büyük ve belirgin bakiye rakamları (`font-money`).
   - Para formatı: `1.500 ₺`, `250 ₺`.

3. **Oyuncular Arası Para Transferi:**
   - Anında ve güvenli nakit aktarımı.
   - İşlem öncesi net onay ekranı:
     `"Ahmet'in bakiyesinden 250 ₺ düşülecek, Mehmet'in bakiyesine 250 ₺ eklenecek."`
   - Yetersiz bakiye kontrolü ve çift tıklama koruması.

4. **Kapsamlı Borç Sistemi:**
   - **Borç Verme:** Borç verenin nakit bakiyesi düşer, borç alanın nakit bakiyesi artar ve açık borç kaydı oluşur.
   - **Kısmi Borç Ödeme:** Borcun istenilen miktarı ödenebilir. Kalan açık borç güncellenir.
   - **Anlaşmalı Borç Kapatma (Haircut):** Örneğin 300 ₺ borcu olan iki oyuncu 200 ₺ ödeme ile anlaşıp borcu tamamen kapatabilir; kalan 100 ₺ sistem tarafından silinir.
   - **Borç Detay Ekranı:** Borç veren, borç alan, başlangıç, ödenen ve kalan tutar ile ödeme geçmişi.

5. **Bankacı Paneli:**
   - Yalnızca oda sahibi/bankacı tarafından erişilebilir.
   - Tek tıkla başlangıç noktasından geçiş maaşı (`+200 ₺ (Maaş)`).
   - Açıklamalı bakiye düzeltmesi (fiziksel oyundaki sayım hatalarını düzeltmek için).
   - Bütün oyuncuların bakiyelerini izleme.

6. **İşlem Geçmişi (Denetim Kaydı):**
   - Para transferi, borç verme, borç ödeme, anlaşmalı kapatma ve banka düzeltmelerinin filtrelenebilir listesi.
   - Hiçbir para hareketi sessizce kaybolmaz.

7. **İkili Veri Sağlayıcı (Dual Provider):**
   - Supabase anahtarları girilmediğinde bile **BroadcastChannel** üzerinden çoklu sekme (multi-tab) senkronizasyonu ile çalışır.
   - Supabase bağlandığında ise PostgreSQL atomik fonksiyonları ve **Supabase Realtime** ile gerçek zamanlı çalışır.

---

## 🛠️ Kurulum ve Çalıştırma

### 1. Gereksinimler
- Node.js (v18 veya üzeri)
- npm veya pnpm

### 2. Projeyi Yerel Olarak Başlatma
Proje dizininde:

```bash
# Bağımlılıkları yükleyin (zaten yüklü)
npm install

# Geliştirme sunucusunu başlatın
npm run dev
```

Tarayıcınızda açın:
👉 `http://localhost:5173`

---

## 🗄️ Supabase Veritabanı Kurulumu

Uygulamanın tam bulut ve çoklu cihaz senkronizasyonu için Supabase projenize bağlanması:

1. [supabase.com](https://supabase.com) üzerinde ücretsiz yeni bir proje oluşturun.
2. Supabase kontrol panelinden **SQL Editor** bölümüne gidin.
3. Projedeki `supabase/migrations/001_initial_schema.sql` dosyasının içeriğini kopyalayıp yapıştırın ve **Run** butonuna basın.
   *(Bu dosya tüm tabloları, RLS kurallarını, Realtime yayınlarını ve atomik transaction fonksiyonlarını oluşturur).*
4. Supabase panelinde **Settings -> API** kısmına gidin:
   - `Project URL`
   - `anon public key`
5. Proje kök dizinindeki `.env` dosyasını oluşturun veya düzenleyin:

```env
VITE_SUPABASE_URL=https://proje-id-niz.supabase.co
VITE_SUPABASE_ANON_KEY=anon-public-key-bilginiz
```

6. `npm run dev` komutunu yeniden başlattığınızda ekranın üst kısmında yeşil **"Canlı"** simgesi belirecek ve tüm cihazlar Supabase Realtime ile senkronize olacaktır!

---

## 🧪 Yapılan Testler

Uygulama için 11 temel senaryoyu kapsayan otomatik test paketi hazırlanmış ve başarıyla doğrulanmıştır (`scripts/test_scenarios.mjs`):

- [x] Senaryo 1: Oda oluşturma
- [x] Senaryo 2: İlk oyuncuya 1.500 ₺ tanımlanması ve Bankacı yetkisi
- [x] Senaryo 3: İkinci oyuncunun katılması ve 1.500 ₺ alması
- [x] Senaryo 4: İki oyuncu arasında 250 ₺ para transferi
- [x] Senaryo 5: Yetersiz bakiye kontrolü
- [x] Senaryo 6: 300 ₺ borç verilmesi
- [x] Senaryo 7: 300 ₺ borcun 100 ₺'sinin kısmi ödenmesi
- [x] Senaryo 8: Kalan 200 ₺ borcun 150 ₺ ile anlaşmalı kapatılması (0 ₺'ye düşmesi)
- [x] Senaryo 9: Geçersiz tutarların engellenmesi ve çift işlem koruması
- [x] Senaryo 10: Bankacı maaş/bakiye düzeltmesi ve geçmiş kaydı
- [x] Senaryo 11: Sayfa yenilendiğinde verilerin ve oturumun korunması
- [x] Senaryo 12: 320px mobil ekranlara tam uyumluluk (viewport-fit, no-horizontal-scroll)
