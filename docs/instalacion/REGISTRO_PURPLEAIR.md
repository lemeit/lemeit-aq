# Registro de altas PurpleAir y fechas de instalación

Actualización documental: 29/10/2026. Fuente: transcripción de correos de confirmación de PurpleAir aportada por el titular en esta conversación. No se archivan correos completos ni claves de lectura.

## Dos fechas distintas

- **Alta en PurpleAir:** registro del equipo en la plataforma del proveedor. Va en Observaciones de la mini guía junto con sensor index, Device ID y coordenadas declaradas en ese registro.
- **Instalación física en el lugar seleccionado:** fecha efectiva de montaje en la escuela. Se completa por separado en «Fecha de instalación». No se deduce del alta, de un primer dato, de una prueba de conectividad ni de la fecha de impresión.

No se escriben ni migran valores de `fecha_instalacion` en D1. Registrar una fecha del proveedor en documentación no acredita que esa fecha exista en la base.

## Datos confirmados por los correos aportados

| Código | Sensor index | Device ID | Alta PurpleAir | Latitud declarada | Longitud declarada |
| --- | --- | --- | --- | --- | --- |
| AE-00 | 198617 | `c8:c9:a3:f:93:af` | 28/11/2023 (inicial) | -35.66630 (registro escolar 2024) | -59.80716 (registro escolar 2024) |
| AE-01 | 298687 | `ec:64:c9:cb:9f:3` | 05/10/2026 | -35.43677574362913 | -60.168800362812966 |
| AE-02 | 298701 | `f0:24:f9:c2:cf:2d` | 05/10/2026 | -35.63495676824009 | -59.7735131464144 |
| AE-03 | 298691 | `fc:f5:c4:ae:ca:d6` | 28/10/2026 | -35.640825 | -59.778565 |

Los correos de AE-01, AE-02, AE-03 y la actualización AE-00 de 2026 registran equipos como exteriores (`Outside`), públicos (`Public`), con intervalo de envío del proveedor por defecto (~90 s). Este intervalo no es la frecuencia de ingesta de LEMEIT ni modifica sus disparadores.

Los correos informan que el equipo estaba online y transmitía **al momento del envío**; no acreditan conectividad actual, montaje físico ni ubicación definitiva. Las coordenadas anteriores son las declaradas al registrar el equipo, no una constatación de campo. Conservar todos sus decimales al transcribir.

AE-01 y AE-02: los correos muestran lunes 5 de octubre; el año 2026 se contextualiza con la campaña y documentación del proyecto. Horas visibles: AE-01 23:25; AE-02 confirmación completa 23:46 (también figura una notificación a las 23:41). AE-03: 28/10/2026, 22:35. No se asigna zona horaria al encabezado de Gmail sin evidencia adicional.

La wiki mostraba 06/10/2026 como «Alta» de AE-01 y AE-02 sin distinguir el evento: el registro PurpleAir respaldado por los correos es **05/10/2026**. No se transforma el 06/10 en fecha de instalación física por inferencia.

## Historial AE-00: mismo equipo, distintos lugares

- **28/11/2023, 19:06 según el correo:** primera configuración como `saladillo_home`. Se identifica el hardware por MAC/Device ID `c8:c9:a3:f:93:af`. Ese correo no muestra sensor index; se vincula al registro posterior por la identidad física, no se inventa un índice histórico.
- **03/12/2024, 15:34 según el correo:** confirmación de registro como `Madre Teresa High School`, sensor index **198617**, mismo Device ID. Coordenadas de ese registro escolar: **-35.66630, -59.80716**. El titular confirma que antes estuvo más de un año en su domicilio y después lo trasladó a la escuela; el intervalo entre ambos correos no prueba continuidad de funcionamiento.
- **29/10/2026, 12:27 según el correo aportado:** nueva confirmación de **registro escolar en PurpleAir** con nombre `AE-00 | app.lemeit.ar`, mismo sensor index **198617** y Device ID `c8:c9:a3:f:93:af`. Coordenadas declaradas: **-35.6663, -59.80716**, numéricamente iguales a las del registro escolar de 2024; elevación declarada **42.3987 m**. Exterior, público, intervalo de envío por defecto (~90 s). El correo declara transmisión al momento de envío. Es un cambio de nombre/actualización de registro, no una nueva alta inicial ni una fecha de instalación física. El enlace del nombre apunta a `app.lemeit.ar` (portal general); la dirección específica de Aire Escolar es `https://app.lemeit.ar/aq/`.
- **Situación física confirmada por el titular el 29/10/2026:** AE-00 permanece en su domicilio; todavía no fue llevado al lugar escolar seleccionado para esta instalación/reubicación. Las coordenadas escolares son las declaradas en PurpleAir y no representan la ubicación física actual del equipo.
- **Instalación/reubicación futura en el lugar seleccionado:** fecha pendiente. El 03/12/2024 acredita una confirmación de registro/configuración escolar y no se impone como fecha exacta de montaje físico. AE-00 conserva su identidad al cambiar de institución o ubicación.

Las coordenadas del domicilio particular, contactos personales, claves de lectura y enlaces con parámetros de acceso de los correos quedan excluidos de esta documentación pública y de las guías. Se documentan las coordenadas escolares declaradas en 2024 y confirmadas de nuevo en el registro del 29/10/2026; no acreditan montaje físico ni constatación de campo. Los correos no detallan el modelo de AE-00; la captura posterior de su tarjeta PurpleAir aportada por el titular muestra **PA-II-FLEX**. Las guías usan ese modelo con dicha evidencia.

## Mini guías

Se mantienen diseño original y diez campos editables. Los códigos de la etiqueta superior, portal y ficha son editables por separado. Observaciones ocupa dos líneas: identificación del equipo y, debajo, alta PurpleAir más coordenadas de registro. Fecha de instalación se deja sin fecha concreta; el formato en blanco para completar no acredita instalación.

La versión imprimible conserva el pie negro en negrita. La tabla AQI heredada se conserva por fidelidad al original y es histórica; no corresponde al primer tramo actual descrito en [trazabilidad AQI](../AQI_TRAZABILIDAD.md). No usar esta incorporación documental como validación de sus indicaciones escolares.

- [AE-01 - Digital Color](Mini%20Guia%20AE-01%20-%20Lola%20Mora%20-%20Digital%20Color.pdf).
- [AE-01 - Impresion](Mini%20Guia%20AE-01%20-%20Lola%20Mora%20-%20Impresion.pdf).
- [AE-02 - Digital Color](Mini%20Guia%20AE-02%20-%20Manuel%20Pardal%20-%20Digital%20Color.pdf).
- [AE-02 - Impresion](Mini%20Guia%20AE-02%20-%20Manuel%20Pardal%20-%20Impresion.pdf).
- [AE-03 - Digital Color](Mini%20Guia%20AE-03%20-%20Instituto%20Nino%20Jesus%20-%20Digital%20Color.pdf).
- [AE-03 - Impresion](Mini%20Guia%20AE-03%20-%20Instituto%20Nino%20Jesus%20-%20Impresion.pdf).

- [AE-00 - Digital Color](Mini%20Guia%20AE-00%20-%20Madre%20Teresa%20-%20Digital%20Color.pdf).

- [AE-00 - Impresion](Mini%20Guia%20AE-00%20-%20Madre%20Teresa%20-%20Impresion.pdf).

## Verificación de esta actualización

Defecto reproducido: la wiki confundía alta e instalación (columna «Installed» y referencia de alta a `fecha_instalacion`), fechaba AE-01/AE-02 el 06/10 y no conservaba las coordenadas de los correos. Los originales de las guías tampoco tenían los códigos superiores editables.

Aceptación: fechas y coordenadas coinciden con la evidencia transcrita; no se trasladan altas a instalación física; las ocho guías muestran los datos completos en Observaciones y conservan diez campos editables; códigos en cabecera, portal y ficha aceptan cambios y los guardan. Se abren y renderizan ocho páginas para revisión visual. Se comprueban enlaces y se conserva el pie imprimible en negro. Se excluyen correos completos y claves.

Base AQ consultada: `2b3032976e49c5e75f2f4153f6803c522af3ecff`, 19 commits por delante y ninguno por detrás de la auditoría `c03d7d0dca68772f3d1ea3312d797fe48f038f9c`. Fuentes wiki consultadas en `57b20ff55445d14e4beaea1c1447337049a27187`. No se modifican código, D1, secretos ni disparadores. Los commits llevan `[CF-Pages-Skip]`; no se fusiona ni publica el sitio. Descartar las ramas revierte la propuesta documental.

## Mantenimiento y privacidad

Usar este registro como fuente de las fechas del proveedor; [inventario](../INVENTARIO_ESTACIONES.md), README y wiki remiten aquí. Nuevos datos requieren fuente y evento identificado. No incorporar claves de lectura, tokens, contraseñas, contactos privados ni correos completos a Git o PDF.

Mantener únicamente dos guías por sensor: Digital Color e Impresion, con nombres fijos y sin sufijos de versión. Las revisiones sustituyen esas copias; Git conserva el historial. Antes de actualizar una guía completada, conservar los valores ya cargados por la escuela. Se retiran las copias antiguas por instrucción explícita del titular.
