# Novatek Argentina — Rediseño UI · Edición Mundial 2026

Documentación del rediseño completo del sitio. Tema: **fútbol / Mundial 2026** aplicado a la marca
Novatek (herrajes y accesorios para aluminio), basado en los colores y patrones de las 4 piezas gráficas
de campaña.

---

## 1. Sistema de diseño

### Paleta (extraída de los gráficos Mundial 2026)
| Token | Hex | Uso |
|-------|-----|-----|
| `navy` (DEFAULT/900) | `#0A1628` | Fondo principal |
| `navy-950` | `#060D18` | Fondos profundos / footer |
| `navy-800` | `#0D1B2E` | Secciones alternas / cards |
| `navy-700/600/500` | `#102339` … `#1E3F66` | Bordes, capas |
| `brand` (naranja) | `#F26A1B` | Acento de marca, CTAs, highlights |
| `brand-400` | `#FF8038` | Hover / detalles |
| `celeste` | `#74ACDF` | Acento argentino (glows sutiles) |
| `gold` | `#E9B949` | Acento "copa" |

Gradientes utilitarios (Tailwind): `bg-navy-gradient`, `bg-orange-gradient`, `bg-pitch-glow`.

### Tipografía
- **Display:** `Anton` (condensada, mayúsculas) → titulares grandes. Clase `font-display`.
- **Texto:** `Inter` → cuerpo. Clase `font-sans`.
- Cargadas desde Google Fonts de forma **no bloqueante** en `Layout.astro`.

### Motivos visuales
- **"///"** → tres barras inclinadas naranjas (clase `.slashes`). Aparece antes de cada eyebrow.
- **`.field-lines`** → patrón de líneas tipo cancha (grilla sutil).
- **Marca "N"** → recreada como SVG nítido en `src/components/site/BrandMark.astro`.
- **Reveal on scroll** → elementos con `data-reveal` (con fallback sin JS vía clase `.js`).
- Animaciones: `animate-marquee`, `animate-floaty`, `animate-pulse-ring`, `animate-ping`.

Todo configurado en [`tailwind.config.mjs`](tailwind.config.mjs).

---

## 2. Estructura de archivos nuevos

```
src/
├─ layouts/
│  ├─ Layout.astro          # Shell base (fuentes, estilos globales, theme, reveal script)
│  └─ SiteLayout.astro      # Navbar + <slot/> + Footer + FloatingActions
├─ components/site/
│  ├─ BrandMark.astro       # Logo "N" en SVG
│  ├─ Navbar.astro          # Header sticky + menú móvil (vanilla JS)
│  ├─ Footer.astro          # Footer con contacto real + CTA strip
│  └─ FloatingActions.astro # FAB WhatsApp + botón volver arriba
└─ pages/
   ├─ index.astro           # Home (9 secciones)
   ├─ catalogo.astro        # Categorías + kits + marcas
   ├─ nosotros.astro        # ¿Quién dirige tu proyecto? + diferenciales
   ├─ contacto.astro        # Form → WhatsApp + datos
   └─ novedades.astro       # Teaser "Algo grande está por llegar" + countdown
```

> El panel `/admin` sigue usando el `Layout` base (sin navbar/footer de marketing). Los componentes
> React antiguos (`Header.tsx`, `Hero.tsx`, `Footer.tsx`, `Features.tsx`, `FeaturedProducts.tsx`) quedaron
> sin uso y pueden borrarse en una limpieza posterior.

### Páginas marcadas como `prerender = true`
Las 5 páginas públicas son estáticas → mejor rendimiento y SEO. Las rutas `/api/*` y `/admin` siguen
siendo server-side.

---

## 3. Mapa de imágenes (qué se usa y dónde)

Todas las imágenes viven en `public/` (Astro solo sirve desde ahí).

### `public/img/` — del sitio original ([scrape](sitio-original-scrape/))
| Archivo | Dónde se usa |
|---------|--------------|
| `categoria-{escuadras,manijas,bisagras,cierres-laterales,fallebas,oscilobatientes,elevables}.png` | Home "El plantel completo" + Catálogo |
| `galeria-1..6.png` | Home + Catálogo "Kits y soluciones" (son banners ya con marca navy/naranja) |
| `marca-1..5.png` | Marcas: Roto, Fapim, Monticelli, Comunello, Giesse |
| `nosotros-quienes-somos.png` | Nosotros — foto arquitectónica |
| `nosotros-diferencia-1..3.png` | Nosotros — galería diferenciales |
| `logo-novatek.jpeg`, `home-nosotros-icono.png`, `cta-footer.png` | Disponibles (no usados en el layout final) |

### `public/mundial/` — las 4 piezas de campaña Mundial 2026
| Archivo | Dónde se usa |
|---------|--------------|
| `equipo-ganador.jpeg` | **Hero home** (marco inclinado) |
| `dirige-obra.jpeg` | Home — sección "En el fútbol hay un DT" |
| `dirige-bandera.jpeg` | **Hero Nosotros** |
| `levanta-copa.jpeg` | Home — "¿Quién levanta la copa?" |
| (las 4) | Home — sección "Rumbo al Mundial 2026" |

### `public/novedades-teaser/` — las 4 piezas de expectativa
| Archivo | Dónde se usa |
|---------|--------------|
| `algo-grande.jpeg` | Home — teaser de novedades |
| `incorporacion.jpeg` | **Hero Novedades** (caja misteriosa) |
| `algo-grande / espera-vale / calidad-evoluciona / incorporacion` | Novedades — galería "Las pistas" |

> Las carpetas originales `public/nuevosmodelosbase/` y `public/novedades/` se conservan intactas;
> en `mundial/` y `novedades-teaser/` hay copias con nombres limpios (sin espacios) para las URLs.

---

## 4. Sección Novedades (generar expectativa)

Campaña teaser sobre **una gran alianza / incorporación que se viene**. Contenido derivado de las 4 piezas:
- *Algo grande está por llegar* · *La espera vale la pena* · *La calidad evoluciona* · *Más que una incorporación*
- Pilares: **Más tecnología · Más respaldo · Más oportunidades**
- **Countdown en vivo** hasta la fecha de lanzamiento.

### ✏️ Editar la fecha del countdown
En [`src/pages/novedades.astro`](src/pages/novedades.astro), constante `TARGET`:
```js
const TARGET = '2026-07-31T12:00:00-03:00';
```
Cuando la fecha pasa, el contador muestra "¡YA LLEGÓ! 🎉" automáticamente.

---

## 5. Datos de contacto (centralizados)

- **WhatsApp:** `https://wa.link/fo0jrt` (constante `WA` en cada página) · número directo `541179402001`
- **Teléfono:** +54 11 7940 2001
- **Email:** administracion@novatekargentina.com.ar
- **Horario:** Lunes a Viernes, 08:00 a 17:00 h
- **Zona:** Provincia de Buenos Aires

El formulario de contacto **no usa backend**: arma el mensaje y abre WhatsApp (`wa.me`).

---

## 6. Cómo correr / construir

```bash
npm install
npm run dev        # desarrollo → http://localhost:4321
npm run build      # build de producción (Vercel)
```

Las páginas públicas se prerenderizan a HTML estático en `.vercel/output/static/`.

---

## 7. Fuente de verdad del contenido original
Todo el contenido scrapeado del sitio en línea está en
[`sitio-original-scrape/contenido-sitio-original.md`](sitio-original-scrape/contenido-sitio-original.md)
con las imágenes en `sitio-original-scrape/imagenes/`.
