# Publicación estática de FIFACON

El editor mantiene el borrador. Guardar no modifica GitHub Pages.

## Configuración inicial
En Settings → Pages del repositorio, elegir Source: GitHub Actions.

## Publicar
1. Editar y guardar en el sitio de ChatGPT.
2. Pulsar Preparar publicación. Esa copia pasa a ser pública para la exportación.
3. Abrir Publicar en GitHub y elegir Run workflow → Run workflow.
4. Esperar el resultado verde y abrir el enlace del deployment.

La versión preparada queda congelada: guardar nuevos borradores no la cambia.
El workflow descarga contenido e imágenes y empaqueta JS, CSS y fuentes matemáticas.
La web pública no consulta ChatGPT, no contiene controles de edición ni credenciales.
Si el build falla, la versión pública anterior permanece. El registro de Actions indica la causa.
La conexión disponible no admite disparar Actions directamente desde el editor.

El editor y su API de borradores requieren una cuenta autorizada. Sólo la copia preparada y sus imágenes son públicas.
