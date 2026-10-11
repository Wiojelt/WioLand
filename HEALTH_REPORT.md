# 🛡️ MegaWio Saatlik Sağlık & Bütünlük Raporu

**Son Güncelleme:** `11.10.2026 13:55:52 (TSİ)`  
**Genel Sağlık Durumu:** ![Durum: Düzeltme Gerekli](https://img.shields.io/badge/Durum-D%C3%BCzeltme_Gerekli-red)  
**Toplam Eklenti:** `203` | **Sağlıklı:** `202` | **Uyuşmazlık:** `1`

---

## 📦 1. Depo & Paket İndirme Bütünlüğü

| Depo Adı | Eklenti Sayısı | İndirme Sağlığı | Logo / Icon | Durum |
| :--- | :---: | :---: | :---: | :---: |
| **WioSinema** | 37 | %100 (37/37) | ✅ Aktif (200) | 🟢 %100 Sağlıklı |
| **WioAnime** | 11 | %100 (11/11) | ✅ Aktif (200) | 🟢 %100 Sağlıklı |
| **WioDrama** | 4 | %100 (4/4) | ✅ Aktif (200) | 🟢 %100 Sağlıklı |
| **WioKids** | 10 | %100 (10/10) | ✅ Aktif (200) | 🟢 %100 Sağlıklı |
| **WioCinema** | 11 | %100 (11/11) | ✅ Aktif (200) | 🟢 %100 Sağlıklı |
| **WioAsya** | 7 | %100 (7/7) | ✅ Aktif (200) | 🟢 %100 Sağlıklı |
| **TurkSinema** | 71 | %100 (71/71) | ✅ Aktif (200) | 🟢 %100 Sağlıklı |
| **TurkSpor** | 46 | %98 (45/46) | ⚠️ Eksik | 🔴 1 Hata |
| **test** | 6 | %100 (6/6) | ✅ Aktif (200) | 🟢 %100 Sağlıklı |

---

## 🌐 2. Canlı Sağlayıcı & Domain Sağlığı

| Sağlayıcı | Güncel URL | Durum | Açıklama |
| :--- | :--- | :---: | :--- |
| **betmatiktv** | `https://betmatiktv155.com/` | 🟡 Ulaşılamıyor | DNS / Bağlantı zaman aşımı |
| **ntvs** | `https://www.ntvs.cx/matches/kobra/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **daddylive** | `https://dlive.sx/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **streameast** | `https://v2.streameast.ga/` | 🔴 Korumada (Turnstile 403) | Cloudflare Challenge Devrede — İstemci doğrudan bağlanamaz |
| **papazsports** | `https://www.papazsports1023.pro/` | 🟡 Ulaşılamıyor | DNS / Bağlantı zaman aşımı |
| **ardaspor** | `https://ardaspor31.top/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **mahsunsports** | `https://mahsunsports80.xyz/` | 🟡 Ulaşılamıyor | DNS / Bağlantı zaman aşımı |
| **crex** | `https://crex.com/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **inattv** | `https://www.inattvizle489.top/` | 🟡 Ulaşılamıyor | DNS / Bağlantı zaman aşımı |
| **taraftarium24** | `https://inattv1322.xyz/` | 🟡 Ulaşılamıyor | DNS / Bağlantı zaman aşımı |
| **selcuksports** | `https://www.selcuksportshdbd813bd00f.xyz/` | 🟡 Ulaşılamıyor | DNS / Bağlantı zaman aşımı |
| **mackeyfi** | `https://www.mackeyfi605.sbs/` | 🟡 Ulaşılamıyor | DNS / Bağlantı zaman aşımı |
| **zbahistv** | `https://99baywintv.live/` | 🟡 Ulaşılamıyor | DNS / Bağlantı zaman aşımı |
| **intersportv** | `https://intersportv1.live/` | 🟢 Sağlıklı | Kanal/Yayın erişimi aktif |
| **beyazelma** | `https://beyazelma78.com/` | 🔴 Korumada (Turnstile 403) | Cloudflare Challenge Devrede — İstemci doğrudan bağlanamaz |
| **kralsportshd** | `https://kralsportshd6.xyz/` | 🟡 Ulaşılamıyor | DNS / Bağlantı zaman aşımı |

---

## ⚡ 3. Cloudflare Worker & Kota Durumu

| Endpoint | Kota Durumu | Detay |
| :--- | :---: | :--- |
| `https://wiojelt-auth.hdf-worker.workers.dev/` | 🟢 Normal | HTTP 200 (Kota serbest) |
| `https://wiojelt-auth.hdf-worker.workers.dev/dl/spor/BeyazElma.cs3` | 🟢 Normal | HTTP 200 (Kota serbest) |

---

## 🚨 Aktif Uyarılar & Çözüm Önerileri

- **STREAMEAST Cloudflare Korumasında:** `https://v2.streameast.ga/` adresinde Cloudflare Managed Challenge (Turnstile 403) aktif. İstemciler doğrudan kanal listesi çekemez. **Çözüm:** Kanal listesi `/domains.json` veya GitHub Raw önbellek yansısından beslenmeli.
- **BEYAZELMA Cloudflare Korumasında:** `https://beyazelma78.com/` adresinde Cloudflare Managed Challenge (Turnstile 403) aktif. İstemciler doğrudan kanal listesi çekemez. **Çözüm:** Kanal listesi `/domains.json` veya GitHub Raw önbellek yansısından beslenmeli.
- **Paket Hash Uyuşmazlığı:** `1` eklentinin hash/boyutu plugins.json ile eşleşmedi. `auto_heal_all_repos.py --fix --push` çalıştırılarak düzeltildi.
