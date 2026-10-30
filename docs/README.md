# Documentación técnica — Aire Saladillo

## Regla e interfaz

- [Círculos y colores AQI](CIRCULOS_AQI_MAPA.md): corrección vigente del esquema visual; una geometría común, colores de tarjetas, neutro/gris, capturas y pruebas Leaflet reales. [PR #24 fusionado y desplegado](https://github.com/lemeit/lemeit-aq/pull/24), con Pages success y HTML estático verificados; evidencia en el informe.
- [Marcadores #23](MARCADORES_MAPA.md): registro histórico de formas/acento, fusionado y luego sustituido por decisión explícita del titular.

- [Frescura AQ-09](FRESCURA_SENSORES.md): regla ≤25 min, datos antiguos/inválidos/futuros, mapa/tarjetas, reproducción, aceptación, pruebas offline, autorización y exclusión de previews. [PR #22 fusionado](https://github.com/lemeit/lemeit-aq/pull/22) en d76c687; no equivale a validación de sensores productivos.
- [Orden de tarjetas #21](ORDEN_TARJETAS.md): integrado en main; AE ascendente y proveedores conservados.
- [Trazabilidad AQI](AQI_TRAZABILIDAD.md): fórmula, unidades y origen; corte histórico con nota de seguimiento temporal AQ-09.
- [Aclaración de última medición](ACLARACION_ULTIMA_MEDICION.md): registro histórico del texto y pruebas anteriores.

## Operación y estado

- [Plan de mejoras y registro de avance](PLAN_MEJORAS.md): distinguir propuestas, código integrado y verificación productiva.
- [Inventario](INVENTARIO_ESTACIONES.md): evidencia del corte indicado, sin inferir conectividad actual.
- [Alta PurpleAir y operación segura](OPERACION_PURPLEAIR.md): permisos, versiones, visitas y reversión; falta de señal no es baja administrativa.
- [Diagnóstico offline y alcance](HEALTHCHECK.md): API/frescura productiva siguen omitidas por escrituras de visitas.
- [Identidad AirGradient](AQ02_CORRECCION.md), [validación local](AQ02_VALIDACION_LOCAL_D1.md) y [plan operativo](AQ02_PLAN_DESPLIEGUE.md).

## Auditorías históricas

- [Auditoría técnica inicial](AUDITORIA_TECNICA.md), commit c03d7d0.
- [Integridad de datos](AUDITORIA_INTEGRIDAD_DATOS.md), corte de octubre.

Sus hallazgos y TAP se conservan como evidencia del momento auditado. Las notas
de seguimiento enlazan las correcciones posteriores; una prueba offline PASS
no certifica producción. AQ-09 no cierra AQ-04, DAT-02 backend ni otras tareas.
