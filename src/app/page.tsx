"use client";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import useSWR from "swr";
import type { Place } from "@/lib/places";
import { type Language, translations } from "@/lib/i18n";

const InteractiveMap = dynamic(() => import("@/app/components/InteractiveMap"), {
  ssr: false,
  loading: () => <div className="map-loading">Memuat peta…</div>,
});

type Point = { lat: number; lng: number; label: string };

type AiPriceData = {
  min: number;
  max: number;
  summary: string;
  tip?: string;
};

const categoryIcons: Record<string, string> = {
  food: "fork",
  cafe: "cup",
  convenience: "store",
  supermarket: "basket",
  drugstore: "plus",
  shopping: "bag",
  electronics: "screen",
  other: "pin",
};

const fmt = (m: number) => (m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1).replace(/\.0$/, "")} km`);

const placeFetcher = async (url: string): Promise<Place[]> => {
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Pencarian tempat gagal.");
  return data.places;
};

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };
  const shapes: Record<string, React.ReactNode> = {
    pin: (
      <>
        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    fork: (
      <>
        <path d="M5 3v6a3 3 0 0 0 6 0V3M8 3v18M19 3v18M19 3c-3 3-3 7 0 9" />
      </>
    ),
    cup: (
      <>
        <path d="M5 8h12v8a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4zM17 10h2a2 2 0 1 1 0 4h-2M8 3v2M12 3v2" />
      </>
    ),
    store: (
      <>
        <path d="M3 10h18l-2-6H5zM5 10v10h14V10M9 20v-6h6v6" />
      </>
    ),
    basket: (
      <>
        <path d="m4 10 2 10h12l2-10M3 10h18M8 10l4-7 4 7" />
      </>
    ),
    plus: (
      <>
        <path d="M12 3v18M3 12h18" />
      </>
    ),
    bag: (
      <>
        <path d="M4 8h16l-1 13H5zM9 8V6a3 3 0 0 1 6 0v2" />
      </>
    ),
    screen: (
      <>
        <rect x="3" y="4" width="18" height="13" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m16 16 5 5" />
      </>
    ),
    arrow: (
      <>
        <path d="M7 17 17 7M7 7h10v10" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    locate: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M12 9v3l2 2" />
      </>
    ),
    map: (
      <>
        <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15" />
      </>
    ),
    list: (
      <>
        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    star: (
      <>
        <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z" />
      </>
    ),
    close: <path d="m6 6 12 12M18 6 6 18" />,
    sliders: (
      <>
        <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
        <circle cx="16" cy="7" r="2" />
        <circle cx="8" cy="17" r="2" />
      </>
    ),
    heart: (
      <path d="M20.8 8.8c0 5.5-8.8 11-8.8 11s-8.8-5.5-8.8-11a4.5 4.5 0 0 1 8.8-1.6 4.5 4.5 0 0 1 8.8 1.6Z" />
    ),
    sparkle: (
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
    ),
  };
  return <svg {...common}>{shapes[name] ?? shapes.pin}</svg>;
}

export default function Home() {
  const [lang, setLang] = useState<Language>("id");
  const [point, setPoint] = useState<Point | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("food");
  const [radius, setRadius] = useState(1000);
  const [sort, setSort] = useState("recommended");
  const [budget, setBudget] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [openOnly, setOpenOnly] = useState(false);
  const [manualBusy, setManualBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"list" | "map">("list");
  const [selected, setSelected] = useState<Place | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  const [aiPrice, setAiPrice] = useState<AiPriceData | null>(null);
  const [aiPriceLoading, setAiPriceLoading] = useState(false);

  const t = translations[lang] || translations.id;

  const categories = useMemo(
    () => [
      { id: "food", label: t.categories.food, icon: categoryIcons.food },
      { id: "cafe", label: t.categories.cafe, icon: categoryIcons.cafe },
      { id: "convenience", label: t.categories.convenience, icon: categoryIcons.convenience },
      { id: "supermarket", label: t.categories.supermarket, icon: categoryIcons.supermarket },
      { id: "drugstore", label: t.categories.drugstore, icon: categoryIcons.drugstore },
      { id: "shopping", label: t.categories.shopping, icon: categoryIcons.shopping },
      { id: "electronics", label: t.categories.electronics, icon: categoryIcons.electronics },
      { id: "other", label: t.categories.other, icon: categoryIcons.other },
    ],
    [t]
  );

  const placeKey = point
    ? `/api/places?lat=${point.lat}&lng=${point.lng}&radius=${radius}&category=${category}&lang=${lang}`
    : null;
  const { data: placesData, error: placesError, isLoading: placesLoading } = useSWR(placeKey, placeFetcher, {
    keepPreviousData: true,
  });
  const places = useMemo(() => placesData ?? [], [placesData]);
  const busy = manualBusy || placesLoading;
  const errorMessage = error || placesError?.message || "";

  useEffect(() => {
    try {
      const raw = localStorage.getItem("nearme-preferences");
      if (raw) {
        const p = JSON.parse(raw);
        if (p.radius) setRadius(p.radius);
        if (p.category) setCategory(p.category);
        if (p.budget) setBudget(p.budget);
      }
      const savedLang = localStorage.getItem("nearme-lang") as Language;
      if (savedLang && (savedLang === "id" || savedLang === "en" || savedLang === "ja")) {
        setLang(savedLang);
      }
      setFavoriteIds(JSON.parse(localStorage.getItem("nearme-favorites") ?? "[]"));
    } catch {} finally {
      setPreferencesLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (preferencesLoaded) {
      localStorage.setItem("nearme-preferences", JSON.stringify({ radius, category, budget }));
      localStorage.setItem("nearme-lang", lang);
    }
  }, [radius, category, budget, lang, preferencesLoaded]);

  useEffect(() => {
    if (!selected) {
      setAiPrice(null);
      return;
    }
    let active = true;
    setAiPriceLoading(true);
    fetch(
      `/api/estimate-price?name=${encodeURIComponent(selected.name)}&category=${encodeURIComponent(
        selected.category
      )}&address=${encodeURIComponent(selected.address)}&lang=${lang}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (active && data && typeof data.min === "number") {
          setAiPrice(data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setAiPriceLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selected, lang]);

  const useLocation = () => {
    setError("");
    if (!navigator.geolocation) {
      setError(t.errorGeoUnsupported);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude, label: t.myLocation };
        setPoint(p);
        setQuery(p.label);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setError(err.code === 1 ? t.errorGeoDenied : t.errorGeoFailed);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  };

  const manualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setManualBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}&lang=${lang}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPoint({ lat: data.lat, lng: data.lng, label: data.label.split(",").slice(0, 2).join(",") });
    } catch (e) {
      setError(e instanceof Error ? e.message : t.errorLocationNotFound);
    } finally {
      setManualBusy(false);
    }
  };

  const visible = useMemo(() => {
    const arr = places.filter(
      (p) =>
        (!budget || !p.price || p.price.max <= Number(budget)) &&
        (!minRating || (p.rating !== undefined && p.rating >= minRating)) &&
        (!openOnly || p.openNow === true)
    );
    if (sort === "nearest") {
      arr.sort((a, b) => (a.walkingMeters ?? a.distanceMeters ?? 1e9) - (b.walkingMeters ?? b.distanceMeters ?? 1e9));
    } else if (sort === "cheapest") {
      arr.sort((a, b) => (a.price?.min ?? Infinity) - (b.price?.min ?? Infinity));
    } else if (sort === "rated") {
      arr.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else {
      arr.sort((a, b) => score(b) - score(a));
    }
    return arr;

    function score(p: Place) {
      const distance = p.distanceMeters ? Math.max(0, 35 - (p.distanceMeters / radius) * 35) : 0;
      const priceFit = budget && p.price && p.price.max <= Number(budget) ? 30 : 0;
      const rating =
        (p.rating ? Math.min(16, (p.rating / 5) * 16) : 0) +
        (p.ratingCount ? Math.min(4, Math.log10(p.ratingCount + 1)) : 0);
      return distance + priceFit + rating + (p.openNow ? 15 : 0);
    }
  }, [places, sort, budget, minRating, openOnly, radius]);

  const toggleFavorite = (id: string) =>
    setFavoriteIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem("nearme-favorites", JSON.stringify(next));
      return next;
    });

  const activeCategory = categories.find((c) => c.id === category)?.label ?? categories[0].label;

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#">
          <span className="brand-mark">
            <Icon name="pin" size={20} />
          </span>
          <span>
            near<span className="brand-accent">me</span>
            <small>JAPAN</small>
          </span>
        </a>
        <nav className="desktop-nav">
          <a className="nav-active" href="#discover">
            {t.navDiscover}
          </a>
          <a href="#how">{t.navHow}</a>
        </nav>
        <div className="topbar-actions">
          <div className="lang-switcher" role="group" aria-label={t.languageLabel}>
            <button
              className={lang === "id" ? "lang-active" : ""}
              onClick={() => setLang("id")}
              aria-pressed={lang === "id"}
              title="Bahasa Indonesia"
            >
              ID
            </button>
            <button
              className={lang === "en" ? "lang-active" : ""}
              onClick={() => setLang("en")}
              aria-pressed={lang === "en"}
              title="English"
            >
              EN
            </button>
            <button
              className={lang === "ja" ? "lang-active" : ""}
              onClick={() => setLang("ja")}
              aria-pressed={lang === "ja"}
              title="日本語"
            >
              JA
            </button>
          </div>
          <button className="location-pill" onClick={useLocation}>
            <span className="live-dot" /> {point?.label ?? t.locationNotSelected} <Icon name="chevron" size={15} />
          </button>
        </div>
      </header>

      <section className="hero" id="discover">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="eyebrow-line" /> {t.heroEyebrow}
          </div>
          <h1>
            {t.heroTitle1}
            <br />
            <em>{t.heroTitle2}</em>
          </h1>
          <p>{t.heroSub}</p>
          <div className="hero-note">
            <span className="note-icon">
              <Icon name="locate" size={17} />
            </span>{" "}
            {t.heroNote} <i /> {t.heroNoteSub}
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="sun-disc" />
          <div className="mountain mountain-back" />
          <div className="mountain mountain-front" />
          <div className="art-path" />
          <div className="art-pin">
            <Icon name="pin" size={23} />
          </div>
          <div className="art-tag tag-top">TOKYO · 35°39′N</div>
          <div className="art-tag tag-bottom">YOUR NEXT STOP</div>
          <span className="art-spark spark-one">✳</span>
          <span className="art-spark spark-two">✳</span>
        </div>
      </section>

      <section className="search-panel" aria-label="Cari tempat di sekitar">
        <form onSubmit={manualSearch} className="location-form">
          <label htmlFor="location">{t.searchFromLabel}</label>
          <div className="location-input">
            <Icon name="search" size={19} />
            <input
              id="location"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
            />
            <button type="submit" disabled={busy || !query.trim()} aria-label="Cari lokasi">
              <Icon name="arrow" />
            </button>
          </div>
        </form>
        <div className="search-divider" />
        <div className="radius-select">
          <label htmlFor="radius">{t.searchAreaLabel}</label>
          <select id="radius" value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
            <option value={500}>500 meter</option>
            <option value={1000}>1 kilometer</option>
            <option value={2000}>2 kilometer</option>
            <option value={5000}>5 kilometer</option>
          </select>
        </div>
        <button className="current-location" onClick={useLocation} disabled={locating}>
          <Icon name="locate" size={18} />
          {locating ? t.locating : t.useMyLocation}
        </button>
      </section>

      <section className="categories-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{t.catEyebrow}</span>
            <h2>{t.catTitle}</h2>
          </div>
          <span className="category-hint">{t.catHint}</span>
        </div>
        <div className="category-grid">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`category-tile ${category === c.id ? "category-selected" : ""}`}
              aria-pressed={category === c.id}
            >
              <span className="category-icon">
                <Icon name={c.icon} size={21} />
              </span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="results-section">
        <div className="results-header">
          <div className="results-title">
            <span className="eyebrow">{t.resultsEyebrow}</span>
            <h2>{point ? t.resultsTitleWithPoint(activeCategory) : t.resultsTitleDefault}</h2>
            <p>
              {point
                ? `${point.label} · radius ${radius >= 1000 ? `${radius / 1000} km` : `${radius} m`}`
                : t.resultsSubDefault}
            </p>
          </div>
          <div className="results-actions">
            <button className="filter-button" onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters}>
              <Icon name="sliders" /> {t.filterBtn}
            </button>
            <div className="view-switch">
              <button
                onClick={() => setMode("list")}
                className={mode === "list" ? "view-active" : ""}
                aria-label="Tampilan daftar"
              >
                <Icon name="list" size={17} />
              </button>
              <button
                onClick={() => setMode("map")}
                className={mode === "map" ? "view-active" : ""}
                aria-label="Tampilan peta"
              >
                <Icon name="map" size={17} />
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="filters-bar">
            <label>
              {t.languageLabel}
              <select value={lang} onChange={(e) => setLang(e.target.value as Language)}>
                <option value="id">Bahasa Indonesia (ID)</option>
                <option value="en">English (EN)</option>
                <option value="ja">日本語 (JA)</option>
              </select>
            </label>
            <label>
              {t.sortLabel}
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="recommended">{t.sortRecommended}</option>
                <option value="nearest">{t.sortNearest}</option>
                <option value="cheapest">{t.sortCheapest}</option>
                <option value="rated">{t.sortRated}</option>
              </select>
            </label>
            <label>
              {t.budgetLabel}
              <select value={budget} onChange={(e) => setBudget(e.target.value)}>
                <option value="">{t.allBudgets}</option>
                <option value="500">¥500</option>
                <option value="1000">¥1.000</option>
                <option value="2000">¥2.000</option>
                <option value="5000">¥5.000</option>
              </select>
            </label>
            <label>
              {t.ratingLabel}
              <select value={minRating} onChange={(e) => setMinRating(Number(e.target.value))}>
                <option value="0">{t.allRatings}</option>
                <option value="3">{t.ratingStars(3)}</option>
                <option value="4">{t.ratingStars(4)}</option>
                <option value="4.5">{t.ratingStars(4.5)}</option>
              </select>
            </label>
            <label className="check-filter">
              <input type="checkbox" checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} />
              {t.openOnlyLabel}
            </label>
          </div>
        )}

        {errorMessage && (
          <div className="alert alert-error" role="alert">
            <span>{errorMessage}</span>
            <button onClick={() => setError("")} aria-label="Tutup pesan">
              <Icon name="close" size={17} />
            </button>
          </div>
        )}

        {point && !busy && !placesError && places.length === 0 && (
          <div className="alert alert-info" role="status">
            {t.emptyArea}
          </div>
        )}

        {!point && !busy && (
          <div className="empty-state">
            <div className="empty-illustration">
              <div className="empty-sun" />
              <div className="empty-path" />
              <span className="empty-pin">
                <Icon name="pin" size={25} />
              </span>
            </div>
            <h3>{t.startTitle}</h3>
            <p>{t.startSub}</p>
            <button onClick={useLocation} className="primary-button">
              <Icon name="locate" size={17} /> {t.findNearbyBtn}
            </button>
          </div>
        )}

        {point && busy && (
          <div className="loading-state">
            <span className="loader" />
            <div>
              <strong>{t.loadingTitle}</strong>
              <p>{t.loadingSub(radius >= 1000 ? `${radius / 1000} km` : `${radius} m`)}</p>
            </div>
          </div>
        )}

        {point &&
          !busy &&
          visible.length > 0 &&
          (mode === "list" ? (
            <div className="place-grid">
              {visible.map((p, i) => (
                <article className="place-card" key={p.id}>
                  <div className="place-photo" style={p.photo ? { backgroundImage: `url("${p.photo}")` } : {}}>
                    {!p.photo && (
                      <div className="photo-placeholder">
                        <span className="photo-sun" />
                        <span className="photo-hill hill-a" />
                        <span className="photo-hill hill-b" />
                        <span className="photo-stamp">
                          <Icon name={categoryIcons[category] ?? "pin"} size={20} />
                        </span>
                      </div>
                    )}
                    <span className="photo-index">{String(i + 1).padStart(2, "0")}</span>
                    <button
                      onClick={() => toggleFavorite(p.id)}
                      className={`favorite-button ${favoriteIds.includes(p.id) ? "is-favorite" : ""}`}
                      aria-label={favoriteIds.includes(p.id) ? "Hapus dari favorit" : "Simpan ke favorit"}
                      aria-pressed={favoriteIds.includes(p.id)}
                    >
                      <Icon name="heart" size={18} />
                    </button>
                  </div>
                  <div className="place-content">
                    <div className="place-meta">
                      <span>{p.category}</span>
                      {p.openNow !== undefined && (
                        <span className={p.openNow ? "open-label" : "closed-label"}>
                          <i />
                          {p.openNow ? t.openNow : t.closed}
                        </span>
                      )}
                    </div>
                    <h3>{p.name}</h3>
                    <p className="place-address">{p.address}</p>
                    <div className="place-stats">
                      <span className="distance-stat">
                        <Icon name="pin" size={15} />
                        {p.walkingMeters ? fmt(p.walkingMeters) : fmt(p.distanceMeters ?? 0)}
                        {p.walkingSeconds
                          ? ` · ${t.walkingMins(Math.max(1, Math.round(p.walkingSeconds / 60)))}`
                          : ` · ${t.straightLine}`}
                      </span>
                      {p.rating !== undefined && (
                        <span className="rating-stat">
                          <Icon name="star" size={14} />
                          {p.rating.toFixed(1)}
                          {p.ratingCount ? ` (${p.ratingCount.toLocaleString()})` : ""}
                        </span>
                      )}
                    </div>
                    <div className="place-footer">
                      <span className="price-label">
                        {p.price
                          ? `¥${p.price.min.toLocaleString()}–¥${p.price.max.toLocaleString()}`
                          : p.priceLevel
                            ? t.priceRangeCategory("¥".repeat(p.priceLevel))
                            : t.priceUnavailable}
                      </span>
                      <button onClick={() => setSelected(p)} className="detail-button">
                        {t.detailBtn} <Icon name="chevron" size={15} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <MapView point={point} places={visible} selected={selected} onSelect={setSelected} t={t} />
          ))}

        {point && !busy && places.length > 0 && visible.length === 0 && (
          <div className="empty-filter">
            <h3>{t.emptyFilterTitle}</h3>
            <p>{t.emptyFilterSub}</p>
            <button
              onClick={() => {
                setBudget("");
                setMinRating(0);
                setOpenOnly(false);
              }}
            >
              {t.clearFilters}
            </button>
          </div>
        )}
      </section>

      <footer className="footer" id="how">
        <div className="footer-brand">
          <span className="brand-mark">
            <Icon name="pin" size={18} />
          </span>{" "}
          near<span className="brand-accent">me</span> JAPAN
        </div>
        <p>{t.footerTagline}</p>
        <div className="footer-trust">
          <span>
            <Icon name="locate" size={15} /> {t.footerTrust1}
          </span>
          <i />
          <span>{t.footerTrust2}</span>
        </div>
        <small>{t.footerCopyright}</small>
      </footer>

      {selected && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelected(null);
          }}
        >
          <section className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title">
            <button className="modal-close" onClick={() => setSelected(null)} aria-label={t.closeDetail}>
              <Icon name="close" />
            </button>
            <div className="modal-photo" style={selected.photo ? { backgroundImage: `url("${selected.photo}")` } : {}}>
              {!selected.photo && (
                <div className="photo-placeholder">
                  <span className="photo-sun" />
                  <span className="photo-hill hill-a" />
                  <span className="photo-hill hill-b" />
                </div>
              )}
            </div>
            <div className="modal-body">
              <span className="eyebrow">{selected.category}</span>
              <h2 id="detail-title">{selected.name}</h2>
              <p>{selected.address}</p>

              {/* AI Price Estimate Section */}
              <div className="ai-price-box">
                <div className="ai-price-header">
                  <span className="ai-badge">
                    <Icon name="sparkle" size={13} /> {t.aiEstimateBadge}
                  </span>
                  <strong className="ai-price-amount">
                    {aiPriceLoading
                      ? t.aiEstimating
                      : aiPrice
                        ? `¥${aiPrice.min.toLocaleString()} – ¥${aiPrice.max.toLocaleString()}`
                        : t.priceDisclosureTitle}
                  </strong>
                </div>
                {aiPrice && (
                  <div className="ai-price-content">
                    <p className="ai-summary">{aiPrice.summary}</p>
                    {aiPrice.tip && (
                      <div className="ai-tip">
                        <strong>💡 {t.aiTravelTip}:</strong> {aiPrice.tip}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="detail-facts">
                {selected.rating !== undefined && (
                  <span>
                    <Icon name="star" size={16} />
                    {selected.rating.toFixed(1)} {selected.ratingCount ? `· ${t.reviewsCount(selected.ratingCount)}` : ""}
                  </span>
                )}
                <span>
                  <Icon name="pin" size={16} />
                  {selected.walkingMeters
                    ? fmt(selected.walkingMeters)
                    : `${fmt(selected.distanceMeters ?? 0)} ${t.straightLine}`}
                </span>
                {selected.openNow !== undefined && (
                  <span className={selected.openNow ? "fact-open" : "fact-closed"}>
                    <Icon name="clock" size={16} />
                    {selected.openNow ? t.openNow : t.closed}
                  </span>
                )}
              </div>
              {selected.hours && (
                <div className="hours-block">
                  <h3>{t.hoursTitle}</h3>
                  {selected.hours.map((h) => (
                    <p key={h}>{h}</p>
                  ))}
                </div>
              )}
              {selected.website && (
                <a className="website-link" href={selected.website} target="_blank" rel="noreferrer">
                  {t.visitWebsite} <Icon name="arrow" size={15} />
                </a>
              )}
              <a
                className="primary-button map-link"
                href={`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}&travelmode=walking`}
                target="_blank"
                rel="noreferrer"
              >
                {t.getDirections} <Icon name="arrow" size={17} />
              </a>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function MapView({
  point,
  places,
  selected,
  onSelect,
  t,
}: {
  point: Point;
  places: Place[];
  selected: Place | null;
  onSelect: (p: Place | null) => void;
  t: (typeof translations)[Language];
}) {
  return (
    <div className="map-layout">
      <div className="map-canvas">
        <InteractiveMap point={point} places={places} selected={selected} onSelect={onSelect} />
        {selected && (
          <button className="recenter-button" onClick={() => onSelect(null)}>
            <Icon name="locate" size={16} /> {t.recenterMap}
          </button>
        )}
      </div>
      <div className="map-place-list">
        <strong>{t.mapSpotsCount(places.length)}</strong>
        {places.map((p) => (
          <button
            key={p.id}
            className={selected?.id === p.id ? "map-place-active" : ""}
            onClick={() => onSelect(p)}
          >
            <span className="map-place-pin">
              <Icon name="pin" size={15} />
            </span>
            <span>
              <b>{p.name}</b>
              <small>
                {p.walkingMeters ? fmt(p.walkingMeters) : fmt(p.distanceMeters ?? 0)}
              </small>
            </span>
            <Icon name="chevron" size={16} />
          </button>
        ))}
        <small className="map-attribution">{t.mapAttribution}</small>
      </div>
    </div>
  );
}
