# 2. Toplantı Kararları: Frontend Mimari ve Tasarım Süreci

**Gündem:** Akıllı SSS Platformu - Arayüz (Frontend) Tasarım Kararları ve Modüler Yapılandırma

## 1. Altyapı ve Teknolojik Kararlar
Bir önceki mimari değerlendirmemizde netleştirdiğimiz üzere, projenin frontend katmanı aşağıdaki standartlar üzerine inşa edilecektir:
* **Çatı (Framework):** React (Vite ortamında yapılandırıldı).
* **Dil:** TypeScript. Veri tipleri katı bir şekilde tanımlanacak, "any" kullanımı kod incelemelerinde (Code Review) reddedilecektir.
* **Stil Yönetimi:** Tailwind CSS kullanılacak.
* **Yönlendirme (Routing):** Single Page Application (SPA) davranışı için sayfa geçişleri `react-router-dom` ile yönetilecektir.

## 2. Sayfa Hiyerarşisi ve Klasörleme
"Spaghetti code" oluşumunu engellemek amacıyla arayüz 12 bağımsız sayfa (Component) halinde, 4 ana Domain altında klasörlenecektir:

### A. Public (Herkese Açık) Modülü `(src/pages/Public/)`
* `Home.tsx`: Logolu ana arama ekranı ve temel kategoriler.
* `AnswerResult.tsx`: Yapay zeka eşleşmesi sonucu gösterilen net çözüm sayfası.
* `SimilarQuestions.tsx`: Tam eşleşme bulunamadığında gösterilen soru havuzu ve favorileme/beğeni arayüzü.
* `NoResult.tsx`: Sonuçsuz aramalarda kullanıcıyı sisteme yönlendiren karşılama sayfası.

### B. Auth (Kimlik Doğrulama) Modülü `(src/pages/Auth/)`
* `Login.tsx`: Öğrenci ve Admin için sekmeli (tab) ortak giriş ekranı.
* `Register.tsx`: Yalnızca öğrencilere açık olan, kurumsal mail kontrolü içeren kayıt ekranı.

### C. Öğrenci Paneli Modülü `(src/pages/Student/)`
* `Dashboard.tsx`: Ana kontrol paneli.
* `Profile.tsx`: Şifre ve kişisel bilgi güncelleme alanı.
* `MyQuestions.tsx` & `Favorites.tsx`: Öğrencinin sorduğu ve etkileşime girdiği soruların durum takibi (Bekliyor/Cevaplandı).

### D. Admin Paneli Modülü `(src/pages/Admin/)`
* `Dashboard.tsx`: Sistem istatistiklerinin (pasta/çizgi grafik) yer aldığı görsel alan.
* `PendingQuestions.tsx`: AI destekli cevaplama modalının tetiklendiği onay bekleyen sorular tablosu.
* `QuestionPool.tsx`: Genel SSS havuzunun yönetildiği CRUD sayfası.

