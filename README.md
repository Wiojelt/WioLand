<div align="center">

# WioLand

CloudStream repositories and BitChord music modules.

<img src="assets/logo.png" width="180" alt="WioLand">

**[Website](https://wiojelt.github.io/)** · **[CloudStream](#cloudstream)** · **[BitChord](#bitchord)**

</div>

## CloudStream

Add the repository in **Settings → Extensions → Add repository**:

```text
!megawio
```

Or use the [repository URL](https://raw.githubusercontent.com/Wiojelt/WioLand/builds/repo.json).

Install **MegaWio** to add the WioSinema, WioSpor, WioAnime, WioAsya, WioDrama, WioCinema, WioKids and CloudStream Live Hub repositories. Then install the plugins you want.

PltStream is kept as an archive entry; its content plugin has closed.

**[CloudStream releases](https://github.com/recloudstream/cloudstream/releases)** · **[Repository health](HEALTH_REPORT.md)**

## BitChord & Dial

**Wioland & Wiochord Lossless** brings lossless and Hi-Res music sources together in BitChord and Dial, sorted from fastest to slowest with automatic cascading failover.

1. Remove any older Wioland music source.
2. Open **Settings → Sources → Add an addon** in BitChord or Dial.
3. Paste this manifest URL and save:

```text
https://raw.githubusercontent.com/Wiojelt/WioLand/main/bitchord/manifest.json
```

**[Copy/open manifest](https://raw.githubusercontent.com/Wiojelt/WioLand/main/bitchord/manifest.json)** · **[BitChord](https://github.com/kushagrasinghx/BitChord)** · **[Dial (Fork)](https://github.com/steeben/Dial)** · **[Music modules](bitchord/)**

### Kaynak Sıralaması (Hız Benchmark / Latency)

| Sıra | Kaynak Adı | Gecikme (Latency) | Tür / Kalite | Durum |
| :--- | :--- | :--- | :--- | :--- |
| **01** | **Wiochord Lossless FLAC** | `~600ms` (Akıllı Seçim) | Çoklu Otomatik Yedeklemeli FLAC | ⚡ Aktif |
| **02** | **Monochrome FLAC (Community)** | `~900ms` | 16/24-bit 44.1kHz FLAC | ⚡ Aktif |
| **03** | **juanjob Hi-Res** | `635ms` | 24-bit 96kHz Hi-Res FLAC | ⚡ Aktif |
| **04** | **Dial Monochrome FLAC** | `904ms` (Doğrudan Akış) | 16/24-bit FLAC (Doğrudan / Jeton Gerektirmez) | ⚡ Aktif |
| **05** | **Confih Hi-Res** | `1100ms` | 24-bit Hi-Res FLAC | 🚀 Aktif |
| **06** | **Qobuz Addon** | `1600ms` | Tokensiz Doğrudan FLAC | 🚀 Aktif |
| **07** | **Lossless Bridge** | `2100ms` | 15 Günlük Dinamik Jeton Yenilemeli Hi-Res | 🔄 Aktif |
| **08** | **Eljohnzc Monochrome** | `~700ms` | Sadece Dinleme | 🎧 Aktif |
| **09** | **QQDL / Lucida** | N/A | Parked (Yedek Havuz) | 💤 Parked |
| **10** | **gglos · LastBabe · Tido** | Değişken | Alternatif Eklentiler | 🔄 Yedek |
| **11** | **Internet Archive FLAC** | `~1200ms` | Arşiv Koleksiyonu | 🏛️ Aktif |

Modüller doğrudan BitChord / Dial QuickJS motorunda çalışır, dış aracı sunucu veya kulaklık şartı gerektirmez.

---

<div align="center">

**[Support on Kreosus](https://kreosus.com/wiojelt)** · **[Telegram](https://t.me/wiolandcs3)** · **[Issues](https://github.com/Wiojelt/WioLand/issues)**

</div>
