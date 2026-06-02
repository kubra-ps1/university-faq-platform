# Toplantı Tutanağı - 2: Frontend Arayüz ve Kimlik Doğrulama (Auth)

**Tarih:** 25 Nisan 2026  
**Katılımcılar:** Kübra, Zeynep, Raghad  
**Konu:** Initial Frontend UI, Login/Register Entegrasyonları ve JWT Yönetimi

## Gündem Maddeleri
1. **Frontend UI:** Sayfaların (Dashboard, Login vb.) tasarımlarının yapılması.
2. **Kimlik Doğrulama:** JWT token ile login ve register işlemlerinin sisteme bağlanması.

## Toplantı Notları ve Alınan Kararlar
1. **Arayüz (UI) Tasarımı:** Ana sayfa, giriş yapma (Login) ve kayıt olma (Register) ekranlarının tasarımlarının tamamlandığı ve sisteme entegre edildiği bildirilmiştir.
2. **Kimlik Doğrulama (JWT):** JWT (JSON Web Token) altyapısının istemci tarafında (Local Storage) yönetimi için gerekli mekanizmaların kurulduğu belirtilmiştir.
3. **Güvenlik ve Yönlendirme:** Geçerliliğini yitirmiş (expire olmuş) veya hatalı token durumlarında kullanıcıların otomatik olarak giriş sayfasına yönlendirilmesi amacıyla Axios Interceptor yapısının projelendirildiği ve başarıyla uygulandığı raporlanmıştır.
4. **Backend Entegrasyonu:** Backend tarafında kullanıcı şifrelerinin bcrypt algoritması ile şifrelenerek (hashlenerek) veritabanına kaydedildiği ve ilgili API uç noktalarının test edildiği onaylanmıştır.
5. **Sonraki Adımlar:** Kimlik doğrulama aşamasının tamamlanmasıyla birlikte, veri çekme (Fetch) ve ana iş mantığını yürüten API'lerin sisteme tam entegrasyonuna başlanmasına karar verilmiştir.


