<#
  Consulta rapida por consola de cuanto consumo de la API de PurpleAir llevamos
  (puntos restantes, tasa de consumo), sin entrar a develop.purpleair.com.
  Pega directo contra la API de PurpleAir (no pasa por nuestro Worker), usando
  el endpoint GET /v1/organization.

  Importante: esta consulta NO gasta puntos de la cuota — PurpleAir la marca
  explicitamente como "a free API call, so query it as you need" (confirmado
  por el staff de PurpleAir en su foro de API, abril 2026). Se puede correr
  las veces que haga falta sin preocuparse por el consumo.

  Requiere la misma PURPLEAIR_API_KEY que se cargo con `wrangler secret put
  PURPLEAIR_API_KEY` (la de lectura de develop.purpleair.com) — Cloudflare no
  permite volver a leer ese secret una vez guardado, asi que hace falta tener
  el valor guardado aparte (gestor de contraseñas, notas, etc.).

  Uso:
    .\ver-uso-purpleair.ps1

  La clave se puede pasar con -Key, o dejarla puesta una vez en la sesion de
  PowerShell asi no la volves a tipear:
    $env:PA_API_KEY = "tu_clave_real"
  (esto dura solo mientras esa ventana de PowerShell este abierta)
#>
param(
    [string]$Key = $env:PA_API_KEY
)

if (-not $Key) {
    $secure = Read-Host "PurpleAir API key (de lectura)" -AsSecureString
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    $Key = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
}

$headers = @{ "X-API-Key" = $Key }

try {
    $resp = Invoke-RestMethod -Uri "https://api.purpleair.com/v1/organization" -Headers $headers -ErrorAction Stop
} catch {
    Write-Host "Error consultando la API de PurpleAir: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Uso de la API de PurpleAir:" -ForegroundColor Cyan
$resp | Format-List *
