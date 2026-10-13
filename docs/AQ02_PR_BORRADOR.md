# AQ-02: reservar identidad AirGradient sin colisiones ni fallback location

El MAX+1 separado permite que seriales distintos reciban el mismo ID y mezclen
historial. La reserva ahora ocurre en un INSERT SELECT, con UNIQUE de serial
AirGradient; el mismo serial converge y seriales distintos quedan separados.
IDs e historial existentes se conservan. Sin serial físico se informa error,
sin usar locationId, que puede repetirse entre cuentas o cambiar de hardware.

La migración 009 agrega restricciones sin modificar datos; duplicados requieren
reconciliación independiente. Triggers rechazan reutilización de IDs entre
proveedores, incluido el camino Python. Requiere aprobar y aplicar migración
antes de desplegar el Worker. No es saneamiento retroactivo de historial mezclado.

Validación offline: main reproduce los tres defectos AQ-02; rama pasa 35 pruebas
de integridad (10 de aceptación AQ-02), 12 AQ-01, 47 healthcheck, Python y sintaxis.
Fixtures sintéticos, HTTP bloqueado; sin binding D1 remoto. Ver AQ02_CORRECCION.md
y AQ02_ACEPTACION.tap para evidencia, límites, orden operativo y reversión.

Base: 8638fe671c9590c3715fca496ed562035637ee82, PR #10 fusionado. GitHub Pages check
informa success para esa base; acceso Cloudflare real a la cuenta del proyecto
falla con Authentication error. Worker desplegado pendiente de verificar directamente.

El titular confirmó que guardó la exclusión exacta de previews para
`fix/aq-02-airgradient-identity` y aportó captura que la muestra en Exclude Preview
branches. Condición acreditada por el usuario; no mediante API Cloudflare.
Se publica rama y PR para revisión. Sin merge, migración D1, ingesta ni despliegue.
