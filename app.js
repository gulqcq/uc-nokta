/**
 * ÜÇ NOKTA — Uygulama Mantığı
 * Yalnızca tarayıcıda çalışan, sunucusuz, kurgusal dizi, film ve kitap platformu.
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. RENKLER VE SABİTLER (Kodun başında tek noktadan tanım)
     ========================================================================== */
  const COLORS = {
    dizi: '#3a4dff',
    film: '#d92d27',
    kitap: '#f5b31b',
    fav: '#e11d48',
    light: {
      bg: '#eff0f6',
      surface: '#ffffff',
      text: '#12142b'
    },
    dark: {
      bg: '#0e0e10',
      surface: '#18181b',
      text: '#ececef'
    }
  };

  const STORAGE_KEYS = {
    theme: 'uc_nokta_tema',
    saved: 'uc_nokta_kaydedilenler',
    fav: 'uc_nokta_favoriler'
  };

  const PAGE_SIZE = 48;

  const CATEGORY_META = {
    dizi: { label: 'Dizi', plural: 'Diziler', cta: 'Dizilere bak', actionLabel: 'İzle' },
    film: { label: 'Film', plural: 'Filmler', cta: 'Filmlere bak', actionLabel: 'İzle' },
    kitap: { label: 'Kitap', plural: 'Kitaplar', cta: 'Kitaplara bak', actionLabel: 'Oku' }
  };

  /**
   * 8 Koleksiyon tanımı — ayrı bir listede tutulmaz, verideki bilgilere bakılarak hesaplanır.
   */
  const COLLECTIONS = [
    {
      id: 'kucuk-kasabalar-buyuk-sirlar',
      title: 'Küçük kasabalar, büyük sırlar',
      description: 'Herkesin herkesi tanıdığı yerlerde saklı kalan olaylar.',
      match: (item) => (item.tags || []).includes('kasaba')
    },
    {
      id: 'zaman-ve-hafiza',
      title: 'Zaman ve hafıza',
      description: 'Geçmişin kayıtları, unutulanlar ve geri dönenler.',
      match: (item) => {
        const tags = item.tags || [];
        return tags.includes('zaman') || tags.includes('hafıza');
      }
    },
    {
      id: 'yola-cikanlar',
      title: 'Yola çıkanlar',
      description: 'Bir yerden bir yere giderken değişen insanlar.',
      match: (item) => (item.tags || []).includes('yolculuk')
    },
    {
      id: 'miras-ve-aile',
      title: 'Miras ve aile',
      description: 'Evler, tarlalar ve bölüşülemeyen ortak geçmiş.',
      match: (item) => (item.tags || []).includes('miras')
    },
    {
      id: 'yarinin-dunyalari',
      title: 'Yarının dünyaları',
      description: 'Gelecek, yapay zekâ, uzay ve gözetim üzerine kurgular.',
      match: (item) => {
        const tags = item.tags || [];
        return (
          tags.includes('gelecek') ||
          tags.includes('yapay zekâ') ||
          tags.includes('uzay') ||
          tags.includes('gözetim')
        );
      }
    },
    {
      id: 'bir-oturusta-bitenler',
      title: 'Bir oturuşta bitenler',
      description: 'Kısa filmler, mini diziler ve ince kitaplar.',
      match: (item) => {
        if (item.category === 'film') return item.runtime <= 95;
        if (item.category === 'dizi') return item.episodes <= 10;
        if (item.category === 'kitap') return item.pages <= 200;
        return false;
      }
    },
    {
      id: 'seri-halinde',
      title: 'Seri hâlinde',
      description: 'Birden fazla parçası olan film ve kitap serileri.',
      match: (item) => Boolean(item.series)
    },
    {
      id: 'turkce-asli',
      title: 'Türkçe aslı',
      description: 'Türkçe çekilmiş ya da Türkçe yazılmış yapımlar.',
      match: (item) => (item.lang || []).includes('Türkçe')
    }
  ];

  const COLLECTIONS_BY_ID = new Map(COLLECTIONS.map((c) => [c.id, c]));

  /* ==========================================================================
     2. UYGULAMA DURUMU (STATE)
     ========================================================================== */
  const state = {
    allItems: [],
    byId: new Map(),
    lists: {
      dizi: [],
      film: [],
      kitap: []
    },
    facets: {
      genres: [],
      decades: [],
      langs: [],
      countries: []
    },
    savedIds: [], // Son kaydedilen en başta duracak şekilde dizi
    favIds: [], // Son beğenilen en başta duracak şekilde dizi
    baseView: 'anasayfa', // 'anasayfa' | 'kesfet' | 'favoriler' | 'kaydedilenler'
    activeModalId: null,
    activePlayerId: null,
    detailScrollTop: 0,
    savedBaseScrollY: 0,
    modalHistoryDepth: 0,
    openedPlayerFromHistory: false,

    // Keşfet Durumu
    explore: {
      categories: new Set(), // Boşsa "Hepsi" demektir; 1 veya 2 kategori seçilebilir
      query: '',
      sort: 'onerilen', // 'onerilen' | 'yeni' | 'eski' | 'az' | 'za'
      genres: new Set(),
      decades: new Set(),
      yearMin: null,
      yearMax: null,
      langs: new Set(),
      countries: new Set(),
      tags: new Set(),
      collection: null,
      showAllGenres: false,
      visibleCount: PAGE_SIZE
    },

    // Oynatıcı / Okuyucu Durumu
    player: {
      itemId: null,
      season: 1,
      episode: 1,
      selectedSeasonTab: 1,
      status: 'idle', // 'idle' | 'loading' | 'error'
      timerId: null
    },

    // Kaydedilenleri ve favorileri temizle onay durumu
    clearConfirmTimer: null,
    clearConfirming: false,
    clearFavConfirmTimer: null,
    clearFavConfirming: false
  };

  /* ==========================================================================
     3. YARDIMCI FONKSİYONLAR (Biçimlendirme ve Arama Normalizasyonu)
     ========================================================================== */
  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Büyük-küçük harf, Türkçe karakter ve noktalama duyarsız normalizasyon.
   */
  function normalizeForSearch(str) {
    return String(str || '')
      .toLocaleLowerCase('tr-TR')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/i̇/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[âäáà]/g, 'a')
      .replace(/[îïíì]/g, 'i')
      .replace(/[ûúù]/g, 'u')
      .replace(/[êëéè]/g, 'e')
      .replace(/[ôóò]/g, 'o')
      .replace(/[^\p{L}\p{N}\s]+/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function tokenizeNormalized(str) {
    const norm = normalizeForSearch(str);
    return norm ? norm.split(' ') : [];
  }

  /**
   * Dizilerde yıl gösterimi:
   * Tamamlandıysa (veya İptal edildiyse) "yayın yılı–bitiş yılı" (örn. "2015–2019"),
   * devam ediyorsa "yayın yılı–" (örn. "2015–").
   */
  function formatDiziYear(item) {
    if (item.status === 'Devam ediyor' || item.yearEnd === null || item.yearEnd === undefined) {
      return `${item.year}–`;
    }
    return `${item.year}–${item.yearEnd}`;
  }

  /**
   * Film süresi (kısa): "1 sa 42 dk"
   */
  function formatRuntimeShort(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m} dk`;
    if (m === 0) return `${h} sa`;
    return `${h} sa ${m} dk`;
  }

  /**
   * Film süresi (tam): "102 dk (1 sa 42 dk)"
   */
  function formatRuntimeFull(minutes) {
    return `${minutes} dk (${formatRuntimeShort(minutes)})`;
  }

  /**
   * Seri gösterimi (Ayrıntı penceresi):
   * Film için "Atlı Yargıç Üçlemesi (2/3. film)",
   * Kitap için "Dedektif Harlow Serisi (3/3. kitap)"
   */
  function formatSeriesFull(item) {
    if (!item.series) return '';
    const typeWord = item.category === 'film' ? 'film' : 'kitap';
    return `${item.series.name} (${item.series.no}/${item.series.total}. ${typeWord})`;
  }

  /**
   * Seri etiketi (Kart): "Seri 1/3"
   */
  function formatSeriesBadge(item) {
    if (!item.series) return '';
    return `Seri ${item.series.no}/${item.series.total}`;
  }

  /**
   * Çevirmen: Aslı Türkçe olan kitaplarda "Çeviri değil, aslı Türkçe"
   */
  function formatTranslators(item) {
    if (item.original) {
      return 'Çeviri değil, aslı Türkçe';
    }
    return (item.translators || []).join(', ');
  }

  /**
   * Dizi bölümlerini sezonlara eşit dağıt, artan olursa ilk sezonlara birer birer ekle.
   * Örn: 4 sezon, 25 bölüm -> [7, 6, 6, 6]
   */
  function getSeasonEpisodeCounts(seasons, totalEpisodes) {
    const sCount = Math.max(1, Number(seasons) || 1);
    const epTotal = Math.max(sCount, Number(totalEpisodes) || sCount);
    const base = Math.floor(epTotal / sCount);
    const rem = epTotal % sCount;
    const result = [];
    for (let i = 0; i < sCount; i++) {
      result.push(base + (i < rem ? 1 : 0));
    }
    return result;
  }

  /* ==========================================================================
     4. KODLA ÇİZİLEN DETERMİNİSTİK KAPAK ÜRETİCİSİ
     ========================================================================== */
  function hashString(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function createPRNG(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const coverSvgCache = new Map();
  let coverInstanceSeq = 0;

  /**
   * Her kayıt için id'sinden deterministik olarak benzersiz bir SVG sanat katmanı ve kapak oluşturur.
   * Üç kategorinin her birinin kendine özgü çerçevesi vardır.
   */
  function buildCoverHTML(item, isDecorative = false) {
    let cached = coverSvgCache.get(item.id);
    if (!cached) {
      const seed = hashString(item.id + '::' + item.category + '::' + item.globalIdx);
      const rand = createPRNG(seed);

      // Her kayıt için benzersiz renk tonları
      const baseHue = (item.globalIdx * 137.508 + (seed % 60)) % 360;
      const secHue = (baseHue + 38 + Math.floor(rand() * 75)) % 360;
      const accHue = (baseHue + 145 + Math.floor(rand() * 90)) % 360;

      const bgSat = 46 + Math.floor(rand() * 28);
      const bgLight1 = 18 + Math.floor(rand() * 14);
      const bgLight2 = 28 + Math.floor(rand() * 16);

      const c1 = `hsl(${baseHue.toFixed(1)}, ${bgSat}%, ${bgLight1}%)`;
      const c2 = `hsl(${secHue.toFixed(1)}, ${bgSat + 8}%, ${bgLight2}%)`;
      const accent1 = `hsl(${accHue.toFixed(1)}, 78%, 62%)`;
      const accent2 = `hsl(${secHue.toFixed(1)}, 82%, 70%)`;
      const accent3 = `hsl(${baseHue.toFixed(1)}, 70%, 78%)`;

      const gradAngle = Math.floor(rand() * 360);
      const radX = (20 + rand() * 60).toFixed(1);
      const radY = (15 + rand() * 45).toFixed(1);

      // 8 farklı ana geometrik kompozisyon ailesi + sürekli değişen koordinatlar
      const patternType = seed % 8;
      let shapes = '';

      if (patternType === 0) {
        // Yörünge halkaları ve gezegen küreleri
        const cx = 40 + rand() * 120;
        const cy = 50 + rand() * 110;
        const r1 = 28 + rand() * 42;
        const r2 = r1 + 18 + rand() * 30;
        const r3 = r2 + 16 + rand() * 25;
        shapes += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r3.toFixed(1)}" fill="none" stroke="${accent2}" stroke-opacity="0.26" stroke-width="1.5" stroke-dasharray="${4 + Math.floor(rand() * 8)} ${3 + Math.floor(rand() * 6)}"/>`;
        shapes += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r2.toFixed(1)}" fill="none" stroke="${accent1}" stroke-opacity="0.38" stroke-width="2"/>`;
        shapes += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r1.toFixed(1)}" fill="${accent1}" fill-opacity="0.45"/>`;
        const moonX = cx + Math.cos(rand() * 6.28) * r2;
        const moonY = cy + Math.sin(rand() * 6.28) * r2;
        shapes += `<circle cx="${moonX.toFixed(1)}" cy="${moonY.toFixed(1)}" r="${(6 + rand() * 9).toFixed(1)}" fill="${accent3}" fill-opacity="0.8"/>`;
      } else if (patternType === 1) {
        // Katmanlı dağ / ufuk dalgaları ve güneş
        const sunX = 45 + rand() * 110;
        const sunY = 45 + rand() * 65;
        const sunR = 22 + rand() * 26;
        shapes += `<circle cx="${sunX.toFixed(1)}" cy="${sunY.toFixed(1)}" r="${sunR.toFixed(1)}" fill="${accent1}" fill-opacity="0.65"/>`;
        for (let l = 0; l < 4; l++) {
          const yBase = 115 + l * 32 + rand() * 14;
          const p1 = yBase - 20 - rand() * 35;
          const p2 = yBase + 10 + rand() * 25;
          const op = (0.22 + l * 0.14).toFixed(2);
          shapes += `<path d="M -10 ${yBase.toFixed(1)} Q 55 ${p1.toFixed(1)}, 110 ${yBase.toFixed(1)} T 210 ${p2.toFixed(1)} L 210 310 L -10 310 Z" fill="${l % 2 === 0 ? accent2 : accent1}" fill-opacity="${op}"/>`;
        }
      } else if (patternType === 2) {
        // Bauhaus prizma ve diyagonal bloklar
        for (let i = 0; i < 5; i++) {
          const w = 45 + rand() * 90;
          const h = 45 + rand() * 110;
          const x = 15 + rand() * 130;
          const y = 20 + rand() * 160;
          const rot = -35 + rand() * 70;
          const col = i % 3 === 0 ? accent1 : (i % 3 === 1 ? accent2 : accent3);
          shapes += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="${(4 + rand() * 18).toFixed(1)}" transform="rotate(${rot.toFixed(1)} ${(x + w / 2).toFixed(1)} ${(y + h / 2).toFixed(1)})" fill="${col}" fill-opacity="${(0.18 + rand() * 0.35).toFixed(2)}" stroke="${accent3}" stroke-opacity="0.28"/>`;
        }
      } else if (patternType === 3) {
        // Eşmerkezli elips / topoğrafik izohips halkaları
        const cx = 60 + rand() * 80;
        const cy = 65 + rand() * 95;
        const baseRot = -40 + rand() * 80;
        for (let r = 1; r <= 6; r++) {
          const rx = r * (12 + rand() * 6);
          const ry = r * (18 + rand() * 8);
          shapes += `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" transform="rotate(${(baseRot + r * 6).toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})" fill="${r === 1 ? accent1 : 'none'}" fill-opacity="0.5" stroke="${r % 2 === 0 ? accent1 : accent2}" stroke-opacity="${(0.65 - r * 0.08).toFixed(2)}" stroke-width="2"/>`;
        }
      } else if (patternType === 4) {
        // Mimari kemer ve perspektif koridoru
        const archW = 90 + rand() * 44;
        const archX = (200 - archW) / 2;
        const archTop = 38 + rand() * 30;
        shapes += `<path d="M ${archX.toFixed(1)} 250 L ${archX.toFixed(1)} ${(archTop + archW / 2).toFixed(1)} A ${(archW / 2).toFixed(1)} ${(archW / 2).toFixed(1)} 0 0 1 ${(archX + archW).toFixed(1)} ${(archTop + archW / 2).toFixed(1)} L ${(archX + archW).toFixed(1)} 250 Z" fill="${accent1}" fill-opacity="0.28" stroke="${accent2}" stroke-opacity="0.55" stroke-width="2"/>`;
        const inW = archW * 0.64;
        const inX = (200 - inW) / 2;
        const inTop = archTop + 26;
        shapes += `<path d="M ${inX.toFixed(1)} 250 L ${inX.toFixed(1)} ${(inTop + inW / 2).toFixed(1)} A ${(inW / 2).toFixed(1)} ${(inW / 2).toFixed(1)} 0 0 1 ${(inX + inW).toFixed(1)} ${(inTop + inW / 2).toFixed(1)} L ${(inX + inW).toFixed(1)} 250 Z" fill="${accent2}" fill-opacity="0.34"/>`;
        shapes += `<circle cx="100" cy="${(inTop + inW * 0.45).toFixed(1)}" r="${(12 + rand() * 14).toFixed(1)}" fill="${accent3}" fill-opacity="0.75"/>`;
      } else if (patternType === 5) {
        // Takımyıldız ve kristal poligon ağı
        const pts = [];
        for (let p = 0; p < 7; p++) {
          pts.push([28 + rand() * 144, 28 + rand() * 165]);
        }
        for (let i = 0; i < pts.length - 1; i++) {
          shapes += `<line x1="${pts[i][0].toFixed(1)}" y1="${pts[i][1].toFixed(1)}" x2="${pts[i + 1][0].toFixed(1)}" y2="${pts[i + 1][1].toFixed(1)}" stroke="${accent2}" stroke-opacity="0.48" stroke-width="1.8"/>`;
          if (i + 2 < pts.length) {
            shapes += `<polygon points="${pts[i][0].toFixed(1)},${pts[i][1].toFixed(1)} ${pts[i + 1][0].toFixed(1)},${pts[i + 1][1].toFixed(1)} ${pts[i + 2][0].toFixed(1)},${pts[i + 2][1].toFixed(1)}" fill="${i % 2 === 0 ? accent1 : accent2}" fill-opacity="0.2"/>`;
          }
        }
        pts.forEach((pt, idx) => {
          shapes += `<circle cx="${pt[0].toFixed(1)}" cy="${pt[1].toFixed(1)}" r="${(3.5 + (idx % 3) * 2.2).toFixed(1)}" fill="${accent3}" fill-opacity="0.88"/>`;
        });
      } else if (patternType === 6) {
        // Işın demeti ve paralel prizmatik şeritler
        const originX = 20 + rand() * 160;
        const originY = 25 + rand() * 90;
        const rays = 9 + Math.floor(rand() * 6);
        for (let r = 0; r < rays; r++) {
          const angle = (r / rays) * Math.PI * 2;
          const x2 = originX + Math.cos(angle) * 220;
          const y2 = originY + Math.sin(angle) * 220;
          shapes += `<line x1="${originX.toFixed(1)}" y1="${originY.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${r % 2 === 0 ? accent1 : accent2}" stroke-opacity="0.32" stroke-width="${(2 + (r % 3) * 2).toFixed(1)}"/>`;
        }
        shapes += `<circle cx="${originX.toFixed(1)}" cy="${originY.toFixed(1)}" r="${(20 + rand() * 22).toFixed(1)}" fill="${accent1}" fill-opacity="0.6" stroke="${accent3}" stroke-width="2" stroke-opacity="0.7"/>`;
      } else {
        // Soyut elmas ve kesişen dairesel plakalar
        const cx = 100;
        const cy = 95 + (rand() - 0.5) * 35;
        const dSize = 48 + rand() * 34;
        shapes += `<polygon points="${cx},${(cy - dSize).toFixed(1)} ${(cx + dSize * 0.85).toFixed(1)},${cy.toFixed(1)} ${cx},${(cy + dSize).toFixed(1)} ${(cx - dSize * 0.85).toFixed(1)},${cy.toFixed(1)}" fill="${accent1}" fill-opacity="0.42" stroke="${accent3}" stroke-opacity="0.6" stroke-width="2"/>`;
        shapes += `<circle cx="${(cx - 22 + rand() * 44).toFixed(1)}" cy="${(cy - 20 + rand() * 40).toFixed(1)}" r="${(26 + rand() * 22).toFixed(1)}" fill="${accent2}" fill-opacity="0.38"/>`;
        shapes += `<circle cx="${cx}" cy="${cy.toFixed(1)}" r="${(10 + rand() * 10).toFixed(1)}" fill="${accent3}" fill-opacity="0.85"/>`;
      }

      // Kategoriye özel SVG çerçeve detayı
      let catFrameSvg = '';
      if (item.category === 'dizi') {
        // Ekran köşe vizör işaretleri
        catFrameSvg = `
          <path d="M 18 34 L 18 20 L 32 20" fill="none" stroke="#ffffff" stroke-opacity="0.7" stroke-width="2.2" stroke-linecap="round"/>
          <path d="M 182 34 L 182 20 L 168 20" fill="none" stroke="#ffffff" stroke-opacity="0.7" stroke-width="2.2" stroke-linecap="round"/>
        `;
      } else if (item.category === 'film') {
        // Sinema şeridi üst/alt ince kadraj çizgileri
        catFrameSvg = `
          <line x1="22" y1="22" x2="178" y2="22" stroke="#ffffff" stroke-opacity="0.55" stroke-width="1.5"/>
          <circle cx="100" cy="22" r="3.5" fill="${COLORS.film}" stroke="#ffffff" stroke-width="1.2"/>
        `;
      } else {
        // Kitap cildi süs mührü
        catFrameSvg = `
          <polygon points="106,24 112,30 106,36 100,30" fill="${COLORS.kitap}" fill-opacity="0.85"/>
          <line x1="42" y1="30" x2="94" y2="30" stroke="#ffffff" stroke-opacity="0.45" stroke-width="1.2"/>
          <line x1="118" y1="30" x2="170" y2="30" stroke="#ffffff" stroke-opacity="0.45" stroke-width="1.2"/>
        `;
      }

      cached = {
        gradAngle,
        c1,
        c2,
        radX,
        radY,
        accent1,
        innerSvg: `${shapes}${catFrameSvg}`
      };
      coverSvgCache.set(item.id, cached);
    }

    const seq = ++coverInstanceSeq;
    const gradId = `g_${item.id}_${seq}`;
    const radId = `r_${item.id}_${seq}`;

    const svgMarkup = `
      <svg class="cover-art-svg" viewBox="0 0 200 300" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="${gradId}" gradientTransform="rotate(${cached.gradAngle} 0.5 0.5)">
            <stop offset="0%" stop-color="${cached.c1}"/>
            <stop offset="100%" stop-color="${cached.c2}"/>
          </linearGradient>
          <radialGradient id="${radId}" cx="${cached.radX}%" cy="${cached.radY}%" r="70%">
            <stop offset="0%" stop-color="${cached.accent1}" stop-opacity="0.32"/>
            <stop offset="100%" stop-color="${cached.c1}" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="200" height="300" fill="url(#${gradId})"/>
        <rect width="200" height="300" fill="url(#${radId})"/>
        ${cached.innerSvg}
      </svg>
    `;

    const ariaAttrs = isDecorative
      ? 'aria-hidden="true"'
      : `role="img" aria-label="${escapeHtml(item.title)}"`;

    const catMeta = CATEGORY_META[item.category];
    const infoLine = buildCoverInfoLine(item, true);
    const genresText = (item.genres || []).join(', ');

    return `
      <div class="generated-cover" data-cat="${item.category}" ${ariaAttrs}>
        ${svgMarkup}
        <div class="cover-frame cover-frame-${item.category}" aria-hidden="true"></div>
        <div class="cover-top-meta" aria-hidden="true">
          <span class="cover-top-cat">${escapeHtml(catMeta.label)}</span>
        </div>
        <div class="cover-typography" aria-hidden="true">
          <span class="cover-info-text">${escapeHtml(infoLine)}</span>
          <span class="cover-title-text">${escapeHtml(item.title)}</span>
          ${genresText ? `<span class="cover-genres-text">${escapeHtml(genresText)}</span>` : ''}
        </div>
      </div>
    `;
  }

  function buildCoverInfoLine(item, includeSeries = true) {
    let yearDisplay = '';
    let shortInfo = '';

    if (item.category === 'dizi') {
      yearDisplay = formatDiziYear(item);
      shortInfo = `${item.seasons} sezon`;
    } else if (item.category === 'film') {
      yearDisplay = String(item.year);
      shortInfo = formatRuntimeShort(item.runtime);
    } else {
      yearDisplay = String(item.year);
      shortInfo = `${item.pages} sayfa`;
    }

    let line = `${yearDisplay} · ${shortInfo}`;
    if (includeSeries && item.series) {
      line += ` · ${formatSeriesBadge(item)}`;
    }
    return line;
  }

  /* ==========================================================================
     5. TEMA VE SAKLAMA (localStorage) YÖNETİMİ
     ========================================================================== */
  function initTheme() {
    let savedTheme = null;
    try {
      savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
    } catch (_) {}

    if (savedTheme === 'dark' || savedTheme === 'light') {
      applyTheme(savedTheme, false);
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(prefersDark ? 'dark' : 'light', false);
    }

    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        let manual = null;
        try {
          manual = localStorage.getItem(STORAGE_KEYS.theme);
        } catch (_) {}
        if (!manual) {
          applyTheme(e.matches ? 'dark' : 'light', false);
        }
      });
    }
  }

  function applyTheme(theme, persist = true) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEYS.theme, theme);
      } catch (_) {}
    }
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
      const label = theme === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç';
      themeBtn.setAttribute('aria-label', label);
      themeBtn.setAttribute('title', label);
    }
  }

  function toggleTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    applyTheme(isDark ? 'light' : 'dark', true);
  }

  function loadSavedItems() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.saved);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          state.savedIds = parsed.filter((id) => typeof id === 'string');
        }
      }
    } catch (_) {
      state.savedIds = [];
    }
  }

  function persistSavedItems() {
    try {
      localStorage.setItem(STORAGE_KEYS.saved, JSON.stringify(state.savedIds));
    } catch (_) {}
    updateSavedBadges();
  }

  function isItemSaved(id) {
    return state.savedIds.includes(id);
  }

  function toggleSaveItem(id) {
    const idx = state.savedIds.indexOf(id);
    if (idx !== -1) {
      state.savedIds.splice(idx, 1);
    } else {
      // Son kaydedilen en başta dursun
      state.savedIds.unshift(id);
    }
    persistSavedItems();
    syncSaveButtonsInDOM(id);
    if (state.baseView === 'kaydedilenler') {
      renderSavedView();
    }
  }

  function updateSavedBadges() {
    const count = state.savedIds.length;
    const badgeDesktop = document.getElementById('savedBadgeDesktop');
    const badgeMobile = document.getElementById('savedBadgeMobile');
    if (badgeDesktop) {
      badgeDesktop.textContent = String(count);
      badgeDesktop.hidden = count === 0;
    }
    if (badgeMobile) {
      badgeMobile.textContent = String(count);
      badgeMobile.hidden = count === 0;
    }
  }

  function syncSaveButtonsInDOM(id) {
    const saved = isItemSaved(id);
    const item = state.byId.get(id);
    const itemTitle = item ? item.title : '';

    // Kartlardaki kaydet butonları
    document.querySelectorAll(`.card-save-btn[data-save-id="${CSS.escape(id)}"]`).forEach((btn) => {
      btn.classList.toggle('saved', saved);
      btn.setAttribute('aria-pressed', saved ? 'true' : 'false');
      btn.setAttribute('aria-label', saved ? `${itemTitle} kaydını kaydedilenlerden çıkar` : `${itemTitle} kaydını kaydet`);
      btn.innerHTML = getBookmarkSvg(saved);
    });

    // Ayrıntı penceresindeki kaydet butonu
    const detailSaveBtn = document.getElementById('detailSaveBtn');
    if (detailSaveBtn && detailSaveBtn.dataset.saveId === id) {
      detailSaveBtn.classList.toggle('saved', saved);
      detailSaveBtn.setAttribute('aria-pressed', saved ? 'true' : 'false');
      detailSaveBtn.innerHTML = `
        ${getBookmarkSvg(saved)}
        <span>${saved ? 'Kaydedildi' : 'Kaydet'}</span>
      `;
    }
  }

  function getBookmarkSvg(filled) {
    return `
      <svg viewBox="0 0 24 24" width="18" height="18" fill="${filled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
      </svg>
    `;
  }

  function loadFavItems() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.fav);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          state.favIds = parsed.filter((id) => typeof id === 'string');
        }
      }
    } catch (_) {
      state.favIds = [];
    }
  }

  function persistFavItems() {
    try {
      localStorage.setItem(STORAGE_KEYS.fav, JSON.stringify(state.favIds));
    } catch (_) {}
    updateFavBadges();
  }

  function isItemLiked(id) {
    return state.favIds.includes(id);
  }

  function toggleFavItem(id) {
    const idx = state.favIds.indexOf(id);
    if (idx !== -1) {
      state.favIds.splice(idx, 1);
    } else {
      // Son beğenilen en başta dursun
      state.favIds.unshift(id);
    }
    persistFavItems();
    syncFavButtonsInDOM(id);
    if (state.baseView === 'favoriler') {
      renderFavoritesView();
    }
  }

  function updateFavBadges() {
    const count = state.favIds.length;
    const badgeDesktop = document.getElementById('favBadgeDesktop');
    const badgeMobile = document.getElementById('favBadgeMobile');
    if (badgeDesktop) {
      badgeDesktop.textContent = String(count);
      badgeDesktop.hidden = count === 0;
    }
    if (badgeMobile) {
      badgeMobile.textContent = String(count);
      badgeMobile.hidden = count === 0;
    }
  }

  function syncFavButtonsInDOM(id) {
    const liked = isItemLiked(id);
    const item = state.byId.get(id);
    const itemTitle = item ? item.title : '';

    // Kartlardaki kalp butonları
    document.querySelectorAll(`.card-fav-btn[data-fav-id="${CSS.escape(id)}"]`).forEach((btn) => {
      btn.classList.toggle('liked', liked);
      btn.setAttribute('aria-pressed', liked ? 'true' : 'false');
      btn.setAttribute('aria-label', liked ? `${itemTitle} kaydını favorilerden çıkar` : `${itemTitle} kaydını beğen`);
      btn.innerHTML = getHeartSvg(liked);
    });

    // Ayrıntı penceresindeki beğen butonu
    const detailFavBtn = document.getElementById('detailFavBtn');
    if (detailFavBtn && detailFavBtn.dataset.favId === id) {
      detailFavBtn.classList.toggle('liked', liked);
      detailFavBtn.setAttribute('aria-pressed', liked ? 'true' : 'false');
      detailFavBtn.innerHTML = `
        ${getHeartSvg(liked)}
        <span>${liked ? 'Beğendin' : 'Beğen'}</span>
      `;
    }
  }

  function getHeartSvg(filled) {
    return `
      <svg viewBox="0 0 24 24" width="18" height="18" fill="${filled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
    `;
  }

  function getCategoryIconSvg(category) {
    if (category === 'dizi') {
      return `
        <svg class="cat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect>
          <polyline points="17 2 12 7 7 2"></polyline>
        </svg>
      `;
    }
    if (category === 'film') {
      return `
        <svg class="cat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
          <line x1="7" y1="2" x2="7" y2="22"></line>
          <line x1="17" y1="2" x2="17" y2="22"></line>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <line x1="2" y1="7" x2="7" y2="7"></line>
          <line x1="2" y1="17" x2="7" y2="17"></line>
          <line x1="17" y1="17" x2="22" y2="17"></line>
          <line x1="17" y1="7" x2="22" y2="7"></line>
        </svg>
      `;
    }
    return `
      <svg class="cat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
      </svg>
    `;
  }

  /* ==========================================================================
     6. VERİ YÜKLEME VE İNDEKSLEME
     ========================================================================== */
  async function loadData() {
    const response = await fetch('veri.json');
    if (!response.ok) {
      throw new Error('Veri dosyası yüklenemedi.');
    }
    const raw = await response.json();

    const genresSet = new Set();
    const decadesSet = new Set();
    const langsSet = new Set();
    const countriesSet = new Set();

    let globalIdx = 0;

    ['dizi', 'film', 'kitap'].forEach((cat) => {
      const arr = Array.isArray(raw[cat]) ? raw[cat] : [];
      arr.forEach((entry, catIdx) => {
        const titleWords = tokenizeNormalized(entry.title);
        const genreWords = [];
        (entry.genres || []).forEach((g) => {
          genresSet.add(g);
          tokenizeNormalized(g).forEach((w) => genreWords.push(w));
        });

        const tagWords = [];
        (entry.tags || []).forEach((t) => {
          tokenizeNormalized(t).forEach((w) => tagWords.push(w));
        });

        const decade = Math.floor(Number(entry.year) / 10) * 10;
        decadesSet.add(decade);

        (entry.lang || []).forEach((l) => langsSet.add(l));

        const validCountries = cat === 'kitap' ? [] : (entry.country || []);
        validCountries.forEach((c) => countriesSet.add(c));

        const item = {
          ...entry,
          category: cat,
          catIndex: catIdx,
          globalIdx: globalIdx++,
          country: validCountries,
          decade,
          _titleWords: titleWords,
          _genreWords: genreWords,
          _tagWords: tagWords
        };

        state.lists[cat].push(item);
        state.allItems.push(item);
        state.byId.set(item.id, item);
      });
    });

    // Geçerli olmayan kaydedilen ve favori ID'leri temizle
    state.savedIds = state.savedIds.filter((id) => state.byId.has(id));
    state.favIds = state.favIds.filter((id) => state.byId.has(id));

    // Filtre seçeneklerini sırala:
    // 1. Tür: Alfabetik (Türkçe)
    state.facets.genres = Array.from(genresSet).sort((a, b) => a.localeCompare(b, 'tr'));

    // 2. Çıkış/yayın yılı: On yıllar hâlinde (1920'ler, 1930'lar...)
    state.facets.decades = Array.from(decadesSet).sort((a, b) => a - b);

    // 3. Orijinal dil: Önce Türkçe ve İngilizce, sonra diğerleri alfabetik
    const priorityLangs = ['Türkçe', 'İngilizce'];
    const otherLangs = Array.from(langsSet)
      .filter((l) => !priorityLangs.includes(l))
      .sort((a, b) => a.localeCompare(b, 'tr'));
    state.facets.langs = [
      ...priorityLangs.filter((l) => langsSet.has(l)),
      ...otherLangs
    ];

    // 4. Ülke: Alfabetik
    state.facets.countries = Array.from(countriesSet).sort((a, b) => a.localeCompare(b, 'tr'));
  }

  /* ==========================================================================
     7. ANA SAYFA RENDER İŞLEMLERİ
     ========================================================================== */
  function renderHomePanels() {
    document.getElementById('homeCountDizi').textContent = `${state.lists.dizi.length} dizi`;
    document.getElementById('homeCountFilm').textContent = `${state.lists.film.length} film`;
    document.getElementById('homeCountKitap').textContent = `${state.lists.kitap.length} kitap`;

    // Her panelin sağ üst yarısında o kategoriden rastgele 3 kapak
    ['dizi', 'film', 'kitap'].forEach((cat) => {
      const containerId = cat === 'dizi' ? 'homeCoversDizi' : (cat === 'film' ? 'homeCoversFilm' : 'homeCoversKitap');
      const container = document.getElementById(containerId);
      if (!container) return;

      const list = state.lists[cat];
      const picks = pickRandomItems(list, 3);
      container.innerHTML = picks
        .map((item) => `<div class="panel-mini-cover">${buildCoverHTML(item, true)}</div>`)
        .join('');
    });

    renderHomeCollections();
  }

  /**
   * Ana sayfadaki 8 koleksiyon satırını veriden hesaplayarak çizer.
   * Sağdaki 3 küçük kapak mümkünse üç farklı kategoriden seçilir.
   */
  function renderHomeCollections() {
    const listEl = document.getElementById('collectionsList');
    if (!listEl) return;

    const rowsHtml = COLLECTIONS.map((col) => {
      const matchingItems = state.allItems.filter(col.match);
      const covers = pickCollectionCovers(matchingItems);
      const coversHtml = covers
        .map((it) => `<div class="collection-mini-cover">${buildCoverHTML(it, true)}</div>`)
        .join('');

      return `
        <button type="button" class="collection-row" data-collection-id="${escapeHtml(col.id)}">
          <div class="collection-row-left">
            <h3 class="collection-row-title">${escapeHtml(col.title)}</h3>
            <p class="collection-row-desc">${escapeHtml(col.description)}</p>
            <span class="collection-row-count">${matchingItems.length} yapım</span>
          </div>
          <div class="collection-row-covers" aria-hidden="true">
            ${coversHtml}
          </div>
        </button>
      `;
    });

    listEl.innerHTML = rowsHtml.join('');
  }

  /**
   * Koleksiyon kapaklarını mümkünse üç farklı kategoriden (Dizi, Film, Kitap) seçer.
   */
  function pickCollectionCovers(items) {
    const byCat = {
      dizi: items.filter((it) => it.category === 'dizi'),
      film: items.filter((it) => it.category === 'film'),
      kitap: items.filter((it) => it.category === 'kitap')
    };

    const picked = [];
    const usedIds = new Set();

    ['dizi', 'film', 'kitap'].forEach((cat) => {
      if (byCat[cat].length > 0 && picked.length < 3) {
        const choice = byCat[cat][Math.floor(Math.random() * byCat[cat].length)];
        picked.push(choice);
        usedIds.add(choice.id);
      }
    });

    if (picked.length < 3) {
      const remaining = items.filter((it) => !usedIds.has(it.id));
      const extras = pickRandomItems(remaining, 3 - picked.length);
      extras.forEach((ex) => picked.push(ex));
    }

    return picked;
  }

  function pickRandomItems(arr, count) {
    const copy = arr.slice();
    const result = [];
    for (let i = 0; i < count && copy.length > 0; i++) {
      const rIdx = Math.floor(Math.random() * copy.length);
      result.push(copy.splice(rIdx, 1)[0]);
    }
    return result;
  }

  /* ==========================================================================
     8. KEŞFET: ARAMA, FİLTRELEME VE SIRALAMA MOTORU
     ========================================================================== */
  /**
   * Arama eşleşmesi ve alaka puanı:
   * - 0: eşleşmedi
   * - 1: adının ilk kelimesi eşleşti (en alakalı)
   * - 2: adının başka bir kelimesi eşleşti
   * - 3: türü eşleşti
   * - 4: yalnızca konu etiketi eşleşti (en sonda)
   */
  function evaluateSearchMatch(item, queryWords) {
    if (!queryWords || queryWords.length === 0) return 1;

    const titleWords = item._titleWords;
    const genreWords = item._genreWords;
    const tagWords = item._tagWords || [];

    let anyFirstTitleWord = false;
    let anyTitleWord = false;
    let anyGenreWord = false;

    for (let i = 0; i < queryWords.length; i++) {
      const qw = queryWords[i];
      const matchesFirstTitle = titleWords.length > 0 && titleWords[0].startsWith(qw);
      const matchesAnyTitle = matchesFirstTitle || titleWords.some((tw) => tw.startsWith(qw));
      const matchesAnyGenre = genreWords.some((gw) => gw.startsWith(qw));
      const matchesAnyTag = tagWords.some((tgw) => tgw.startsWith(qw));

      if (!matchesAnyTitle && !matchesAnyGenre && !matchesAnyTag) {
        return 0; // Birden fazla kelime yazılırsa her kelime eşleşmeli
      }

      if (matchesFirstTitle) anyFirstTitleWord = true;
      if (matchesAnyTitle) anyTitleWord = true;
      if (matchesAnyGenre) anyGenreWord = true;
    }

    if (anyFirstTitleWord) return 1;
    if (anyTitleWord) return 2;
    if (anyGenreWord) return 3;
    return 4;
  }

  /**
   * Bir kaydın belirli filtre gruplarına uyup uymadığını kontrol eder.
   * `ignoreGroup` parametresi, her filtre seçeneğinin yanındaki sayıyı hesaplarken
   * o grubun kendi seçimini hariç tutmak için kullanılır.
   */
  function matchesExploreFilters(item, ignoreGroup = null) {
    const exp = state.explore;

    // Kategori kontrolü
    if (ignoreGroup !== 'category') {
      if (exp.categories.size > 0 && !exp.categories.has(item.category)) {
        return false;
      }
    }

    // Tür kontrolü (aynı grup içinde VEYA)
    if (ignoreGroup !== 'genre' && exp.genres.size > 0) {
      const hasGenre = (item.genres || []).some((g) => exp.genres.has(g));
      if (!hasGenre) return false;
    }

    // Yıl kontrolü (on yıllar VEYA En erken / En geç aralığı)
    if (ignoreGroup !== 'year') {
      if (exp.decades.size > 0) {
        if (!exp.decades.has(item.decade)) return false;
      } else if (exp.yearMin !== null || exp.yearMax !== null) {
        if (exp.yearMin !== null && item.year < exp.yearMin) return false;
        if (exp.yearMax !== null && item.year > exp.yearMax) return false;
      }
    }

    // Orijinal dil kontrolü
    if (ignoreGroup !== 'lang' && exp.langs.size > 0) {
      const hasLang = (item.lang || []).some((l) => exp.langs.has(l));
      if (!hasLang) return false;
    }

    // Ülke kontrolü (yalnızca Kitaplar seçiliyken ülke filtresi uygulanmaz)
    const isOnlyBooks = exp.categories.size === 1 && exp.categories.has('kitap');
    if (!isOnlyBooks && ignoreGroup !== 'country' && exp.countries.size > 0) {
      const hasCountry = (item.country || []).some((c) => exp.countries.has(c));
      if (!hasCountry) return false;
    }

    // Konu etiketi kontrolü
    if (ignoreGroup !== 'tag' && exp.tags.size > 0) {
      const hasTag = (item.tags || []).some((t) => exp.tags.has(t));
      if (!hasTag) return false;
    }

    // Koleksiyon kontrolü
    if (ignoreGroup !== 'collection' && exp.collection) {
      const colDef = COLLECTIONS_BY_ID.get(exp.collection);
      if (colDef && !colDef.match(item)) return false;
    }

    return true;
  }

  /**
   * "Önerilen sıra" için kategorileri dönüşümlü (bir dizi, bir film, bir kitap...) diz.
   */
  function interleaveByCategory(items) {
    const buckets = {
      dizi: [],
      film: [],
      kitap: []
    };
    items.forEach((it) => {
      buckets[it.category].push(it);
    });

    const result = [];
    let idx = 0;
    const order = ['dizi', 'film', 'kitap'];
    while (
      idx < buckets.dizi.length ||
      idx < buckets.film.length ||
      idx < buckets.kitap.length
    ) {
      for (let c = 0; c < order.length; c++) {
        const list = buckets[order[c]];
        if (idx < list.length) {
          result.push(list[idx]);
        }
      }
      idx++;
    }
    return result;
  }

  /**
   * Kayıtları seçili sıralama ölçütüne ve arama alaka düzeyine göre sıralar.
   */
  function sortExploreItems(matchedWithRank, hasSearchQuery) {
    const sortMode = state.explore.sort;

    if (sortMode === 'onerilen') {
      if (!hasSearchQuery) {
        // Arama yoksa veri dosyasındaki sırayla üç kategori dönüşümlü gelsin
        return interleaveByCategory(matchedWithRank.map((m) => m.item));
      }
      // Arama varsa: Önce adının ilk kelimesi (1), sonra adının başka kelimesi (2), sonra türü (3), en son konu etiketi (4)
      const tier1 = matchedWithRank.filter((m) => m.rank === 1).map((m) => m.item);
      const tier2 = matchedWithRank.filter((m) => m.rank === 2).map((m) => m.item);
      const tier3 = matchedWithRank.filter((m) => m.rank === 3).map((m) => m.item);
      const tier4 = matchedWithRank.filter((m) => m.rank === 4).map((m) => m.item);
      return [
        ...interleaveByCategory(tier1),
        ...interleaveByCategory(tier2),
        ...interleaveByCategory(tier3),
        ...interleaveByCategory(tier4)
      ];
    }

    const items = matchedWithRank.map((m) => m.item);

    if (sortMode === 'yeni') {
      return items.sort((a, b) => (b.year - a.year) || (a.globalIdx - b.globalIdx));
    }
    if (sortMode === 'eski') {
      return items.sort((a, b) => (a.year - b.year) || (a.globalIdx - b.globalIdx));
    }
    if (sortMode === 'az') {
      return items.sort((a, b) => a.title.localeCompare(b.title, 'tr', { sensitivity: 'base' }));
    }
    if (sortMode === 'za') {
      return items.sort((a, b) => b.title.localeCompare(a.title, 'tr', { sensitivity: 'base' }));
    }
    return items;
  }

  /* ==========================================================================
     9. KEŞFET EKRANI RENDER İŞLEMLERİ
     ========================================================================== */
  function resetExploreState() {
    state.explore.categories.clear();
    state.explore.query = '';
    state.explore.sort = 'onerilen';
    state.explore.genres.clear();
    state.explore.decades.clear();
    state.explore.yearMin = null;
    state.explore.yearMax = null;
    state.explore.langs.clear();
    state.explore.countries.clear();
    state.explore.tags.clear();
    state.explore.collection = null;
    state.explore.showAllGenres = false;
    state.explore.visibleCount = PAGE_SIZE;

    const searchInput = document.getElementById('exploreSearchInput');
    if (searchInput) searchInput.value = '';
    const sortSelect = document.getElementById('exploreSortSelect');
    if (sortSelect) sortSelect.value = 'onerilen';
    const yearMinInput = document.getElementById('yearMinInput');
    if (yearMinInput) yearMinInput.value = '';
    const yearMaxInput = document.getElementById('yearMaxInput');
    if (yearMaxInput) yearMaxInput.value = '';
  }

  function renderExploreView() {
    const exp = state.explore;
    const queryWords = tokenizeNormalized(exp.query);
    const hasSearch = queryWords.length > 0;

    // Yalnızca Kitaplar seçiliyse ülke filtresi temizlenir ve gizlenir
    const isOnlyBooks = exp.categories.size === 1 && exp.categories.has('kitap');
    if (isOnlyBooks && exp.countries.size > 0) {
      exp.countries.clear();
    }

    // 1. Arama eşleşmesini tüm kayıtlar için hesapla
    const searchMatched = [];
    for (let i = 0; i < state.allItems.length; i++) {
      const item = state.allItems[i];
      const rank = evaluateSearchMatch(item, queryWords);
      if (rank > 0) {
        searchMatched.push({ item, rank });
      }
    }

    // 2. Kategori butonlarının sayılarını güncelle (mevcut arama ve diğer filtreler altında)
    const catCounts = { dizi: 0, film: 0, kitap: 0 };
    searchMatched.forEach(({ item }) => {
      if (matchesExploreFilters(item, 'category')) {
        catCounts[item.category]++;
      }
    });
    const totalCatCount = catCounts.dizi + catCounts.film + catCounts.kitap;

    document.getElementById('countAll').textContent = String(totalCatCount);
    document.getElementById('countDizi').textContent = String(catCounts.dizi);
    document.getElementById('countFilm').textContent = String(catCounts.film);
    document.getElementById('countKitap').textContent = String(catCounts.kitap);

    const isAllSelected = exp.categories.size === 0;
    document.getElementById('pillAll').classList.toggle('active', isAllSelected);
    document.getElementById('pillDizi').classList.toggle('active', exp.categories.has('dizi'));
    document.getElementById('pillFilm').classList.toggle('active', exp.categories.has('film'));
    document.getElementById('pillKitap').classList.toggle('active', exp.categories.has('kitap'));

    // 3. Sol sütundaki filtre seçeneklerini ve sayılarını güncelle
    renderFilterSidebar(searchMatched, isOnlyBooks);

    // 4. Mevcut tüm filtrelere uyan sonuçları bul ve sırala
    const finalMatches = searchMatched.filter(({ item }) => matchesExploreFilters(item, null));
    const sortedItems = sortExploreItems(finalMatches, hasSearch);

    // 5. Sonuç sayısı ve aktif filtre etiketlerini (chips) göster
    document.getElementById('resultsCountText').textContent = `${sortedItems.length} sonuç`;
    renderActiveFilterChips();

    // 6. Kartları ve Daha Fazla Göster butonunu çiz
    const grid = document.getElementById('exploreCardsGrid');
    const emptyState = document.getElementById('exploreEmptyState');
    const loadMoreWrap = document.getElementById('loadMoreWrap');
    const loadMoreBtn = document.getElementById('loadMoreBtn');

    if (sortedItems.length === 0) {
      grid.innerHTML = '';
      grid.hidden = true;
      emptyState.hidden = false;
      loadMoreWrap.hidden = true;
    } else {
      grid.hidden = false;
      emptyState.hidden = true;

      const sliceCount = Math.min(exp.visibleCount, sortedItems.length);
      const visibleItems = sortedItems.slice(0, sliceCount);
      grid.innerHTML = visibleItems.map((it) => buildCardHTML(it)).join('');

      if (sliceCount < sortedItems.length) {
        loadMoreWrap.hidden = false;
        loadMoreBtn.textContent = `Daha fazla göster (${sliceCount} / ${sortedItems.length})`;
      } else {
        loadMoreWrap.hidden = true;
      }
    }
  }

  function renderFilterSidebar(searchMatched, isOnlyBooks) {
    const exp = state.explore;

    // Tür sayıları
    const genreCounts = new Map();
    searchMatched.forEach(({ item }) => {
      if (matchesExploreFilters(item, 'genre')) {
        (item.genres || []).forEach((g) => {
          genreCounts.set(g, (genreCounts.get(g) || 0) + 1);
        });
      }
    });
    renderFilterGroupOptions(
      'filterOptionsGenre',
      state.facets.genres,
      genreCounts,
      exp.genres,
      'genre',
      (g) => g
    );

    // Çıkış/yayın yılı (On yıllar) sayıları
    const decadeCounts = new Map();
    searchMatched.forEach(({ item }) => {
      if (matchesExploreFilters(item, 'year')) {
        decadeCounts.set(item.decade, (decadeCounts.get(item.decade) || 0) + 1);
      }
    });
    renderFilterGroupOptions(
      'filterOptionsDecade',
      state.facets.decades,
      decadeCounts,
      exp.decades,
      'decade',
      (d) => `${d}'ler`
    );

    // Orijinal dil sayıları
    const langCounts = new Map();
    searchMatched.forEach(({ item }) => {
      if (matchesExploreFilters(item, 'lang')) {
        (item.lang || []).forEach((l) => {
          langCounts.set(l, (langCounts.get(l) || 0) + 1);
        });
      }
    });
    renderFilterGroupOptions(
      'filterOptionsLang',
      state.facets.langs,
      langCounts,
      exp.langs,
      'lang',
      (l) => l
    );

    // Ülke sayıları (Yalnızca Kitaplar seçiliyken görünmesin)
    const countryGroupEl = document.getElementById('filterGroupCountry');
    if (isOnlyBooks) {
      countryGroupEl.hidden = true;
    } else {
      countryGroupEl.hidden = false;
      const countryCounts = new Map();
      searchMatched.forEach(({ item }) => {
        if (matchesExploreFilters(item, 'country')) {
          (item.country || []).forEach((c) => {
            countryCounts.set(c, (countryCounts.get(c) || 0) + 1);
          });
        }
      });
      renderFilterGroupOptions(
        'filterOptionsCountry',
        state.facets.countries,
        countryCounts,
        exp.countries,
        'country',
        (c) => c
      );
    }
  }

  function renderFilterGroupOptions(containerId, allValues, countsMap, selectedSet, filterType, labelFn) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Mevcut seçime göre hiç sonuç vermeyecek seçenekler gösterilmesin;
    // ancak kullanıcının zaten seçmiş olduğu bir seçenek sıfıra düşse bile görünmeye devam etsin.
    let visibleValues = allValues.filter((val) => {
      const count = countsMap.get(val) || 0;
      return count > 0 || selectedSet.has(val);
    });

    // Tür, dil ve ülke seçenekleri en çok kayıttan en aza sıralansın; on yıllar eskiden yeniye sıralı kalsın.
    if (filterType === 'genre' || filterType === 'lang' || filterType === 'country') {
      visibleValues = visibleValues.slice().sort((a, b) => {
        const diff = (countsMap.get(b) || 0) - (countsMap.get(a) || 0);
        if (diff !== 0) return diff;
        return String(a).localeCompare(String(b), 'tr');
      });
    }

    // Türlerde ilk 12 görünsün, altında "Tümünü göster (34)" bağlantısı olsun, açılınca "Daha az göster" olsun.
    let valuesToRender = visibleValues;
    if (filterType === 'genre') {
      const toggleBtn = document.getElementById('toggleAllGenresBtn');
      const totalGenres = visibleValues.length;
      if (totalGenres > 12) {
        if (!state.explore.showAllGenres) {
          valuesToRender = visibleValues.slice(0, 12);
        }
        if (toggleBtn) {
          toggleBtn.hidden = false;
          toggleBtn.textContent = state.explore.showAllGenres
            ? 'Daha az göster'
            : `Tümünü göster (${totalGenres})`;
        }
      } else if (toggleBtn) {
        toggleBtn.hidden = true;
      }
    }

    const buttonsHtml = valuesToRender.map((val) => {
      const count = countsMap.get(val) || 0;
      const isSelected = selectedSet.has(val);
      const label = labelFn(val);
      return `
        <button type="button"
          class="filter-option-btn ${isSelected ? 'selected' : ''}"
          data-filter-type="${filterType}"
          data-filter-val="${escapeHtml(String(val))}"
          aria-pressed="${isSelected ? 'true' : 'false'}">
          <span>${escapeHtml(label)}</span>
          <span class="filter-opt-count">${count}</span>
        </button>
      `;
    });

    container.innerHTML = buttonsHtml.join('');
  }

  function renderActiveFilterChips() {
    const exp = state.explore;
    const chips = [];

    exp.genres.forEach((g) => {
      chips.push({ type: 'genre', val: g, label: g });
    });

    exp.decades.forEach((d) => {
      chips.push({ type: 'decade', val: String(d), label: `${d}'ler` });
    });

    if (exp.yearMin !== null || exp.yearMax !== null) {
      const minStr = exp.yearMin !== null ? exp.yearMin : '';
      const maxStr = exp.yearMax !== null ? exp.yearMax : '';
      chips.push({ type: 'yearRange', val: 'range', label: `Yıl: ${minStr}–${maxStr}` });
    }

    exp.langs.forEach((l) => {
      chips.push({ type: 'lang', val: l, label: l });
    });

    exp.countries.forEach((c) => {
      chips.push({ type: 'country', val: c, label: c });
    });

    exp.tags.forEach((t) => {
      chips.push({ type: 'tag', val: t, label: t });
    });

    if (exp.collection) {
      const colDef = COLLECTIONS_BY_ID.get(exp.collection);
      if (colDef) {
        chips.push({ type: 'collection', val: colDef.id, label: colDef.title });
      }
    }

    const listEl = document.getElementById('activeFiltersList');
    const mobileBadge = document.getElementById('mobileFilterCountBadge');

    if (mobileBadge) {
      mobileBadge.textContent = String(chips.length);
      mobileBadge.hidden = chips.length === 0;
    }

    if (!listEl) return;

    if (chips.length === 0) {
      listEl.innerHTML = '';
      return;
    }

    let html = chips
      .map(
        (ch) => `
        <button type="button" class="active-filter-chip" data-chip-type="${ch.type}" data-chip-val="${escapeHtml(ch.val)}" aria-label="${escapeHtml(ch.label)} filtresini kaldır">
          <span>${escapeHtml(ch.label)}</span>
          <span class="chip-remove" aria-hidden="true">✕</span>
        </button>
      `
      )
      .join('');

    if (chips.length > 1) {
      html += `<button type="button" class="clear-all-filters-btn" id="clearAllFiltersInlineBtn">Tümünü temizle</button>`;
    }

    listEl.innerHTML = html;
  }

  /* ==========================================================================
     10. KART OLUŞTURMA (Keşfet, Favoriler ve Kaydedilenler Ortak)
     ========================================================================== */
  function buildCardHTML(item) {
    const catMeta = CATEGORY_META[item.category];
    const saved = isItemSaved(item.id);
    const liked = isItemLiked(item.id);

    const favAria = liked
      ? `${item.title} kaydını favorilerden çıkar`
      : `${item.title} kaydını beğen`;

    const saveAria = saved
      ? `${item.title} kaydını kaydedilenlerden çıkar`
      : `${item.title} kaydını kaydet`;

    return `
      <article class="item-card" data-item-id="${escapeHtml(item.id)}" tabindex="0" role="button" aria-label="${escapeHtml(item.title)} (${escapeHtml(catMeta.label)})">
        <div class="card-cover-wrap">
          <button type="button"
            class="card-fav-btn ${liked ? 'liked' : ''}"
            data-fav-id="${escapeHtml(item.id)}"
            aria-pressed="${liked ? 'true' : 'false'}"
            aria-label="${escapeHtml(favAria)}">
            ${getHeartSvg(liked)}
          </button>
          <button type="button"
            class="card-save-btn ${saved ? 'saved' : ''}"
            data-save-id="${escapeHtml(item.id)}"
            aria-pressed="${saved ? 'true' : 'false'}"
            aria-label="${escapeHtml(saveAria)}">
            ${getBookmarkSvg(saved)}
          </button>
          ${buildCoverHTML(item, false)}
        </div>
      </article>
    `;
  }

  /* ==========================================================================
     11. KAYDEDİLENLER EKRANI RENDER İŞLEMLERİ
     ========================================================================== */
  function renderSavedView() {
    const savedItems = state.savedIds
      .map((id) => state.byId.get(id))
      .filter(Boolean);

    const clearBtn = document.getElementById('clearSavedBtn');
    const emptyState = document.getElementById('savedEmptyState');
    const groupsContainer = document.getElementById('savedGroupsContainer');

    if (savedItems.length === 0) {
      resetClearSavedConfirmation();
      clearBtn.hidden = true;
      emptyState.hidden = false;
      groupsContainer.hidden = true;
      return;
    }

    clearBtn.hidden = false;
    emptyState.hidden = true;
    groupsContainer.hidden = false;

    const groups = {
      dizi: savedItems.filter((it) => it.category === 'dizi'),
      film: savedItems.filter((it) => it.category === 'film'),
      kitap: savedItems.filter((it) => it.category === 'kitap')
    };

    renderSavedGroup('Dizi', groups.dizi);
    renderSavedGroup('Film', groups.film);
    renderSavedGroup('Kitap', groups.kitap);
  }

  function renderSavedGroup(capKey, items) {
    const groupEl = document.getElementById(`savedGroup${capKey}`);
    const countEl = document.getElementById(`savedCount${capKey}`);
    const gridEl = document.getElementById(`savedGrid${capKey}`);

    if (!groupEl || !countEl || !gridEl) return;

    if (items.length === 0) {
      groupEl.hidden = true;
      gridEl.innerHTML = '';
    } else {
      groupEl.hidden = false;
      countEl.textContent = String(items.length);
      gridEl.innerHTML = items.map((it) => buildCardHTML(it)).join('');
    }
  }

  function handleClearSavedClick() {
    const clearBtn = document.getElementById('clearSavedBtn');
    if (!clearBtn) return;

    if (!state.clearConfirming) {
      state.clearConfirming = true;
      clearBtn.classList.add('confirming');
      clearBtn.textContent = 'Emin misin? Temizle';
      if (state.clearConfirmTimer) clearTimeout(state.clearConfirmTimer);
      state.clearConfirmTimer = setTimeout(() => {
        resetClearSavedConfirmation();
      }, 3500);
    } else {
      resetClearSavedConfirmation();
      state.savedIds = [];
      persistSavedItems();
      renderSavedView();
      if (state.baseView === 'kesfet') {
        renderExploreView();
      }
    }
  }

  function resetClearSavedConfirmation() {
    state.clearConfirming = false;
    if (state.clearConfirmTimer) {
      clearTimeout(state.clearConfirmTimer);
      state.clearConfirmTimer = null;
    }
    const clearBtn = document.getElementById('clearSavedBtn');
    if (clearBtn) {
      clearBtn.classList.remove('confirming');
      clearBtn.textContent = 'Kaydedilenleri temizle';
    }
  }

  /* ==========================================================================
     11B. FAVORİLER EKRANI RENDER İŞLEMLERİ
     ========================================================================== */
  function renderFavoritesView() {
    const favItems = state.favIds
      .map((id) => state.byId.get(id))
      .filter(Boolean);

    const clearBtn = document.getElementById('clearFavBtn');
    const emptyState = document.getElementById('favEmptyState');
    const groupsContainer = document.getElementById('favGroupsContainer');

    if (favItems.length === 0) {
      resetClearFavConfirmation();
      clearBtn.hidden = true;
      emptyState.hidden = false;
      groupsContainer.hidden = true;
      return;
    }

    clearBtn.hidden = false;
    emptyState.hidden = true;
    groupsContainer.hidden = false;

    const groups = {
      dizi: favItems.filter((it) => it.category === 'dizi'),
      film: favItems.filter((it) => it.category === 'film'),
      kitap: favItems.filter((it) => it.category === 'kitap')
    };

    renderFavGroup('Dizi', groups.dizi);
    renderFavGroup('Film', groups.film);
    renderFavGroup('Kitap', groups.kitap);
  }

  function renderFavGroup(capKey, items) {
    const groupEl = document.getElementById(`favGroup${capKey}`);
    const countEl = document.getElementById(`favCount${capKey}`);
    const gridEl = document.getElementById(`favGrid${capKey}`);

    if (!groupEl || !countEl || !gridEl) return;

    if (items.length === 0) {
      groupEl.hidden = true;
      gridEl.innerHTML = '';
    } else {
      groupEl.hidden = false;
      countEl.textContent = String(items.length);
      gridEl.innerHTML = items.map((it) => buildCardHTML(it)).join('');
    }
  }

  function handleClearFavClick() {
    const clearBtn = document.getElementById('clearFavBtn');
    if (!clearBtn) return;

    if (!state.clearFavConfirming) {
      state.clearFavConfirming = true;
      clearBtn.classList.add('confirming');
      clearBtn.textContent = 'Emin misin? Temizle';
      if (state.clearFavConfirmTimer) clearTimeout(state.clearFavConfirmTimer);
      state.clearFavConfirmTimer = setTimeout(() => {
        resetClearFavConfirmation();
      }, 3500);
    } else {
      resetClearFavConfirmation();
      state.favIds = [];
      persistFavItems();
      renderFavoritesView();
      if (state.baseView === 'kesfet') {
        renderExploreView();
      } else if (state.baseView === 'kaydedilenler') {
        renderSavedView();
      }
    }
  }

  function resetClearFavConfirmation() {
    state.clearFavConfirming = false;
    if (state.clearFavConfirmTimer) {
      clearTimeout(state.clearFavConfirmTimer);
      state.clearFavConfirmTimer = null;
    }
    const clearBtn = document.getElementById('clearFavBtn');
    if (clearBtn) {
      clearBtn.classList.remove('confirming');
      clearBtn.textContent = 'Favorileri temizle';
    }
  }

  /* ==========================================================================
     12. AYRINTI PENCERESİ (MODAL) RENDER İŞLEMLERİ
     ========================================================================== */
  function renderDetailModal(item, restoreScrollTop = 0) {
    const backdrop = document.getElementById('detailModalBackdrop');
    const scrollBox = document.getElementById('detailModalScroll');
    const contentEl = document.getElementById('detailContent');
    if (!backdrop || !contentEl) return;

    const catMeta = CATEGORY_META[item.category];
    const saved = isItemSaved(item.id);
    const liked = isItemLiked(item.id);
    const actionRoutePrefix = item.category === 'kitap' ? 'oku' : 'izle';

    // Üstteki yan yana üç bilgi:
    // Dizi: Sezon, Bölüm, Yayın (yıl aralığı)
    // Film: Süre, Yıl, Ülke
    // Kitap: Sayfa, İlk yayın, Dil
    let quickStatsHtml = '';
    if (item.category === 'dizi') {
      quickStatsHtml = `
        <div class="quick-stat-item">
          <span class="quick-stat-label">Sezon</span>
          <span class="quick-stat-value">${item.seasons} sezon</span>
        </div>
        <div class="quick-stat-item">
          <span class="quick-stat-label">Bölüm</span>
          <span class="quick-stat-value">${item.episodes} bölüm</span>
        </div>
        <div class="quick-stat-item">
          <span class="quick-stat-label">Yayın</span>
          <span class="quick-stat-value">${escapeHtml(formatDiziYear(item))}</span>
        </div>
      `;
    } else if (item.category === 'film') {
      quickStatsHtml = `
        <div class="quick-stat-item">
          <span class="quick-stat-label">Süre</span>
          <span class="quick-stat-value">${escapeHtml(formatRuntimeShort(item.runtime))}</span>
        </div>
        <div class="quick-stat-item">
          <span class="quick-stat-label">Yıl</span>
          <span class="quick-stat-value">${item.year}</span>
        </div>
        <div class="quick-stat-item">
          <span class="quick-stat-label">Ülke</span>
          <span class="quick-stat-value">${escapeHtml((item.country || []).join(', '))}</span>
        </div>
      `;
    } else {
      quickStatsHtml = `
        <div class="quick-stat-item">
          <span class="quick-stat-label">Sayfa</span>
          <span class="quick-stat-value">${item.pages} sayfa</span>
        </div>
        <div class="quick-stat-item">
          <span class="quick-stat-label">İlk yayın</span>
          <span class="quick-stat-value">${item.year}</span>
        </div>
        <div class="quick-stat-item">
          <span class="quick-stat-label">Dil</span>
          <span class="quick-stat-value">${escapeHtml((item.lang || []).join(', '))}</span>
        </div>
      `;
    }

    // Tıklanabilir filtre bağlantıları (tür, ülke, orijinal dil)
    const genreLinks = (item.genres || [])
      .map(
        (g) =>
          `<button type="button" class="credit-filter-link" data-credit-filter="genre" data-credit-val="${escapeHtml(g)}" data-credit-cat="${item.category}">${escapeHtml(g)}</button>`
      )
      .join('');

    const countryLinks = (item.country || [])
      .map(
        (c) =>
          `<button type="button" class="credit-filter-link" data-credit-filter="country" data-credit-val="${escapeHtml(c)}" data-credit-cat="${item.category}">${escapeHtml(c)}</button>`
      )
      .join('');

    const langLinks = (item.lang || [])
      .map(
        (l) =>
          `<button type="button" class="credit-filter-link" data-credit-filter="lang" data-credit-val="${escapeHtml(l)}" data-credit-cat="${item.category}">${escapeHtml(l)}</button>`
      )
      .join('');

    // Künye satırları (Brief'teki sırayla)
    let creditsRowsHtml = '';
    if (item.category === 'dizi') {
      // Dizi için sırasıyla: yayın yılları, durum, sezon sayısı, toplam bölüm, yönetmen, oyuncular, yapım, tür, ülke, orijinal dil
      creditsRowsHtml = `
        ${buildCreditRow('Yayın yılları', escapeHtml(formatDiziYear(item)))}
        ${buildCreditRow('Durum', escapeHtml(item.status))}
        ${buildCreditRow('Sezon sayısı', `${item.seasons}`)}
        ${buildCreditRow('Toplam bölüm', `${item.episodes}`)}
        ${buildCreditRow('Yönetmen', escapeHtml((item.directors || []).join(', ')))}
        ${buildCreditRow('Oyuncular', escapeHtml((item.cast || []).join(', ')))}
        ${buildCreditRow('Yapım', escapeHtml(item.prod))}
        ${buildCreditRow('Tür', genreLinks)}
        ${buildCreditRow('Ülke', countryLinks)}
        ${buildCreditRow('Orijinal dil', langLinks)}
      `;
    } else if (item.category === 'film') {
      // Film için sırasıyla: yıl, süre, yönetmen, oyuncular, tür, seri (varsa), ülke, orijinal dil
      creditsRowsHtml = `
        ${buildCreditRow('Yıl', `${item.year}`)}
        ${buildCreditRow('Süre', escapeHtml(formatRuntimeFull(item.runtime)))}
        ${buildCreditRow('Yönetmen', escapeHtml((item.directors || []).join(', ')))}
        ${buildCreditRow('Oyuncular', escapeHtml((item.cast || []).join(', ')))}
        ${buildCreditRow('Tür', genreLinks)}
        ${item.series ? buildCreditRow('Seri', escapeHtml(formatSeriesFull(item))) : ''}
        ${buildCreditRow('Ülke', countryLinks)}
        ${buildCreditRow('Orijinal dil', langLinks)}
      `;
    } else {
      // Kitap için sırasıyla: ilk yayın yılı, yazar, çevirmen, sayfa sayısı, yayınevi, tür, seri (varsa), orijinal dil
      creditsRowsHtml = `
        ${buildCreditRow('İlk yayın yılı', `${item.year}`)}
        ${buildCreditRow('Yazar', escapeHtml((item.authors || []).join(', ')))}
        ${buildCreditRow('Çevirmen', escapeHtml(formatTranslators(item)))}
        ${buildCreditRow('Sayfa sayısı', `${item.pages}`)}
        ${buildCreditRow('Yayınevi', escapeHtml(item.publisher))}
        ${buildCreditRow('Tür', genreLinks)}
        ${item.series ? buildCreditRow('Seri', escapeHtml(formatSeriesFull(item))) : ''}
        ${buildCreditRow('Orijinal dil', langLinks)}
      `;
    }

    // Künyenin altında konu etiketleri (varsa)
    const tagsSectionHtml =
      Array.isArray(item.tags) && item.tags.length > 0
        ? `
          <div class="detail-tags-section" aria-label="Konu etiketleri">
            ${item.tags
              .map(
                (t) =>
                  `<button type="button" class="detail-tag-btn" data-tag-filter="${escapeHtml(t)}">${escapeHtml(t)}</button>`
              )
              .join('')}
          </div>
        `
        : '';

    // Serinin diğer parçaları (varsa)
    let seriesSiblingsHtml = '';
    if (item.series) {
      const siblings = state.lists[item.category]
        .filter((other) => other.series && other.series.name === item.series.name && other.id !== item.id)
        .sort((a, b) => a.series.no - b.series.no);

      if (siblings.length > 0) {
        const headingText = item.category === 'film' ? 'Serinin diğer filmleri' : 'Serinin diğer kitapları';
        const partNoun = item.category === 'film' ? 'film' : 'kitap';
        seriesSiblingsHtml = `
          <div class="detail-series-section">
            <h3 class="detail-series-heading">${headingText}</h3>
            <div class="detail-series-list">
              ${siblings
                .map(
                  (sib) => `
                  <button type="button" class="series-sibling-card" data-sibling-id="${escapeHtml(sib.id)}">
                    <div class="series-sibling-cover">${buildCoverHTML(sib, false)}</div>
                    <span class="series-sibling-part">${sib.series.no}/${sib.series.total}. ${partNoun}</span>
                    <span class="series-sibling-title">${escapeHtml(sib.title)}</span>
                  </button>
                `
                )
                .join('')}
            </div>
          </div>
        `;
      }
    }

    contentEl.innerHTML = `
      <div class="detail-left-col">
        <div class="detail-cover-box">
          ${buildCoverHTML(item, false)}
        </div>
        <div class="detail-actions-stack">
          <button type="button"
            class="btn detail-action-btn btn-cat-${item.category}"
            id="detailPrimaryActionBtn"
            data-action-route="#/${actionRoutePrefix}/${escapeHtml(item.id)}">
            ${escapeHtml(catMeta.actionLabel)}
          </button>
          <button type="button"
            class="btn btn-outline detail-action-btn detail-fav-btn ${liked ? 'liked' : ''}"
            id="detailFavBtn"
            data-fav-id="${escapeHtml(item.id)}"
            aria-pressed="${liked ? 'true' : 'false'}">
            ${getHeartSvg(liked)}
            <span>${liked ? 'Beğendin' : 'Beğen'}</span>
          </button>
          <button type="button"
            class="btn btn-outline detail-action-btn detail-save-btn ${saved ? 'saved' : ''}"
            id="detailSaveBtn"
            data-save-id="${escapeHtml(item.id)}"
            aria-pressed="${saved ? 'true' : 'false'}">
            ${getBookmarkSvg(saved)}
            <span>${saved ? 'Kaydedildi' : 'Kaydet'}</span>
          </button>
        </div>
      </div>

      <div class="detail-right-col">
        <div class="detail-cat-header detail-cat-${item.category}">
          ${getCategoryIconSvg(item.category)}
          <span>${escapeHtml(catMeta.label)}</span>
        </div>

        <h2 class="detail-title" id="detailTitle">${escapeHtml(item.title)}</h2>

        <div class="detail-QuickStats">
          ${quickStatsHtml}
        </div>

        <p class="detail-plot">${escapeHtml(item.plot)}</p>

        <div class="detail-credits">
          ${creditsRowsHtml}
        </div>

        ${tagsSectionHtml}

        ${seriesSiblingsHtml}
      </div>
    `;

    backdrop.hidden = false;
    document.body.classList.add('modal-open');

    if (scrollBox) {
      scrollBox.scrollTop = restoreScrollTop;
    }
  }

  function buildCreditRow(label, valueHtml) {
    return `
      <div class="credit-row">
        <span class="credit-label">${escapeHtml(label)}</span>
        <div class="credit-value">${valueHtml}</div>
      </div>
    `;
  }

  function hideDetailModal() {
    const backdrop = document.getElementById('detailModalBackdrop');
    if (backdrop) backdrop.hidden = true;
    document.body.classList.remove('modal-open');
    state.activeModalId = null;
  }

  /* ==========================================================================
     13. İZLE VE OKU EKRANLARI (Dizi, Film, Kitap)
     ========================================================================== */
  function clearPlayerTimer() {
    if (state.player.timerId) {
      clearTimeout(state.player.timerId);
      state.player.timerId = null;
    }
  }

  function openPlayerOverlay(item) {
    clearPlayerTimer();
    const overlay = document.getElementById('playerOverlay');
    const bodyScroll = document.getElementById('playerBodyScroll');
    if (!overlay) return;

    const isSameSeries = state.player.itemId === item.id && item.category === 'dizi';
    state.player.itemId = item.id;
    if (!isSameSeries) {
      state.player.season = 1;
      state.player.episode = 1;
      state.player.selectedSeasonTab = 1;
    }

    if (item.category === 'kitap') {
      // Kitap tıklamaya gerek kalmadan kendiliğinden yüklenmeye başlasın
      state.player.status = 'loading';
      renderPlayerOverlayContent(item);
      startPlayerLoadingCycle(item);
    } else {
      state.player.status = 'idle';
      renderPlayerOverlayContent(item);
    }

    overlay.hidden = false;
    document.body.classList.add('player-open');
    if (bodyScroll) bodyScroll.scrollTop = 0;
  }

  function hidePlayerOverlay() {
    clearPlayerTimer();
    const overlay = document.getElementById('playerOverlay');
    if (overlay) overlay.hidden = true;
    const topbarActions = document.getElementById('playerTopbarActions');
    if (topbarActions) topbarActions.hidden = true;
    const ebookBottomBar = document.getElementById('ebookBottomBar');
    if (ebookBottomBar) ebookBottomBar.hidden = true;
    document.body.classList.remove('player-open');
    state.activePlayerId = null;
  }

  function startPlayerLoadingCycle(item) {
    clearPlayerTimer();
    state.player.status = 'loading';
    updatePlayerStageStatus(item);

    state.player.timerId = setTimeout(() => {
      state.player.timerId = null;
      state.player.status = 'error';
      updatePlayerStageStatus(item);
    }, 2000);
  }

  function renderPlayerOverlayContent(item) {
    const headerInfo = document.getElementById('playerHeaderInfo');
    const playerBody = document.getElementById('playerBody');
    const topbarActions = document.getElementById('playerTopbarActions');
    const ebookBottomBar = document.getElementById('ebookBottomBar');
    const ebookProgressLabel = document.getElementById('ebookProgressLabel');
    if (!headerInfo || !playerBody) return;

    const isBook = item.category === 'kitap';
    if (topbarActions) topbarActions.hidden = !isBook;
    if (ebookBottomBar) ebookBottomBar.hidden = !isBook;
    if (isBook && ebookProgressLabel) {
      ebookProgressLabel.textContent = `0 / ${item.pages} sayfa`;
    }

    if (item.category === 'dizi') {
      headerInfo.innerHTML = `
        <span class="player-header-sub" id="playerHeaderSub">${state.player.season}. Sezon · ${state.player.episode}. Bölüm</span>
        <h1 class="player-header-title">${escapeHtml(item.title)}</h1>
      `;

      const seasonCounts = getSeasonEpisodeCounts(item.seasons, item.episodes);
      const currentSeasonCount = seasonCounts[state.player.selectedSeasonTab - 1] || 1;
      const isFirstOverall = state.player.season === 1 && state.player.episode === 1;
      const isLastOverall =
        state.player.season === seasonCounts.length &&
        state.player.episode === seasonCounts[seasonCounts.length - 1];

      const seasonTabsHtml = seasonCounts
        .map(
          (_, idx) => `
          <button type="button"
            class="season-tab-btn ${state.player.selectedSeasonTab === idx + 1 ? 'active' : ''}"
            data-season-tab="${idx + 1}">
            ${idx + 1}. Sezon
          </button>
        `
        )
        .join('');

      const episodesHtml = [];
      for (let ep = 1; ep <= currentSeasonCount; ep++) {
        const isCurrent =
          state.player.selectedSeasonTab === state.player.season &&
          ep === state.player.episode;
        episodesHtml.push(`
          <button type="button"
            class="episode-row-btn ${isCurrent ? 'active' : ''}"
            data-ep-season="${state.player.selectedSeasonTab}"
            data-ep-num="${ep}">
            <span>${ep}. Bölüm</span>
            <span class="episode-play-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <polygon points="6 4 20 12 6 20 6 4"></polygon>
              </svg>
            </span>
          </button>
        `);
      }

      playerBody.innerHTML = `
        <div class="series-player-layout">
          <div class="series-left-col">
            <div class="video-stage">
              <div class="video-stage-center" id="playerStageCenter">
                ${buildVideoStageCenterHTML(item)}
              </div>
            </div>

            <div class="series-under-stage">
              <div class="series-ep-info">
                <span class="series-ep-number" id="seriesUnderEpNum">${state.player.episode}. Bölüm</span>
                <span class="series-season-number" id="seriesUnderSeasonNum">${state.player.season}. Sezon</span>
              </div>
              <div class="series-nav-btns">
                <button type="button" class="btn btn-outline" id="prevEpisodeBtn" ${isFirstOverall ? 'disabled' : ''}>Önceki bölüm</button>
                <button type="button" class="btn btn-outline" id="nextEpisodeBtn" ${isLastOverall ? 'disabled' : ''}>Sonraki bölüm</button>
              </div>
            </div>
          </div>

          <aside class="episodes-panel" aria-label="Bölümler">
            <div class="episodes-panel-header">
              <h2 class="episodes-panel-title">Bölümler</h2>
              <span class="episodes-panel-totals">${item.seasons} sezon · ${item.episodes} bölüm</span>
            </div>
            <div class="season-tabs" id="seasonTabsContainer">
              ${seasonTabsHtml}
            </div>
            <div class="season-episodes-list" id="seasonEpisodesList">
              ${episodesHtml.join('')}
            </div>
          </aside>
        </div>
      `;
    } else if (item.category === 'film') {
      headerInfo.innerHTML = `
        <span class="player-header-sub">Film</span>
        <h1 class="player-header-title">${escapeHtml(item.title)}</h1>
      `;

      playerBody.innerHTML = `
        <div class="movie-player-layout">
          <div class="video-stage">
            <div class="video-stage-center" id="playerStageCenter">
              ${buildVideoStageCenterHTML(item)}
            </div>
          </div>

          <div class="movie-under-stage">
            <div class="movie-meta-line">
              <span>${item.year}</span>
              <span aria-hidden="true">·</span>
              <span>${escapeHtml(formatRuntimeShort(item.runtime))}</span>
              <span aria-hidden="true">·</span>
              <span>${escapeHtml((item.genres || []).join(', '))}</span>
            </div>
            <p class="movie-plot-text">${escapeHtml(item.plot)}</p>
          </div>
        </div>
      `;
    } else {
      // Kitap okuyucusu
      headerInfo.innerHTML = `
        <h1 class="player-header-title">${escapeHtml(item.title)}</h1>
        <span class="player-header-sub book-author-sub">${escapeHtml((item.authors || []).join(', '))}</span>
      `;

      playerBody.innerHTML = `
        <div class="book-reader-layout">
          <div class="ebook-page-sheet">
            <div class="ebook-cover-holder">
              ${buildCoverHTML(item, false)}
            </div>
            <div class="ebook-status-area" id="playerStageCenter">
              ${buildBookStageCenterHTML()}
            </div>
          </div>
        </div>
      `;
    }
  }

  function getErrorAlertIconSvg() {
    return `
      <div class="player-error-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
    `;
  }

  function getRetryButtonHTML() {
    return `
      <button type="button" class="retry-btn" id="stageRetryBtn">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="23 4 23 10 17 10"></polyline>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
        </svg>
        <span>Tekrar dene</span>
      </button>
    `;
  }

  function buildVideoStageCenterHTML(item) {
    if (state.player.status === 'idle') {
      const btnClass = item.category === 'film' ? 'big-play-btn film-play' : 'big-play-btn';
      return `
        <button type="button" class="${btnClass}" id="stagePlayTriggerBtn" aria-label="Oynat">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <polygon points="6 4 20 12 6 20 6 4"></polygon>
          </svg>
        </button>
      `;
    }

    if (state.player.status === 'loading') {
      return `
        <div class="loading-spinner" aria-hidden="true"></div>
        <span class="loading-label">Yükleniyor</span>
      `;
    }

    const descText =
      item.category === 'dizi'
        ? 'Bu dizi kurgusaldır, gerçekte bir görüntüsü yoktur.'
        : 'Bu film kurgusaldır, gerçekte bir görüntüsü yoktur.';

    return `
      <div class="player-error-box">
        ${getErrorAlertIconSvg()}
        <h2 class="player-error-title">Oynatılamıyor</h2>
        <p class="player-error-desc">${descText}</p>
        ${getRetryButtonHTML()}
      </div>
    `;
  }

  function buildBookStageCenterHTML() {
    if (state.player.status === 'loading') {
      return `
        <div class="ebook-spinner" aria-hidden="true"></div>
        <span class="ebook-status-title">Yükleniyor</span>
      `;
    }

    return `
      ${getErrorAlertIconSvg()}
      <h2 class="ebook-status-title">Kitap yüklenemedi</h2>
      <p class="ebook-status-desc">Bu kitap kurgusaldır, gerçekte bir metni yoktur.</p>
      ${getRetryButtonHTML()}
    `;
  }

  function updatePlayerStageStatus(item) {
    const centerEl = document.getElementById('playerStageCenter');
    if (!centerEl) return;
    if (item.category === 'kitap') {
      centerEl.innerHTML = buildBookStageCenterHTML();
    } else {
      centerEl.innerHTML = buildVideoStageCenterHTML(item);
    }
  }

  /**
   * Dizi oynatıcısında bölümden bölüme geçiş.
   * Geri tuşunun sırasına eklenmez (history yığınına yeni kayıt atılmaz).
   */
  function selectSeriesEpisode(item, seasonNum, episodeNum) {
    clearPlayerTimer();
    state.player.season = seasonNum;
    state.player.episode = episodeNum;
    state.player.selectedSeasonTab = seasonNum;
    state.player.status = 'idle';
    renderPlayerOverlayContent(item);
  }

  function stepSeriesEpisode(item, delta) {
    const counts = getSeasonEpisodeCounts(item.seasons, item.episodes);
    let s = state.player.season;
    let e = state.player.episode + delta;

    if (delta > 0) {
      if (e > counts[s - 1]) {
        if (s < counts.length) {
          s++;
          e = 1;
        } else {
          return;
        }
      }
    } else if (delta < 0) {
      if (e < 1) {
        if (s > 1) {
          s--;
          e = counts[s - 1];
        } else {
          return;
        }
      }
    }

    selectSeriesEpisode(item, s, e);
  }

  /* ==========================================================================
     14. GEZİNME VE HASH ROUTER YÖNETİMİ
     ========================================================================== */
  function updateDocumentTitle() {
    const activeId = state.activePlayerId || state.activeModalId;
    if (activeId && state.byId.has(activeId)) {
      const item = state.byId.get(activeId);
      document.title = `${item.title} — Üç Nokta`;
    } else {
      document.title = 'Üç Nokta';
    }
  }

  function updateActiveNavHighlight() {
    const view = state.baseView;
    document.getElementById('navExploreDesktop')?.classList.toggle('active', view === 'kesfet');
    document.getElementById('navFavDesktop')?.classList.toggle('active', view === 'favoriler');
    document.getElementById('navSavedDesktop')?.classList.toggle('active', view === 'kaydedilenler');

    document.getElementById('navHomeMobile')?.classList.toggle('active', view === 'anasayfa');
    document.getElementById('navExploreMobile')?.classList.toggle('active', view === 'kesfet');
    document.getElementById('navFavMobile')?.classList.toggle('active', view === 'favoriler');
    document.getElementById('navSavedMobile')?.classList.toggle('active', view === 'kaydedilenler');
  }

  function showBaseView(viewName, preserveScroll = false) {
    const prevView = state.baseView;
    state.baseView = viewName;

    document.getElementById('viewHome').hidden = viewName !== 'anasayfa';
    document.getElementById('viewExplore').hidden = viewName !== 'kesfet';
    document.getElementById('viewFavorites').hidden = viewName !== 'favoriler';
    document.getElementById('viewSaved').hidden = viewName !== 'kaydedilenler';

    updateActiveNavHighlight();

    if (viewName === 'kesfet') {
      renderExploreView();
    } else if (viewName === 'favoriler') {
      renderFavoritesView();
    } else if (viewName === 'kaydedilenler') {
      renderSavedView();
    }

    if (!preserveScroll && prevView !== viewName) {
      window.scrollTo(0, 0);
    }
  }

  function getBaseHashForCurrentView() {
    if (state.baseView === 'kesfet') return '#/kesfet';
    if (state.baseView === 'favoriler') return '#/favoriler';
    if (state.baseView === 'kaydedilenler') return '#/kaydedilenler';
    return '#/';
  }

  /**
   * URL hash değiştiğinde ekranları senkronize eder.
   */
  function handleRouteChange() {
    const rawHash = window.location.hash || '#/';
    const cleanHash = rawHash.startsWith('#') ? rawHash.slice(1) : rawHash;
    const parts = cleanHash.split('/').filter(Boolean);

    // 1. Oynatıcı / Okuyucu rotası: #/izle/<id> veya #/oku/<id>
    if ((parts[0] === 'izle' || parts[0] === 'oku') && parts[1]) {
      const id = decodeURIComponent(parts[1]);
      const item = state.byId.get(id);
      if (item) {
        // Arka planda ayrıntı penceresinin kaydırma yerini koru
        const modalScroll = document.getElementById('detailModalScroll');
        if (state.activeModalId === id && modalScroll) {
          state.detailScrollTop = modalScroll.scrollTop;
        }
        if (!state.activeModalId) {
          state.activeModalId = id;
          renderDetailModal(item, state.detailScrollTop);
        }
        state.activePlayerId = id;
        openPlayerOverlay(item);
        updateDocumentTitle();
        return;
      }
    }

    // Oynatıcı açıkken başka bir rotaya geçildiyse oynatıcıyı kapat
    const wasPlayerOpen = Boolean(state.activePlayerId);
    if (wasPlayerOpen) {
      hidePlayerOverlay();
    }

    // 2. Ayrıntı penceresi rotası: #/kayit/<id>
    if (parts[0] === 'kayit' && parts[1]) {
      const id = decodeURIComponent(parts[1]);
      const item = state.byId.get(id);
      if (item) {
        // Ayrıntı penceresi hangi sayfanın üstünde açıldıysa o sayfa arkada görünür kalsın
        showBaseView(state.baseView, true);
        const scrollToRestore = wasPlayerOpen ? state.detailScrollTop : 0;
        if (!wasPlayerOpen) {
          state.detailScrollTop = 0;
        }
        state.activeModalId = id;
        renderDetailModal(item, scrollToRestore);
        updateDocumentTitle();
        return;
      }
    }

    // Ayrıntı penceresi açıkken ana sayfalardan birine dönüldüyse pencereyi kapat
    const wasModalOpen = Boolean(state.activeModalId);
    if (wasModalOpen) {
      hideDetailModal();
    }
    state.modalHistoryDepth = 0;

    // 3. Temel sayfalar: #/kesfet, #/favoriler, #/kaydedilenler, #/
    if (parts[0] === 'kesfet') {
      showBaseView('kesfet', true);
    } else if (parts[0] === 'favoriler') {
      showBaseView('favoriler', true);
    } else if (parts[0] === 'kaydedilenler') {
      showBaseView('kaydedilenler', true);
    } else {
      showBaseView('anasayfa', true);
    }

    if (wasModalOpen) {
      window.scrollTo(0, state.savedBaseScrollY);
    }

    updateDocumentTitle();
  }

  /**
   * Bir kaydın ayrıntı penceresini açar.
   */
  function navigateToDetail(id) {
    if (!state.activeModalId) {
      state.savedBaseScrollY = window.scrollY;
      state.modalHistoryDepth = 1;
    } else {
      state.modalHistoryDepth += 1;
    }
    state.detailScrollTop = 0;
    window.location.hash = `#/kayit/${encodeURIComponent(id)}`;
  }

  /**
   * Ayrıntı penceresini kapatıp altındaki sayfaya döner.
   */
  function closeDetailModalAndReturn() {
    if (!state.activeModalId) return;
    if (state.modalHistoryDepth > 0) {
      const steps = state.modalHistoryDepth;
      state.modalHistoryDepth = 0;
      window.history.go(-steps);
    } else {
      window.location.hash = getBaseHashForCurrentView();
    }
  }

  /**
   * Oynatıcıdan veya okuyucudan ayrıntı penceresine geri döner.
   */
  function closePlayerAndReturnToDetail() {
    if (!state.activePlayerId) return;
    const itemId = state.activePlayerId;
    if (state.openedPlayerFromHistory) {
      state.openedPlayerFromHistory = false;
      window.history.back();
    } else {
      window.location.hash = `#/kayit/${encodeURIComponent(itemId)}`;
    }
  }

  /**
   * Menüdeki Keşfet butonuna basılınca Keşfet her zaman sıfırdan açılır (aramasız, filtresiz).
   */
  function openExploreFresh() {
    closeMobileFilterDrawer();
    if (state.activePlayerId) hidePlayerOverlay();
    if (state.activeModalId) hideDetailModal();
    resetExploreState();
    if (window.location.hash === '#/kesfet') {
      showBaseView('kesfet', false);
      updateDocumentTitle();
    } else {
      window.location.hash = '#/kesfet';
      window.scrollTo(0, 0);
    }
  }

  /* ==========================================================================
     15. MOBİL FİLTRE PANELİ (ÇEKMECE) YÖNETİMİ
     ========================================================================== */
  function openMobileFilterDrawer() {
    const sidebar = document.getElementById('exploreSidebar');
    const backdrop = document.getElementById('filterBackdrop');
    if (sidebar) sidebar.classList.add('open');
    if (backdrop) backdrop.hidden = false;
    document.body.classList.add('filter-drawer-open');
  }

  function closeMobileFilterDrawer() {
    const sidebar = document.getElementById('exploreSidebar');
    const backdrop = document.getElementById('filterBackdrop');
    if (sidebar) sidebar.classList.remove('open');
    if (backdrop) backdrop.hidden = true;
    document.body.classList.remove('filter-drawer-open');
  }

  /* ==========================================================================
     16. OLAY DİNLEYİCİLERİ (EVENT LISTENERS)
     ========================================================================== */
  function bindEvents() {
    // Tema değiştirme
    document.getElementById('themeToggleBtn')?.addEventListener('click', toggleTheme);

    // Üst çubuk ve mobil alt çubuk gezinme butonları
    document.getElementById('navExploreDesktop')?.addEventListener('click', openExploreFresh);
    document.getElementById('navExploreMobile')?.addEventListener('click', openExploreFresh);

    document.getElementById('navFavDesktop')?.addEventListener('click', () => {
      window.location.hash = '#/favoriler';
      window.scrollTo(0, 0);
    });
    document.getElementById('navFavMobile')?.addEventListener('click', () => {
      window.location.hash = '#/favoriler';
      window.scrollTo(0, 0);
    });

    document.getElementById('navSavedDesktop')?.addEventListener('click', () => {
      window.location.hash = '#/kaydedilenler';
      window.scrollTo(0, 0);
    });
    document.getElementById('navSavedMobile')?.addEventListener('click', () => {
      window.location.hash = '#/kaydedilenler';
      window.scrollTo(0, 0);
    });

    document.getElementById('navHomeMobile')?.addEventListener('click', () => {
      window.location.hash = '#/';
      window.scrollTo(0, 0);
    });

    document.getElementById('logoLink')?.addEventListener('click', () => {
      window.scrollTo(0, 0);
    });

    // Ana sayfa arama formu
    document.getElementById('homeSearchForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('homeSearchInput');
      const query = input ? input.value.trim() : '';
      resetExploreState();
      state.explore.query = query;
      const exploreInput = document.getElementById('exploreSearchInput');
      if (exploreInput) exploreInput.value = query;
      window.location.hash = '#/kesfet';
      window.scrollTo(0, 0);
    });

    // Ana sayfa "Bana bir şey öner" butonu
    document.getElementById('randomSuggestBtn')?.addEventListener('click', () => {
      if (state.allItems.length === 0) return;
      const randomItem = state.allItems[Math.floor(Math.random() * state.allItems.length)];
      navigateToDetail(randomItem.id);
    });

    // Ana sayfa kategori panelleri
    document.getElementById('categoryPanels')?.addEventListener('click', (e) => {
      const panel = e.target.closest('.cat-panel[data-category]');
      if (!panel) return;
      const cat = panel.dataset.category;
      resetExploreState();
      state.explore.categories.add(cat);
      window.location.hash = '#/kesfet';
      window.scrollTo(0, 0);
    });

    // Ana sayfa koleksiyon satırları
    document.getElementById('collectionsList')?.addEventListener('click', (e) => {
      const row = e.target.closest('.collection-row[data-collection-id]');
      if (!row) return;
      const colId = row.dataset.collectionId;
      resetExploreState();
      state.explore.collection = colId;
      window.location.hash = '#/kesfet';
      window.scrollTo(0, 0);
    });

    // Keşfet: Kategori butonları (Ya "Hepsi" ya da 1 veya 2 kategori birlikte)
    document.querySelector('.explore-cat-pills')?.addEventListener('click', (e) => {
      const pill = e.target.closest('.cat-pill[data-cat]');
      if (!pill) return;
      const cat = pill.dataset.cat;
      const selected = state.explore.categories;

      if (cat === 'hepsi') {
        selected.clear();
      } else {
        if (selected.has(cat)) {
          selected.delete(cat);
        } else {
          selected.add(cat);
          // Üçü birden seçilirse otomatik "Hepsi" moduna geçsin (ya Hepsi ya da 1-2 kategori kuralı)
          if (selected.size === 3) {
            selected.clear();
          }
        }
      }

      state.explore.visibleCount = PAGE_SIZE;
      renderExploreView();
    });

    // Keşfet: Arama kutusu
    document.getElementById('exploreSearchInput')?.addEventListener('input', (e) => {
      state.explore.query = e.target.value;
      state.explore.visibleCount = PAGE_SIZE;
      renderExploreView();
    });

    // Keşfet: Sıralama menüsü
    document.getElementById('exploreSortSelect')?.addEventListener('change', (e) => {
      state.explore.sort = e.target.value;
      state.explore.visibleCount = PAGE_SIZE;
      renderExploreView();
    });

    // Keşfet: Mobil filtre panelini aç/kapat
    document.getElementById('mobileFilterOpenBtn')?.addEventListener('click', openMobileFilterDrawer);
    document.getElementById('mobileFilterCloseTopBtn')?.addEventListener('click', closeMobileFilterDrawer);
    document.getElementById('mobileShowResultsBtn')?.addEventListener('click', closeMobileFilterDrawer);
    document.getElementById('filterBackdrop')?.addEventListener('click', closeMobileFilterDrawer);

    // Keşfet: Sol sütundaki filtre seçeneklerine tıklama
    document.getElementById('exploreSidebar')?.addEventListener('click', (e) => {
      if (e.target.closest('#toggleAllGenresBtn')) {
        state.explore.showAllGenres = !state.explore.showAllGenres;
        renderExploreView();
        return;
      }

      const btn = e.target.closest('.filter-option-btn[data-filter-type]');
      if (!btn) return;
      const type = btn.dataset.filterType;
      const val = btn.dataset.filterVal;
      const exp = state.explore;

      if (type === 'genre') {
        toggleSetValue(exp.genres, val);
      } else if (type === 'decade') {
        const decNum = Number(val);
        toggleSetValue(exp.decades, decNum);
        // On yıl seçildiğinde En erken / En geç kutuları sıfırlansın
        if (exp.decades.size > 0) {
          exp.yearMin = null;
          exp.yearMax = null;
          const minIn = document.getElementById('yearMinInput');
          const maxIn = document.getElementById('yearMaxInput');
          if (minIn) minIn.value = '';
          if (maxIn) maxIn.value = '';
        }
      } else if (type === 'lang') {
        toggleSetValue(exp.langs, val);
      } else if (type === 'country') {
        toggleSetValue(exp.countries, val);
      }

      exp.visibleCount = PAGE_SIZE;
      renderExploreView();
    });

    // Keşfet: En erken / En geç yıl kutuları
    const handleYearRangeInput = () => {
      const minIn = document.getElementById('yearMinInput');
      const maxIn = document.getElementById('yearMaxInput');
      const minRaw = minIn ? minIn.value.trim() : '';
      const maxRaw = maxIn ? maxIn.value.trim() : '';

      state.explore.yearMin = minRaw !== '' ? Number(minRaw) : null;
      state.explore.yearMax = maxRaw !== '' ? Number(maxRaw) : null;

      // Özel yıl aralığı girildiğinde seçili on yıllar sıfırlansın
      if (state.explore.yearMin !== null || state.explore.yearMax !== null) {
        state.explore.decades.clear();
      }

      state.explore.visibleCount = PAGE_SIZE;
      renderExploreView();
    };

    document.getElementById('yearMinInput')?.addEventListener('input', handleYearRangeInput);
    document.getElementById('yearMaxInput')?.addEventListener('input', handleYearRangeInput);

    // Keşfet: Seçili filtre etiketlerini (chips) kaldırma ve "Tümünü temizle"
    document.getElementById('activeFiltersList')?.addEventListener('click', (e) => {
      const clearAllBtn = e.target.closest('#clearAllFiltersInlineBtn');
      if (clearAllBtn) {
        clearOnlyFilters();
        renderExploreView();
        return;
      }

      const chip = e.target.closest('.active-filter-chip[data-chip-type]');
      if (!chip) return;
      const type = chip.dataset.chipType;
      const val = chip.dataset.chipVal;
      const exp = state.explore;

      if (type === 'genre') exp.genres.delete(val);
      else if (type === 'decade') exp.decades.delete(Number(val));
      else if (type === 'yearRange') {
        exp.yearMin = null;
        exp.yearMax = null;
        const minIn = document.getElementById('yearMinInput');
        const maxIn = document.getElementById('yearMaxInput');
        if (minIn) minIn.value = '';
        if (maxIn) maxIn.value = '';
      } else if (type === 'lang') exp.langs.delete(val);
      else if (type === 'country') exp.countries.delete(val);
      else if (type === 'tag') exp.tags.delete(val);
      else if (type === 'collection') exp.collection = null;

      exp.visibleCount = PAGE_SIZE;
      renderExploreView();
    });

    // Keşfet: Sonuç yoksa "Aramayı ve filtreleri temizle"
    document.getElementById('emptyResetAllBtn')?.addEventListener('click', () => {
      resetExploreState();
      renderExploreView();
    });

    // Keşfet: "Daha fazla göster"
    document.getElementById('loadMoreBtn')?.addEventListener('click', () => {
      state.explore.visibleCount += PAGE_SIZE;
      renderExploreView();
    });

    // Kaydedilenler: "Kaydedilenleri temizle" ve Favoriler: "Favorileri temizle"
    document.getElementById('clearSavedBtn')?.addEventListener('click', handleClearSavedClick);
    document.getElementById('clearFavBtn')?.addEventListener('click', handleClearFavClick);

    // Kart tıklamaları, kalp (beğen) ve kaydet butonları (Keşfet, Favoriler ve Kaydedilenler ortak)
    document.getElementById('mainContent')?.addEventListener('click', (e) => {
      const favBtn = e.target.closest('.card-fav-btn[data-fav-id]');
      if (favBtn) {
        e.stopPropagation();
        toggleFavItem(favBtn.dataset.favId);
        return;
      }

      const saveBtn = e.target.closest('.card-save-btn[data-save-id]');
      if (saveBtn) {
        e.stopPropagation();
        toggleSaveItem(saveBtn.dataset.saveId);
        return;
      }

      const card = e.target.closest('.item-card[data-item-id]');
      if (card) {
        hideCardHoverPopover();
        navigateToDetail(card.dataset.itemId);
      }
    });

    // Kartlara klavyeyle (Enter / Space) basınca açılması
    document.getElementById('mainContent')?.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const card = e.target.closest('.item-card[data-item-id]');
      if (card && e.target === card) {
        e.preventDefault();
        navigateToDetail(card.dataset.itemId);
      }
    });

    // Ayrıntı penceresi: Kapatma butonu ve karartılmış arka plan tıklaması
    document.getElementById('detailCloseBtn')?.addEventListener('click', closeDetailModalAndReturn);
    document.getElementById('detailModalBackdrop')?.addEventListener('click', (e) => {
      if (e.target.id === 'detailModalBackdrop') {
        closeDetailModalAndReturn();
      }
    });

    // Ayrıntı penceresi içi tıklamalar (İzle/Oku, Kaydet, Künye filtreleri, Konu etiketleri, Seri kardeşleri)
    document.getElementById('detailContent')?.addEventListener('click', (e) => {
      // İzle / Oku butonu
      const primaryBtn = e.target.closest('#detailPrimaryActionBtn');
      if (primaryBtn && primaryBtn.dataset.actionRoute) {
        const modalScroll = document.getElementById('detailModalScroll');
        if (modalScroll) {
          state.detailScrollTop = modalScroll.scrollTop;
        }
        state.openedPlayerFromHistory = true;
        window.location.hash = primaryBtn.dataset.actionRoute;
        return;
      }

      // Beğen butonu
      const favBtn = e.target.closest('#detailFavBtn');
      if (favBtn && favBtn.dataset.favId) {
        toggleFavItem(favBtn.dataset.favId);
        return;
      }

      // Kaydet butonu
      const saveBtn = e.target.closest('#detailSaveBtn');
      if (saveBtn && saveBtn.dataset.saveId) {
        toggleSaveItem(saveBtn.dataset.saveId);
        return;
      }

      // Künyedeki Tür, Ülke veya Orijinal dil bağlantıları
      const filterLink = e.target.closest('.credit-filter-link[data-credit-filter]');
      if (filterLink) {
        const filterType = filterLink.dataset.creditFilter;
        const filterVal = filterLink.dataset.creditVal;
        const cat = filterLink.dataset.creditCat;

        hideDetailModal();
        resetExploreState();
        if (cat) state.explore.categories.add(cat);
        if (filterType === 'genre') state.explore.genres.add(filterVal);
        else if (filterType === 'country') state.explore.countries.add(filterVal);
        else if (filterType === 'lang') state.explore.langs.add(filterVal);

        state.modalHistoryDepth = 0;
        if (window.location.hash === '#/kesfet') {
          showBaseView('kesfet', false);
          updateDocumentTitle();
        } else {
          window.location.hash = '#/kesfet';
          window.scrollTo(0, 0);
        }
        return;
      }

      // Künyenin altındaki Konu Etiketi (tag) butonları
      const tagBtn = e.target.closest('.detail-tag-btn[data-tag-filter]');
      if (tagBtn) {
        const tagVal = tagBtn.dataset.tagFilter;

        hideDetailModal();
        resetExploreState();
        state.explore.tags.add(tagVal);

        state.modalHistoryDepth = 0;
        if (window.location.hash === '#/kesfet') {
          showBaseView('kesfet', false);
          updateDocumentTitle();
        } else {
          window.location.hash = '#/kesfet';
          window.scrollTo(0, 0);
        }
        return;
      }

      // Serinin diğer filmleri / kitapları tıklaması
      const siblingCard = e.target.closest('.series-sibling-card[data-sibling-id]');
      if (siblingCard) {
        const sibId = siblingCard.dataset.siblingId;
        navigateToDetail(sibId);
      }
    });

    // Oynatıcı / Okuyucu: Geri butonu ve içerik etkileşimleri
    document.getElementById('playerBackBtn')?.addEventListener('click', closePlayerAndReturnToDetail);

    document.getElementById('playerBody')?.addEventListener('click', (e) => {
      const currentItem = state.byId.get(state.player.itemId);
      if (!currentItem) return;

      // Oynat butonu veya Tekrar dene butonu
      if (e.target.closest('#stagePlayTriggerBtn') || e.target.closest('#stageRetryBtn')) {
        startPlayerLoadingCycle(currentItem);
        return;
      }

      // Dizi: Sezon sekmesi seçimi
      const seasonTab = e.target.closest('.season-tab-btn[data-season-tab]');
      if (seasonTab) {
        state.player.selectedSeasonTab = Number(seasonTab.dataset.seasonTab);
        renderPlayerOverlayContent(currentItem);
        return;
      }

      // Dizi: Bölüm satırı seçimi (Geri tuşu sırasına eklenmez!)
      const epRow = e.target.closest('.episode-row-btn[data-ep-num]');
      if (epRow) {
        const sNum = Number(epRow.dataset.epSeason);
        const eNum = Number(epRow.dataset.epNum);
        selectSeriesEpisode(currentItem, sNum, eNum);
        return;
      }

      // Dizi: Önceki bölüm / Sonraki bölüm
      if (e.target.closest('#prevEpisodeBtn')) {
        stepSeriesEpisode(currentItem, -1);
        return;
      }
      if (e.target.closest('#nextEpisodeBtn')) {
        stepSeriesEpisode(currentItem, 1);
      }
    });

    // Esc tuşu açık olan oynatıcıyı, okuyucuyu ya da ayrıntı penceresini kapatsın
    window.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;

      if (state.activePlayerId) {
        e.preventDefault();
        closePlayerAndReturnToDetail();
        return;
      }

      if (state.activeModalId) {
        e.preventDefault();
        closeDetailModalAndReturn();
        return;
      }

      const sidebar = document.getElementById('exploreSidebar');
      if (sidebar && sidebar.classList.contains('open')) {
        e.preventDefault();
        closeMobileFilterDrawer();
      }
    });

    // Hash değişimini dinle (Geri ve İleri tuşları)
    window.addEventListener('hashchange', () => {
      hideCardHoverPopover();
      handleRouteChange();
    });

    initLogoAnimation();
    initCardHoverPopover();
  }

  /* ==========================================================================
     16B. ÜÇ NOKTA LOGO HOVER ANİMASYONU (Yin-Yang Kuyruklu Dönüş)
     ========================================================================== */
  function buildCircleSvgPath(x, y, r) {
    const x1 = (x - r).toFixed(2);
    const x2 = (x + r).toFixed(2);
    const yf = y.toFixed(2);
    const rf = r.toFixed(2);
    return `M ${x1} ${yf} A ${rf} ${rf} 0 1 0 ${x2} ${yf} A ${rf} ${rf} 0 1 0 ${x1} ${yf} Z`;
  }

  function buildCometSvgPath(cx, cy, orbitR, theta, headR, tailAngle, tailBlend) {
    const hx = cx + orbitR * Math.cos(theta);
    const hy = cy + orbitR * Math.sin(theta);

    if (tailBlend <= 0.004 || orbitR <= 0.4) {
      return buildCircleSvgPath(hx, hy, headR);
    }

    const urx = Math.cos(theta);
    const ury = Math.sin(theta);
    const utx = -Math.sin(theta);
    const uty = Math.cos(theta);

    const pts = [];
    const headSteps = 10;
    for (let k = 0; k <= headSteps; k++) {
      const gamma = -Math.PI / 2 + (k / headSteps) * Math.PI;
      const sg = Math.sin(gamma);
      const cg = Math.cos(gamma);
      const px = hx + headR * (sg * urx + cg * utx);
      const py = hy + headR * (sg * ury + cg * uty);
      pts.push(`${px.toFixed(2)} ${py.toFixed(2)}`);
    }

    const tailSteps = 22;
    for (let k = 1; k < tailSteps; k++) {
      const gamma = Math.PI / 2 + (k / tailSteps) * Math.PI;
      const u = -Math.cos(gamma); // 0 -> 1 -> 0
      const phi = theta - Math.pow(u, 1.08) * tailAngle;
      const cpx = cx + orbitR * Math.cos(phi);
      const cpy = cy + orbitR * Math.sin(phi);
      const nrx = Math.cos(phi);
      const nry = Math.sin(phi);
      const ntx = -Math.sin(phi);
      const nty = Math.cos(phi);
      const taper = Math.pow(Math.max(0, 1 - u), 0.85 * tailBlend);
      const px = cpx + headR * Math.sin(gamma) * taper * nrx - headR * (1 - tailBlend) * u * ntx;
      const py = cpy + headR * Math.sin(gamma) * taper * nry - headR * (1 - tailBlend) * u * nty;
      pts.push(`${px.toFixed(2)} ${py.toFixed(2)}`);
    }

    return `M ${pts.join(' L ')} Z`;
  }

  function initLogoAnimation() {
    const logo = document.getElementById('logoLink');
    const dotDizi = document.getElementById('logoDotDizi');
    const dotFilm = document.getElementById('logoDotFilm');
    const dotKitap = document.getElementById('logoDotKitap');
    if (!logo || !dotDizi || !dotFilm || !dotKitap) return;

    const CX = 33;
    const CY = 19;
    const REST_R = 7;
    const ORBIT_R = 12;
    const DURATION_MS = 1300;

    let rafId = null;
    let isPlaying = false;

    function applyFrame(t) {
      if (t <= 0 || t >= 1) {
        dotDizi.setAttribute('d', buildCircleSvgPath(11, CY, REST_R));
        dotFilm.setAttribute('d', buildCircleSvgPath(33, CY, REST_R));
        dotKitap.setAttribute('d', buildCircleSvgPath(55, CY, REST_R));
        logo.dataset.animating = 'false';
        return;
      }

      logo.dataset.animating = 'true';

      let s = 1;
      if (t < 0.22) {
        s = 0.5 - 0.5 * Math.cos(Math.PI * (t / 0.22));
      } else if (t > 0.78) {
        s = 0.5 - 0.5 * Math.cos(Math.PI * ((1 - t) / 0.22));
      }

      const deltaTheta = 2 * Math.PI * (0.5 - 0.5 * Math.cos(Math.PI * t));
      const tailBlend = Math.pow(s, 1.65);
      const tailAngle = 1.18 * tailBlend;
      const headR = REST_R - 0.55 * tailBlend;

      const rDizi = 22 * (1 - s) + ORBIT_R * s;
      const thetaDizi = Math.PI - (Math.PI / 6) * s + deltaTheta;

      const rFilm = ORBIT_R * s;
      const thetaFilm = 1.5 * Math.PI + deltaTheta;

      const rKitap = 22 * (1 - s) + ORBIT_R * s;
      const thetaKitap = (Math.PI / 6) * s + deltaTheta;

      dotDizi.setAttribute(
        'd',
        buildCometSvgPath(CX, CY, rDizi, thetaDizi, headR, tailAngle, tailBlend)
      );
      dotFilm.setAttribute(
        'd',
        buildCometSvgPath(CX, CY, rFilm, thetaFilm, headR, tailAngle, tailBlend)
      );
      dotKitap.setAttribute(
        'd',
        buildCometSvgPath(CX, CY, rKitap, thetaKitap, headR, tailAngle, tailBlend)
      );
    }

    function startOrbit() {
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        applyFrame(0);
        return;
      }
      if (isPlaying) return;
      isPlaying = true;
      let startTime = null;

      function tick(now) {
        if (startTime === null) startTime = now;
        const elapsed = Math.max(1, now - startTime);
        const t = Math.min(1, elapsed / DURATION_MS);
        applyFrame(t);
        if (t < 1) {
          rafId = requestAnimationFrame(tick);
        } else {
          rafId = null;
          isPlaying = false;
        }
      }

      rafId = requestAnimationFrame(tick);
    }

    logo.addEventListener('mouseenter', () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
        isPlaying = false;
      }
      startOrbit();
    });

    applyFrame(0);
  }

  /* ==========================================================================
     16C. FARE BEKLEYİNCE AÇILAN KÜÇÜK AYRINTI KUTUSU (Yalnızca Bilgisayarda)
     ========================================================================== */
  let hoverPopoverTimer = null;
  let hoveredCardEl = null;
  let lastPointerWasTouch = false;
  const HOVER_POPOVER_DELAY_MS = 2000;

  function isDesktopHoverSupported() {
    if (lastPointerWasTouch) return false;
    if (!window.matchMedia) return true;
    return (
      window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
      !window.matchMedia('(pointer: coarse)').matches
    );
  }

  function hideCardHoverPopover() {
    if (hoverPopoverTimer) {
      clearTimeout(hoverPopoverTimer);
      hoverPopoverTimer = null;
    }
    hoveredCardEl = null;
    const popover = document.getElementById('cardHoverPopover');
    if (popover && !popover.hidden) {
      popover.hidden = true;
    }
  }

  function showCardHoverPopover(card) {
    if (!isDesktopHoverSupported()) return;
    if (!card || !card.isConnected) return;
    if (state.activeModalId || state.activePlayerId) return;

    const itemId = card.dataset.itemId;
    const item = state.byId.get(itemId);
    if (!item) return;

    const popover = document.getElementById('cardHoverPopover');
    if (!popover) return;

    const infoLine = buildCoverInfoLine(item, true);
    const genresText = (item.genres || []).join(', ');

    popover.innerHTML = `
      <div class="hover-popover-title">${escapeHtml(item.title)}</div>
      <div class="hover-popover-info">${escapeHtml(infoLine)}</div>
      <p class="hover-popover-plot">${escapeHtml(item.plot)}</p>
      ${genresText ? `<div class="hover-popover-genres">${escapeHtml(genresText)}</div>` : ''}
    `;

    popover.hidden = false;
    popover.style.left = '0px';
    popover.style.top = '0px';

    const cardRect = card.getBoundingClientRect();
    const popRect = popover.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const gap = 12;
    const edgePad = 12;

    let left = cardRect.right + gap;
    let side = 'right';

    if (left + popRect.width > vw - edgePad) {
      const leftSideCandidate = cardRect.left - gap - popRect.width;
      if (leftSideCandidate >= edgePad) {
        left = leftSideCandidate;
        side = 'left';
      } else {
        left = Math.max(edgePad, vw - popRect.width - edgePad);
      }
    }

    let top = cardRect.top + 8;
    if (top + popRect.height > vh - edgePad) {
      top = Math.max(edgePad, vh - popRect.height - edgePad);
    }
    if (top < edgePad) {
      top = edgePad;
    }

    popover.dataset.side = side;
    popover.style.left = `${Math.round(left)}px`;
    popover.style.top = `${Math.round(top)}px`;
  }

  function initCardHoverPopover() {
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;

    window.addEventListener(
      'pointerdown',
      (e) => {
        if (e.pointerType === 'touch') {
          lastPointerWasTouch = true;
          hideCardHoverPopover();
        } else if (e.pointerType === 'mouse') {
          lastPointerWasTouch = false;
        }
      },
      { passive: true }
    );

    window.addEventListener(
      'touchstart',
      () => {
        lastPointerWasTouch = true;
        hideCardHoverPopover();
      },
      { passive: true }
    );

    mainContent.addEventListener('mouseover', (e) => {
      if (!isDesktopHoverSupported()) return;
      const card = e.target.closest('.item-card[data-item-id]');
      if (!card) {
        if (hoveredCardEl) hideCardHoverPopover();
        return;
      }
      if (card === hoveredCardEl) return;

      hideCardHoverPopover();
      hoveredCardEl = card;
      hoverPopoverTimer = setTimeout(() => {
        hoverPopoverTimer = null;
        if (hoveredCardEl === card) {
          showCardHoverPopover(card);
        }
      }, HOVER_POPOVER_DELAY_MS);
    });

    mainContent.addEventListener('mouseout', (e) => {
      if (!hoveredCardEl) return;
      const related = e.relatedTarget;
      if (related && hoveredCardEl.contains(related)) return;
      hideCardHoverPopover();
    });

    window.addEventListener('scroll', hideCardHoverPopover, { passive: true });
    window.addEventListener('resize', hideCardHoverPopover, { passive: true });
  }

  function toggleSetValue(setObj, val) {
    if (setObj.has(val)) setObj.delete(val);
    else setObj.add(val);
  }

  function clearOnlyFilters() {
    state.explore.genres.clear();
    state.explore.decades.clear();
    state.explore.yearMin = null;
    state.explore.yearMax = null;
    state.explore.langs.clear();
    state.explore.countries.clear();
    state.explore.tags.clear();
    state.explore.collection = null;
    state.explore.showAllGenres = false;
    state.explore.visibleCount = PAGE_SIZE;

    const minIn = document.getElementById('yearMinInput');
    const maxIn = document.getElementById('yearMaxInput');
    if (minIn) minIn.value = '';
    if (maxIn) maxIn.value = '';
  }

  /* ==========================================================================
     17. BAŞLATMA
     ========================================================================== */
  async function init() {
    initTheme();
    loadSavedItems();
    loadFavItems();
    bindEvents();

    try {
      await loadData();
      updateSavedBadges();
      updateFavBadges();
      renderHomePanels();
      handleRouteChange();
    } catch (err) {
      console.error(err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
