// @ts-check
/// <reference path="./kino.d.ts" />
// TV en Vivo (tvenvivo.org): the site's 88 channels in Kino's En vivo tab, Home rows, own section and categories.
// Read it top to bottom: 1. texts  2. catalog  3. channel shapes  4. live exports  5. browse and search
//                        6. section and categories  7. resolve  8. settings
//
// How a channel plays (two plain GETs, no WebView):
//   core.php?canal=<id> (with the site as Referer) -> the signed player address (stream.php?...&sig=...)
//   stream.php -> a page whose player holds the tokenized HLS manifest (/playlist/<n>/index.m3u8?token=...)


// Kino waits for every request a call left running before it delivers the call's answer (quickjs-kt joins the pending async work), so a call that
// answered early at its own deadline or guard was still held until the requests it no longer needed ended. Asking Kino to drop what a call leaves
// running (the prelude reads this flag after every call; Kino 0.9.54 and later, an older one ignores it) lets the answer leave when it is ready.
globalThis.__kinoDropPendingFetches = true;

const BASE = "https://www.tvenvivo.org";

// ---- 1. texts ----------------------------------------------------------------------------------------------------

const TEXTS = {
  es: {
    gDeportes: "Deportes", gCo: "Colombia", gMx: "México", gPe: "Perú", gAr: "Argentina", gUs: "Estados Unidos",
    gIntl: "Internacional", gNovelas: "Novelas", gInfantil: "Infantil", gDocs: "Documentales", gCine: "Cine y series",
    gAdultos: "Adultos", gMas: "Más canales",
    tabSports: "Deportes", tabOpen: "TV abierta", tabCable: "Cable",
    rowEspn: "ESPN", rowFox: "Fox Sports", rowFootball: "Fútbol y más",
    heroTitle: "TV en vivo", heroText: "Deportes, TV abierta de Latinoamérica, cine, documentales e infantil.",
    unknownRef: "Ese canal ya no está.",
    offline: "Este canal no tiene señal ahora. Prueba otro en un rato.",
    unavailable: "El sitio no responde. Intenta de nuevo en un momento.",
    status: "{n} canales",
    statusExtra: "{n} canales ({x} nuevos)",
    testOk: "Señal correcta: {name} responde.",
    testOffline: "{name} no tiene señal ahora, pero el sitio responde.",
    refreshNone: "No hay canales nuevos.",
    refreshAdded: "Se agregaron {n} canales nuevos.",
  },
  en: {
    gDeportes: "Sports", gCo: "Colombia", gMx: "Mexico", gPe: "Peru", gAr: "Argentina", gUs: "United States",
    gIntl: "International", gNovelas: "Soap operas", gInfantil: "Kids", gDocs: "Documentaries", gCine: "Movies and series",
    gAdultos: "Adults", gMas: "More channels",
    tabSports: "Sports", tabOpen: "Free-to-air", tabCable: "Cable",
    rowEspn: "ESPN", rowFox: "Fox Sports", rowFootball: "Football and more",
    heroTitle: "Live TV", heroText: "Sports, Latin American free-to-air TV, movies, documentaries and kids.",
    unknownRef: "That channel is gone.",
    offline: "This channel has no signal right now. Try another in a while.",
    unavailable: "The site is not responding. Try again in a moment.",
    status: "{n} channels",
    statusExtra: "{n} channels ({x} new)",
    testOk: "Signal OK: {name} responds.",
    testOffline: "{name} has no signal right now, but the site responds.",
    refreshNone: "No new channels.",
    refreshAdded: "Added {n} new channels.",
  },
};

function t(key, vars) {
  const lang = String(kino.lang || "").toLowerCase().startsWith("es") ? "es" : "en";
  const tpl = TEXTS[lang][key] || TEXTS.es[key] || key;
  return vars ? tpl.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] != null ? vars[k] : "")) : tpl;
}

// ---- 2. catalog --------------------------------------------------------------------------------------------------

// [slug, canal id the player takes, name, group, logo file]. The canal id is NOT always the slug without hyphens.
const CATALOG = [
  ["bein-sports-xtra", "beinsportsxtra", "Bein Sports Xtra", "deportes", "beinsportsxtra"],
  ["liga-1", "liga1", "Liga 1", "deportes", "liga1"],
  ["liga-1-max", "liga1max", "Liga 1 Max", "deportes", "liga1max"],
  ["tudn", "tudn", "TUDN", "deportes", "tudn"],
  ["sky-sports-la-liga", "skysportslaliga", "Sky Sports La Liga", "deportes", "skysportslaliga"],
  ["fox-sports-premium", "foxsportspremium", "Fox Sports Premium", "deportes", "foxsportspremium"],
  ["tyc-sports", "tycsports", "TyC Sports", "deportes", "tycsports"],
  ["movistar-la-liga", "movistarlaliga", "Movistar La Liga", "deportes", "movistarlaliga"],
  ["movistar-liga-campeones", "movistarligadecampeones", "Movistar Liga de Campeones", "deportes", "movistarligadecampeones"],
  ["directv-sports", "directvsports", "Directv Sports", "deportes", "directvsports"],
  ["directv-sports-2", "directvsports2", "Directv Sports 2", "deportes", "directvsports2"],
  ["directv-sports-plus", "directvsportsplus", "Directv Sports Plus", "deportes", "directvsportsplus"],
  ["espn-premium-latino-america", "espnpremiumlat", "ESPN Premium Usa", "deportes", "espnpremium"],
  ["espn-premium-argentina", "espnpremiumar", "ESPN Premium Argentina", "deportes", "espnpremium"],
  ["espn-colombia", "espn", "ESPN Colombia", "deportes", "espn"],
  ["espn-argentina", "espnar", "ESPN Argentina", "deportes", "espn"],
  ["espn-2", "espn2", "ESPN 2", "deportes", "espn2"],
  ["espn-3", "espn3", "ESPN 3", "deportes", "espn3"],
  ["espn-4", "espn4", "ESPN 4", "deportes", "espn4"],
  ["espn-5", "espn5", "ESPN 5", "deportes", "espn5"],
  ["espn-6", "espn6", "ESPN 6", "deportes", "espn6"],
  ["espn-7", "espn7", "ESPN 7", "deportes", "espn7"],
  ["espn-mexico", "espnmexico", "ESPN Mexico", "deportes", "espnmexico"],
  ["espn-2-mexico", "espn2mexico", "ESPN 2 Mexico", "deportes", "espn2mexico"],
  ["espn-3-mexico", "espn3mexico", "ESPN 3 Mexico", "deportes", "espn3mexico"],
  ["espn-4-mexico", "espn4mexico", "ESPN 4 Mexico", "deportes", "espn4mexico"],
  ["espn-5-mexico", "espn5mexico", "ESPN 5 Mexico", "deportes", "espn5mexico"],
  ["fox-sports", "foxsports", "Fox Sports", "deportes", "foxsports"],
  ["fox-sports-2", "foxsports2", "Fox Sports 2", "deportes", "foxsports2"],
  ["fox-sports-3", "foxsports3", "Fox Sports 3", "deportes", "foxsports3"],
  ["fox-sports-mexico", "foxsportsmexico", "Fox Sports Mexico", "deportes", "foxsportsmx"],
  ["fox-sports-2-mexico", "foxsports2mexico", "Fox Sports 2 Mexico", "deportes", "foxsports2mx"],
  ["fox-sports-3-mexico", "foxsports3mexico", "Fox Sports 3 Mexico", "deportes", "foxsports3mexico"],
  ["telefe", "telefe", "Telefe", "ar", "telefe"],
  ["el-trece", "eltrece", "El Trece", "ar", "eltrece"],
  ["telemundo-51", "telemundo51", "Telemundo 51", "us", "telemundo51"],
  ["telemundo-puerto-rico", "telemundopuertorico", "Telemundo Puerto Rico", "us", "telemundopuertorico"],
  ["univision", "univision", "Univision", "us", "univision"],
  ["pasiones", "pasiones", "Pasiones", "novelas", "pasiones"],
  ["tlnovelas", "tlnovelas", "Tlnovelas", "novelas", "tlnovelas"],
  ["las-estrellas", "lasestrellas", "Las Estrellas", "mx", "lasestrellas"],
  ["antena-3", "antena3", "Antena 3", "intl", "antena3"],
  ["dw-espanol", "dwespanol", "DW Español", "intl", "dwespanol"],
  ["caracol", "caracol", "Caracol", "co", "caracol"],
  ["rcn", "rcn", "RCN", "co", "rcn"],
  ["latina", "latina", "Latina", "pe", "latina"],
  ["america-tv", "americatv", "América TV", "pe", "americatv"],
  ["atv", "atv", "ATV", "pe", "atv"],
  ["unicable", "unicable", "Unicable", "mx", "unicable"],
  ["imagen-tv", "imagentv", "Imagen TV", "mx", "imagentv"],
  ["azteca-7", "azteca7", "Azteca 7", "mx", "azteca7"],
  ["azteca-uno", "aztecauno", "Azteca Uno", "mx", "aztecauno"],
  ["canal-5", "canal5", "Canal 5", "mx", "canal5"],
  ["tnt-novelas", "tntnovelas", "TNT Novelas", "novelas", "tntnovelas"],
  ["disney-channel", "disneychannel", "Disney Channel", "infantil", "disneychannel"],
  ["cartoon-network", "cartoonnetwork", "Cartoon Network", "infantil", "cartoonnetwork"],
  ["tooncast", "tooncast", "Tooncast", "infantil", "tooncast"],
  ["discovery-channel", "discoverychannel", "Discovery Channel", "docs", "discoverychannel"],
  ["id-investigation", "idinvestigation", "ID Investigation", "docs", "idinvestigation"],
  ["discovery-hh", "discoveryhyh", "Discovery H&H", "docs", "discoveryhyh"],
  ["history", "history", "History", "docs", "history"],
  ["history-2", "history2", "History 2", "docs", "history2"],
  ["animal-planet", "animalplanet", "Animal Planet", "docs", "animalplanet"],
  ["nat-geo", "natgeo", "Nat Geo", "docs", "natgeo"],
  ["universal-channel", "universaltv", "Universal Channel", "cine", "universalchannel"],
  ["tnt", "tnt", "TNT", "cine", "tnt"],
  ["tnt-series", "tntseries", "TNT Series", "cine", "tntseries"],
  ["star-channel", "starchannel", "Star Channel", "cine", "starchannel"],
  ["cinemax", "cinemax", "Cinemax", "cine", "cinemax"],
  ["space", "space", "Space", "cine", "space"],
  ["warner-channel", "warnerchannel", "Warner Channel", "cine", "warnerbrostv"],
  ["cinecanal", "cinecanal", "Cinecanal", "cine", "cinecanal"],
  ["fx", "fx", "FX", "cine", "fx"],
  ["axn", "axn", "AXN", "cine", "axn"],
  ["amc", "amc", "AMC", "cine", "amc"],
  ["studio-universal", "studiouniversal", "Studio Universal", "cine", "studiouniversal"],
  ["multipremier", "multipremier", "Multipremier", "cine", "multipremier"],
  ["golden", "golden", "Golden", "cine", "golden"],
  ["golden-plus", "goldenplus", "Golden Plus", "cine", "goldenplus"],
  ["golden-edge", "goldenedge", "Golden Edge", "cine", "goldenedge"],
  ["golden-premier", "goldenpremier", "Golden Premier", "cine", "goldenpremier"],
  ["canal-sony", "canalsony", "Canal Sony", "cine", "canalsony"],
  ["fm-hot-movies", "fmhotmovies", "FM Hot Movies", "cine", "fmhotmovies"],
  ["fm-hot-kids", "fmhotkids", "FM Hot Kids", "infantil", "fmhotkids"],
  ["extrema-tv", "extrematv", "Extrema TV", "cine", "extrematv"],
  ["distrito-comedia", "distritocomedia", "Distrito Comedia", "cine", "distritocomedia"],
  ["venus", "venus", "Venus", "adultos", "venus"],
  ["play-boy", "play-boy", "Play Boy", "adultos", "playboy"],
];

// group id -> text key, Kino genre, country (ISO) of its channels
const GROUPS = [
  { id: "deportes", text: "gDeportes", genre: "deportes" },
  { id: "co", text: "gCo", genre: "entretenimiento", country: "CO" },
  { id: "mx", text: "gMx", genre: "entretenimiento", country: "MX" },
  { id: "pe", text: "gPe", genre: "entretenimiento", country: "PE" },
  { id: "ar", text: "gAr", genre: "entretenimiento", country: "AR" },
  { id: "us", text: "gUs", genre: "entretenimiento", country: "US" },
  { id: "intl", text: "gIntl", genre: "noticias" },
  { id: "novelas", text: "gNovelas", genre: "entretenimiento" },
  { id: "infantil", text: "gInfantil", genre: "infantil" },
  { id: "docs", text: "gDocs", genre: "documentales" },
  { id: "cine", text: "gCine", genre: "peliculas" },
  { id: "adultos", text: "gAdultos", genre: "otros", adult: true },
  { id: "mas", text: "gMas", genre: "otros" },
];
const GROUP = new Map(GROUPS.map((g) => [g.id, g]));

const EXTRA_KEY = "extra:v1";

function extras() {
  try {
    const raw = kino.storage.get(EXTRA_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((r) => Array.isArray(r) && r.length === 5) : [];
  } catch {
    return [];
  }
}

function showAdult() {
  return kino.config.get("showAdult") === true;
}

// Every channel as an object; adult ones only when the person turned them on (Kino still locks them behind 18+).
function channels() {
  const all = CATALOG.concat(extras()).map(([slug, canal, name, group, logo]) => ({
    slug,
    canal,
    name,
    group: GROUP.has(group) ? group : "mas",
    logo: `${BASE}/imge/${logo}.webp`,
    adult: group === "adultos",
  }));
  return showAdult() ? all : all.filter((c) => !c.adult);
}

function inGroup(groupId) {
  return channels().filter((c) => c.group === groupId);
}

// ---- 3. channel shapes -------------------------------------------------------------------------------------------

function liveChannel(c) {
  return { id: c.slug, title: c.name, categoryId: c.group, ref: "ch:" + c.slug, logo: c.logo, ...(c.adult ? { adult: true } : {}) };
}

function liveItem(c) {
  return { id: c.slug, ref: "ch:" + c.slug, title: c.name, kind: "live", poster: c.logo, ...(c.adult ? { adult: true } : {}) };
}

function norm(s) {
  return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();
}

function find(q, within) {
  const needle = norm(q);
  if (needle.length < 2) return [];
  return channels().filter((c) => (!within || c.group === within) && norm(c.name).includes(needle));
}

// ---- 4. live exports (capability: channels) ----------------------------------------------------------------------

export async function liveCategories() {
  const have = new Set(channels().map((c) => c.group));
  return GROUPS.filter((g) => have.has(g.id)).map((g) => ({
    id: g.id,
    title: t(g.text),
    genre: g.genre,
    ...(g.country ? { country: g.country } : {}),
    ...(g.adult ? { adult: true } : {}),
  }));
}

export async function liveChannels({ categoryId }) {
  return { items: inGroup(categoryId).map(liveChannel) };
}

export async function liveSearch({ query }) {
  return { items: find(query, null).slice(0, 100).map(liveChannel) };
}

// ---- 5. browse and search ----------------------------------------------------------------------------------------

export async function browse(ref) {
  return { items: inGroup(String(ref)).map(liveItem) };
}

export async function search(query) {
  const within = query.within ? String(query.within) : null;
  return find(query.q, within && GROUP.has(within) ? within : null).slice(0, 40).map(liveItem);
}

function row(id, title, list, genre) {
  const items = list.slice(0, 20).map(liveItem);
  return items.length ? { id, title, ref: id, items, ...(genre ? { genre } : {}) } : null;
}

export async function home() {
  return ["deportes", "co", "mx", "docs", "infantil"]
    .map((id) => row(id, t(GROUP.get(id).text), inGroup(id), GROUP.get(id).genre))
    .filter(Boolean);
}

// ---- 6. section and categories -----------------------------------------------------------------------------------

const TABS = [
  { id: "sports", text: "tabSports", groups: ["deportes"] },
  { id: "open", text: "tabOpen", groups: ["co", "mx", "pe", "ar", "us", "intl"] },
  { id: "cable", text: "tabCable", groups: ["cine", "docs", "infantil", "novelas"] },
];

export async function section({ tab }) {
  const tabs = TABS.map((x) => ({ id: x.id, label: t(x.text) }));
  const chosen = TABS.find((x) => x.id === tab) || TABS[0];
  const rows = [];
  if (chosen.id === "sports") {
    const sports = inGroup("deportes");
    rows.push(
      row("deportes", t("rowEspn"), sports.filter((c) => /^espn/i.test(c.name)), "deportes"),
      row("deportes", t("rowFox"), sports.filter((c) => /^fox/i.test(c.name)), "deportes"),
      row("deportes", t("rowFootball"), sports.filter((c) => !/^(espn|fox)/i.test(c.name)), "deportes"),
    );
  } else {
    for (const g of chosen.groups) rows.push(row(g, t(GROUP.get(g).text), inGroup(g), GROUP.get(g).genre));
  }
  return {
    tabs,
    tab: chosen.id,
    hero: { title: t("heroTitle"), text: t("heroText") },
    rows: rows.filter(Boolean).map((r, i) => ({ ...r, id: `${chosen.id}-${i}` })),
  };
}

export async function categories() {
  const out = [];
  for (const g of GROUPS) {
    const list = inGroup(g.id);
    if (!list.length) continue;
    out.push({ id: g.id, title: t(g.text), ref: g.id, art: list[0].logo, ...(g.adult ? { adult: true } : {}) });
  }
  return out;
}

// ---- 7. resolve --------------------------------------------------------------------------------------------------

const MANIFEST = /https?:\/\/[^"'\s<]+?\/playlist\/\d+\/index\.m3u8\?token=[0-9a-f]{40}-[0-9a-f]{32}-\d+-\d+/;
const PLAYER = /src="(https:\/\/[^"]+\/stream\.php[^"]+)"/;

async function canalFor(slug) {
  const known = CATALOG.concat(extras()).find((r) => r[0] === slug);
  if (known) return known[1];
  const r = await kino.fetch(`${BASE}/${encodeURIComponent(slug)}-en-vivo-online.php`, { timeoutMs: 12000 });
  const m = r.ok && /live\/core\.php\?canal=([A-Za-z0-9_-]{1,60})"/.exec(r.text());
  if (!m) throw kino.error("not_found", "canal " + slug, { userMessage: t("unknownRef") });
  return m[1];
}

// One source = one of the site's three player skins over the same stream. Returns a Stream, or { offline: true }.
// The player page is ~650 KB and its server answers in 1 s or 30 s for the very same channel, hence the hedging below.
async function viaSource(canal, source, playerTimeoutMs) {
  const dir = source === "1" ? "live" : "live" + source;
  const core = await kino.fetch(`${BASE}/${dir}/core.php?canal=${encodeURIComponent(canal)}`, {
    headers: { Referer: BASE + "/" },
    timeoutMs: 8000,
  });
  const player = core.ok && PLAYER.exec(core.text());
  if (!player) throw kino.error("unavailable", "core " + core.status, { userMessage: t("unavailable") });
  const page = await kino.fetch(player[1].replace(/&amp;/g, "&"), { timeoutMs: playerTimeoutMs });
  const found = page.ok && MANIFEST.exec(page.text().replace(/\\\//g, "/"));
  if (!found) throw kino.error("unavailable", "stream " + page.status, { userMessage: t("unavailable") });
  const url = found[0];
  let status = 200;
  try {
    status = (await kino.fetch(url, { timeoutMs: 3500 })).status;
  } catch {
    // The manifest check only tells "offline" apart: if it cannot answer, let the player try.
  }
  if (status === 404) return { offline: true };
  if (status >= 400) throw kino.error("unavailable", "manifest " + status, { userMessage: t("unavailable") });
  return { url, mime: "application/vnd.apple.mpegurl", expiresInSeconds: 5 * 3600 };
}

// The first promise to succeed wins; rejects with the last error when every one fails.
function firstOk(promises) {
  return new Promise((resolveFirst, rejectAll) => {
    let failed = 0;
    for (const p of promises) {
      p.then(resolveFirst, (e) => {
        failed += 1;
        if (failed === promises.length) rejectAll(e);
      });
    }
  });
}

export async function resolve(ref) {
  const m = /^ch:([a-z0-9-]{1,80})$/.exec(String(ref));
  if (!m) throw kino.error("not_found", "ref", { userMessage: t("unknownRef") });
  const canal = await canalFor(m[1]);
  const preferred = String(kino.config.get("source") || "1");
  const others = ["1", "2", "3"].filter((s) => s !== preferred);
  const lead = viaSource(canal, preferred, 12000);
  lead.catch(() => {});
  const early = await Promise.race([
    lead.then((v) => ({ v }), () => ({ failed: true })),
    kino.sleep(2500).then(() => null),
  ]);
  const out = early && early.v
    ? early.v
    : await firstOk([lead, ...others.map((s) => viaSource(canal, s, 10500))]);
  if (out.offline) throw kino.error("unavailable", "offline " + canal, { userMessage: t("offline") });
  return out;
}

// ---- 8. settings -------------------------------------------------------------------------------------------------

export async function settingsStatus() {
  const n = CATALOG.length;
  const x = extras().length;
  return { siteStatus: x ? t("statusExtra", { n: n + x, x }) : t("status", { n }) };
}

// Adds channels the site lists and the bundled catalog does not (their player id is read from their own page).
async function refreshCatalog() {
  const home = await kino.fetch(BASE + "/", { timeoutMs: 25000 });
  if (!home.ok) throw kino.error("unavailable", "home " + home.status, { userMessage: t("unavailable") });
  const html = home.text();
  const have = new Set(CATALOG.concat(extras()).map((r) => r[0]));
  const re = /<a\s+class="channel"\s+href="https:\/\/www\.tvenvivo\.org\/([a-z0-9-]+)-en-vivo-online\.php"\s+data-category="([^"]+)"[\s\S]*?<img\s+src="imge\/([A-Za-z0-9_-]+)\.webp"[\s\S]*?channel-name">\s*([^<]*?)\s*<\/div>/g;
  const added = [];
  let m;
  while ((m = re.exec(html)) && added.length < 12) {
    if (have.has(m[1])) continue;
    try {
      const canal = await canalFor(m[1]);
      added.push([m[1], canal, m[4].replace(/&amp;/g, "&").slice(0, 80), m[2] === "Deportes" ? "deportes" : "mas", m[3]]);
    } catch (e) {
      kino.log("new channel skipped: " + m[1]);
    }
  }
  if (added.length) kino.storage.set(EXTRA_KEY, JSON.stringify(extras().concat(added)));
  return added.length;
}

export async function action(key) {
  if (key === "refreshCatalog") {
    const n = await refreshCatalog();
    return { message: n ? t("refreshAdded", { n }) : t("refreshNone") };
  }
  if (key !== "testChannel") return null;
  const sample = CATALOG.find((r) => r[0] === "caracol") || CATALOG[0];
  const out = await viaSource(sample[1], String(kino.config.get("source") || "1"));
  return { message: out.offline ? t("testOffline", { name: sample[2] }) : t("testOk", { name: sample[2] }) };
}
