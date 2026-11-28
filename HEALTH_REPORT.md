# 🛡️ MegaWio Saatlik Sağlık & Bütünlük Raporu

**Son Güncelleme:** `28.11.2026 01:51:35 (TSİ)`  
**Genel Sağlık Durumu:** ![Durum: Düzeltme Gerekli](https://img.shields.io/badge/Durum-D%C3%BCzeltme_Gerekli-red)  
**Toplam Eklenti:** `280` | **Sağlıklı:** `277` | **Uyuşmazlık:** `3`

---

## 📦 1. Depo & Paket İndirme Bütünlüğü

| Depo Adı | Eklenti Sayısı | İndirme Sağlığı | Logo / Icon | Durum |
| :--- | :---: | :---: | :---: | :---: |
| **WioSinema** | 43 | %100 (43/43) | ✅ Aktif (200) | 🟢 %100 Sağlıklı |
| **WioAnime** | 10 | %90 (9/10) | ✅ Aktif (200) | 🔴 1 Hata |
| **ArcanaDrama** | 32 | %100 (32/32) | ⚠️ Eksik | 🟢 %100 Sağlıklı |
| **WioKids** | 11 | %100 (11/11) | ✅ Aktif (200) | 🟢 %100 Sağlıklı |
| **WioCinema** | 14 | %86 (12/14) | ✅ Aktif (200) | 🔴 2 Hata |
| **WioAsya** | 7 | %100 (7/7) | ✅ Aktif (200) | 🟢 %100 Sağlıklı |
| **TurkSinema** | 122 | %100 (122/122) | ✅ Aktif (200) | 🟢 %100 Sağlıklı |
| **WioSpor** | 29 | %100 (29/29) | ✅ Aktif (200) | 🟢 %100 Sağlıklı |
| **test** | 4 | %100 (4/4) | ✅ Aktif (200) | 🟢 %100 Sağlıklı |
| **WioKitap** | 8 | %100 (8/8) | ✅ Aktif (200) | 🟢 %100 Sağlıklı |

---

## 🌐 2. Canlı Sağlayıcı & Domain Sağlığı

| Sağlayıcı | Güncel URL | Durum | Açıklama |
| :--- | :--- | :---: | :--- |
| **betmatiktv** | `https://betmatiktv156.com/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **ntvs** | `https://www.ntvs.cx/matches/raptor/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **daddylive** | `https://thedaddy.li/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **streameast** | `https://v2.gostreameast.is/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **papazsports** | `https://www.papazsports1031.pro/` | 🔴 Korumada (Turnstile 403) | Cloudflare Challenge Devrede — İstemci doğrudan bağlanamaz |
| **ardaspor** | `https://ardaspor.live/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **mahsunsports** | `https://mahsunsports.xyz/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **crex** | `https://crex.com/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **inattv** | `https://inattvgiris.co/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **taraftarium24** | `https://taraftarium24.io/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **selcuksports** | `https://www.selcuksportshd34d51bc052.xyz/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **mackeyfi** | `https://www.canlimaclar615.sbs/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **zbahistv** | `https://101baywintv.live/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **intersportv** | `https://intersportv1.live/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **beyazelma** | `https://beyazelma78.com/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **kralsportshd** | `https://kralsportshd.com/giris2/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **atomspor** | `https://www.atomsportv520.top/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |

---

## ⚡ 3. Cloudflare Worker & Kota Durumu

| Endpoint | Kota Durumu | Detay |
| :--- | :---: | :--- |
| `https://wiojelt-auth.hdf-worker.workers.dev/` | 🟢 Normal | HTTP 200 (Kota serbest) |
| `https://wiojelt-auth.hdf-worker.workers.dev/dl/spor/BeyazElma.cs3` | 🟢 Normal | HTTP 200 (Kota serbest) |

---

## 🚨 Aktif Uyarılar & Çözüm Önerileri

- **PAPAZSPORTS Cloudflare Korumasında:** `https://www.papazsports1031.pro/` adresinde Cloudflare Managed Challenge (Turnstile 403) aktif. İstemciler doğrudan kanal listesi çekemez. **Çözüm:** Kanal listesi `/domains.json` veya GitHub Raw önbellek yansısından beslenmeli.
- **Paket Hash Uyuşmazlığı:** `3` eklentinin hash/boyutu plugins.json ile eşleşmedi. `auto_heal_all_repos.py --fix --push` çalıştırılarak düzeltildi.
