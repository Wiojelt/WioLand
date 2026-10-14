# 🛡️ MegaWio Saatlik Sağlık & Bütünlük Raporu

**Son Güncelleme:** `14.10.2026 22:12:45 (TSİ)`  
**Genel Sağlık Durumu:** ![Durum: Düzeltme Gerekli](https://img.shields.io/badge/Durum-D%C3%BCzeltme_Gerekli-red)  
**Toplam Eklenti:** `228` | **Sağlıklı:** `221` | **Uyuşmazlık:** `7`

---

## 📦 1. Depo & Paket İndirme Bütünlüğü

| Depo Adı | Eklenti Sayısı | İndirme Sağlığı | Logo / Icon | Durum |
| :--- | :---: | :---: | :---: | :---: |
| **WioSinema** | 37 | %100 (37/37) | ✅ Aktif (200) | 🟢 %100 Sağlıklı |
| **WioAnime** | 11 | %91 (10/11) | ✅ Aktif (200) | 🔴 1 Hata |
| **WioDrama** | 4 | %75 (3/4) | ✅ Aktif (200) | 🔴 1 Hata |
| **WioKids** | 10 | %100 (10/10) | ✅ Aktif (200) | 🟢 %100 Sağlıklı |
| **WioCinema** | 11 | %100 (11/11) | ✅ Aktif (200) | 🟢 %100 Sağlıklı |
| **WioAsya** | 7 | %100 (7/7) | ✅ Aktif (200) | 🟢 %100 Sağlıklı |
| **TurkSinema** | 71 | %100 (71/71) | ✅ Aktif (200) | 🟢 %100 Sağlıklı |
| **TurkSpor** | 46 | %100 (46/46) | ✅ Aktif (200) | 🟢 %100 Sağlıklı |
| **WioSpor** | 27 | %81 (22/27) | ✅ Aktif (200) | 🔴 5 Hata |
| **test** | 4 | %100 (4/4) | ✅ Aktif (200) | 🟢 %100 Sağlıklı |

---

## 🌐 2. Canlı Sağlayıcı & Domain Sağlığı

| Sağlayıcı | Güncel URL | Durum | Açıklama |
| :--- | :--- | :---: | :--- |
| **betmatiktv** | `https://betmatiktv156.com/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **ntvs** | `https://www.ntvs.cx/matches/kobra/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **daddylive** | `https://dlive.sx/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **streameast** | `https://v2.gostreameast.is/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **papazsports** | `https://www.papazsports1023.pro/` | 🟡 Ulaşılamıyor | DNS / Bağlantı zaman aşımı |
| **ardaspor** | `https://ardaspor32.top/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **mahsunsports** | `https://mahsunsports.xyz/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **crex** | `https://crex.com/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **inattv** | `https://inattvizle486.top/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **taraftarium24** | `https://inattv1325.xyz/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **selcuksports** | `https://www.selcuksportshdfe44b96fcb.xyz/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **mackeyfi** | `https://www.mackeyfi605.sbs/` | 🟡 Ulaşılamıyor | DNS / Bağlantı zaman aşımı |
| **zbahistv** | `https://101baywintv.live/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **intersportv** | `https://intersportv1.live/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **beyazelma** | `https://beyazelma78.com/` | 🔴 Korumada (Turnstile 403) | Cloudflare Challenge Devrede — İstemci doğrudan bağlanamaz |
| **kralsportshd** | `https://kralsportshd.com/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |

---

## ⚡ 3. Cloudflare Worker & Kota Durumu

| Endpoint | Kota Durumu | Detay |
| :--- | :---: | :--- |
| `https://wiojelt-auth.hdf-worker.workers.dev/` | 🟢 Normal | HTTP 200 (Kota serbest) |
| `https://wiojelt-auth.hdf-worker.workers.dev/dl/spor/BeyazElma.cs3` | 🟢 Normal | HTTP 200 (Kota serbest) |

---

## 🚨 Aktif Uyarılar & Çözüm Önerileri

- **BEYAZELMA Cloudflare Korumasında:** `https://beyazelma78.com/` adresinde Cloudflare Managed Challenge (Turnstile 403) aktif. İstemciler doğrudan kanal listesi çekemez. **Çözüm:** Kanal listesi `/domains.json` veya GitHub Raw önbellek yansısından beslenmeli.
- **Paket Hash Uyuşmazlığı:** `7` eklentinin hash/boyutu plugins.json ile eşleşmedi. `auto_heal_all_repos.py --fix --push` çalıştırılarak düzeltildi.
