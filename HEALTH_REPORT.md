# 🛡️ MegaWio Saatlik Sağlık & Bütünlük Raporu

**Son Güncelleme:** `27.10.2026 16:23:19 (TSİ)`  
**Genel Sağlık Durumu:** ![Durum: Düzeltme Gerekli](https://img.shields.io/badge/Durum-D%C3%BCzeltme_Gerekli-red)  
**Toplam Eklenti:** `245` | **Sağlıklı:** `244` | **Uyuşmazlık:** `1`

---

## 📦 1. Depo & Paket İndirme Bütünlüğü

| Depo Adı | Eklenti Sayısı | İndirme Sağlığı | Logo / Icon | Durum |
| :--- | :---: | :---: | :---: | :---: |
| **WioSinema** | 36 | %100 (36/36) | ✅ Aktif (200) | 🟢 %100 Sağlıklı |
| **WioAnime** | 10 | %100 (10/10) | ✅ Aktif (200) | 🟢 %100 Sağlıklı |
| **WioDrama** | 15 | %100 (15/15) | ✅ Aktif (200) | 🟢 %100 Sağlıklı |
| **WioKids** | 10 | %100 (10/10) | ✅ Aktif (200) | 🟢 %100 Sağlıklı |
| **WioCinema** | 14 | %100 (14/14) | ✅ Aktif (200) | 🟢 %100 Sağlıklı |
| **WioAsya** | 7 | %86 (6/7) | ✅ Aktif (200) | 🔴 1 Hata |
| **TurkSinema** | 68 | %100 (68/68) | ✅ Aktif (200) | 🟢 %100 Sağlıklı |
| **TurkSpor** | 45 | %100 (45/45) | ✅ Aktif (200) | 🟢 %100 Sağlıklı |
| **WioSpor** | 27 | %100 (27/27) | ✅ Aktif (200) | 🟢 %100 Sağlıklı |
| **test** | 13 | %100 (13/13) | ✅ Aktif (200) | 🟢 %100 Sağlıklı |

---

## 🌐 2. Canlı Sağlayıcı & Domain Sağlığı

| Sağlayıcı | Güncel URL | Durum | Açıklama |
| :--- | :--- | :---: | :--- |
| **betmatiktv** | `https://betmatiktv156.com/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **ntvs** | `https://www.ntvs.cx/matches/raptor/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **daddylive** | `https://thedaddy.pk/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **streameast** | `https://v2.gostreameast.is/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **papazsports** | `https://www.papazsports1031.pro/` | 🔴 Korumada (Turnstile 403) | Cloudflare Challenge Devrede — İstemci doğrudan bağlanamaz |
| **ardaspor** | `https://ardaspor.live/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **mahsunsports** | `https://mahsunsports.xyz/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **crex** | `https://crex.com/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **inattv** | `https://inattv1327.xyz/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **taraftarium24** | `https://taraftarium24.io/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **selcuksports** | `https://www.selcuksportshd14e17ba2ad.xyz/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **mackeyfi** | `https://www.mackeyfi605.sbs/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **zbahistv** | `https://101baywintv.live/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **intersportv** | `https://intersportv1.live/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **beyazelma** | `https://beyazelma78.com/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **kralsportshd** | `https://kralsportshd.com/kral/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
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
- **Paket Hash Uyuşmazlığı:** `1` eklentinin hash/boyutu plugins.json ile eşleşmedi. `auto_heal_all_repos.py --fix --push` çalıştırılarak düzeltildi.
