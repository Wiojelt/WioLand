# 🛡️ MegaWio Saatlik Sağlık & Bütünlük Raporu

**Son Güncelleme:** `22.10.2026 10:00:04 (TSİ)`  
**Genel Sağlık Durumu:** ![Durum: Mükemmel](https://img.shields.io/badge/Durum-M%C3%BCkemmel-brightgreen)  
**Toplam Eklenti:** `246` | **Sağlıklı:** `246` | **Uyuşmazlık:** `0`

---

## 📦 1. Depo & Paket İndirme Bütünlüğü

| Depo Adı | Eklenti Sayısı | İndirme Sağlığı | Logo / Icon | Durum |
| :--- | :---: | :---: | :---: | :---: |
| **WioSinema** | 36 | %100 (36/36) | ✅ Aktif (200) | 🟢 %100 Sağlıklı |
| **WioAnime** | 10 | %100 (10/10) | ✅ Aktif (200) | 🟢 %100 Sağlıklı |
| **WioDrama** | 15 | %100 (15/15) | ✅ Aktif (200) | 🟢 %100 Sağlıklı |
| **WioKids** | 10 | %100 (10/10) | ✅ Aktif (200) | 🟢 %100 Sağlıklı |
| **WioCinema** | 14 | %100 (14/14) | ✅ Aktif (200) | 🟢 %100 Sağlıklı |
| **WioAsya** | 7 | %100 (7/7) | ✅ Aktif (200) | 🟢 %100 Sağlıklı |
| **TurkSinema** | 68 | %100 (68/68) | ✅ Aktif (200) | 🟢 %100 Sağlıklı |
| **TurkSpor** | 45 | %100 (45/45) | ✅ Aktif (200) | 🟢 %100 Sağlıklı |
| **WioSpor** | 28 | %100 (28/28) | ✅ Aktif (200) | 🟢 %100 Sağlıklı |
| **test** | 13 | %100 (13/13) | ✅ Aktif (200) | 🟢 %100 Sağlıklı |

---

## 🌐 2. Canlı Sağlayıcı & Domain Sağlığı

| Sağlayıcı | Güncel URL | Durum | Açıklama |
| :--- | :--- | :---: | :--- |
| **betmatiktv** | `https://betmatiktv156.com/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **ntvs** | `https://www.ntvs.cx/matches/kobra/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **daddylive** | `https://dlive.sx/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **streameast** | `https://v2.gostreameast.is/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **papazsports** | `https://www.papazsports1031.pro/` | 🔴 Korumada (Turnstile 403) | Cloudflare Challenge Devrede — İstemci doğrudan bağlanamaz |
| **ardaspor** | `https://ardaspor33.top/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **mahsunsports** | `https://mahsunsports.xyz/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **crex** | `https://crex.com/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **inattv** | `https://inattv1327.xyz/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **taraftarium24** | `https://taraftarium24.io/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **selcuksports** | `https://www.selcuksportshdfe44b96fcb.xyz/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **mackeyfi** | `https://www.mackeyfi605.sbs/` | 🟡 Uyarı | Beklenmeyen yanıt (HTTP 523) |
| **zbahistv** | `https://101baywintv.live/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **intersportv** | `https://intersportv1.live/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **beyazelma** | `https://beyazelma78.com/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **kralsportshd** | `https://kralsportshd.com/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **atomspor** | `https://atomsportv519.top/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |

---

## ⚡ 3. Cloudflare Worker & Kota Durumu

| Endpoint | Kota Durumu | Detay |
| :--- | :---: | :--- |
| `https://wiojelt-auth.hdf-worker.workers.dev/` | 🟢 Normal | HTTP 200 (Kota serbest) |
| `https://wiojelt-auth.hdf-worker.workers.dev/dl/spor/BeyazElma.cs3` | 🟢 Normal | HTTP 200 (Kota serbest) |

---

## 🚨 Aktif Uyarılar & Çözüm Önerileri

- **PAPAZSPORTS Cloudflare Korumasında:** `https://www.papazsports1031.pro/` adresinde Cloudflare Managed Challenge (Turnstile 403) aktif. İstemciler doğrudan kanal listesi çekemez. **Çözüm:** Kanal listesi `/domains.json` veya GitHub Raw önbellek yansısından beslenmeli.
