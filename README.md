# TV en Vivo

![TV en Vivo](icon.png)

Canales de TV en vivo de [tvenvivo.org](https://www.tvenvivo.org) dentro de [Kino](https://github.com/kinotvapp/kino-light): deportes, TV abierta de Latinoamérica, cine, documentales e infantil.

Live TV channels from tvenvivo.org inside Kino: sports, Latin American free-to-air TV, movies, documentaries and kids.

## Qué trae

- 88 canales en la pestaña **En vivo**, con filtros por categoría y género.
- Una sección propia (**TV en Vivo**) con pestañas Deportes, TV abierta y Cable, y filas en Inicio.
- Categorías, búsqueda dentro del plugin y dentro de "Ver más".
- Ajustes: mostrar canales para adultos (siguen tras el código 18+), opción de reproducción preferida, probar la señal y buscar canales nuevos.
- Textos en español e inglés.

## Cómo reproduce

Dos peticiones HTTP, sin WebView: `core.php?canal=<id>` (con el sitio como `Referer`) entrega el reproductor firmado, y su página trae el manifiesto HLS con token. Si la primera opción tarda, se prueban las otras dos en paralelo. Un canal sin señal responde "fuera del aire".

## Desarrollo

Con el kit de plugins de Kino (carpeta `sdk/`, Node 18 o superior):

```
node sdk/validate.mjs ./tvenvivo
node sdk/run.mjs ./tvenvivo liveCategories
node sdk/run.mjs ./tvenvivo resolve ch:caracol
```

## Publicar

El repositorio debe llamarse `kino-plugin-tvenvivo` y llevar el topic **`kino-plugin`** (así lo encuentra la búsqueda de plugins de la comunidad) y esta descripción:

> Canales de TV en vivo de tvenvivo.org dentro de Kino: deportes, TV abierta, cine, documentales e infantil.

Aviso: el sitio revende señales de terceros; este plugin solo las abre, no las aloja.
