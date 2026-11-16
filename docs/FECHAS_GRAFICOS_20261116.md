# Fechas discretas en las gráficas (16/11/2026)

## Reproducción
En la pestaña «Gráfico», al seleccionar 7 días, el eje X muestra solo horas; no se identifica el día al cruzar medianoche. Los tooltips también mostraban únicamente la hora. Captura proporcionada en la conversación.

## Cambio
- El eje X de los gráficos Histórico y Comparar sitios mantiene las horas; la primera marca visible y las marcas que cambian de fecha respecto de la anterior muestran además DD/MM en una segunda línea.
- Los tooltips de Histórico, Comparar sitios y minigráficos muestran fecha completa y hora en Buenos Aires.
- Los minigráficos mantienen un eje simple de horas para evitar saturación.
- Se conserva el eje numérico lineal, los límites y controles de zoom/pan, los datasets, la leyenda, las bandas AQI y los filtros.
- No se modifican registros, timestamps almacenados, backend, D1 ni ingesta.

## Criterios de aceptación
1. Con un rango de 24 horas que cruza medianoche, el primer tick y el primer tick de cada día nuevo indican DD/MM; el resto muestra la hora.
2. Con 7 y 30 días, las fechas aparecen solo en ticks seleccionados por Chart.js; no en cada medición.
3. Los tooltips muestran DD/MM/AAAA y HH:mm para la medición exacta en horario America/Argentina/Buenos_Aires.
4. Funciona igual en modo Comparar sitios y los tooltips de tarjetas.
5. Zoom por arrastre, rueda, pellizco y pan con Ctrl, restablecer zoom, cambios de parámetros y bandas AQI sin regresiones.
6. Verificar en móvil y escritorio, con temas claro y oscuro, incluidos datos que cruzan fin de año.

## Verificación y reversión
Revisión estática del cambio realizada; pruebas visuales y ejecución en navegador **pendientes**. Revertir el commit del frontend si se detecta una regresión. No fusionar ni desplegar antes de validar.
