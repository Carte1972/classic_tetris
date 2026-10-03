# Servidor local de ТЕТРИС para el lanzador de Windows: sirve el juego en http://localhost
# y guarda el ranking en un archivo JSON (records.json), de modo que los récords se
# conservan en el disco entre sesiones. Usa HttpListener de .NET (viene con Windows).
#
# Uso: powershell -NoProfile -ExecutionPolicy Bypass -File records_server.ps1
#        -GameDir <carpeta del juego> -RecordsFile <archivo de récords> [-Port N] [-OpenBrowser]
#
# Rutas: GET / sirve index.html; GET /api/records devuelve el ranking (o [] si aún no hay);
# PUT /api/records lo guarda. HttpListener solo acepta peticiones dirigidas a localhost,
# así que ninguna web de fuera puede escribir en el disco.
# El archivo va en UTF-8 con BOM para que Windows PowerShell 5.1 lea bien las tildes.
param(
  [Parameter(Mandatory = $true)][string]$GameDir,
  [Parameter(Mandatory = $true)][string]$RecordsFile,
  [int]$Port = 0,
  [switch]$OpenBrowser
)

$ErrorActionPreference = 'Stop'

# Primer puerto que se prueba y cuántos se intentan si están ocupados.
$FirstPort = 47321
$PortAttempts = 10

# Tamaño máximo del ranking que se acepta: ocupa unos 1,5 KB.
$MaxBodyBytes = 65536

$Utf8 = New-Object System.Text.UTF8Encoding($false)
$IndexFile = Join-Path $GameDir 'index.html'

# Envía una respuesta con un cuerpo de bytes.
function Send-Bytes($Response, [int]$Status, [string]$Type, [byte[]]$Body) {
  $Response.StatusCode = $Status
  $Response.ContentType = $Type
  $Response.ContentLength64 = $Body.Length
  $Response.OutputStream.Write($Body, 0, $Body.Length)
}

# Envía una respuesta de texto.
function Send-Text($Response, [int]$Status, [string]$Message) {
  Send-Bytes $Response $Status 'text/plain; charset=utf-8' ($Utf8.GetBytes("$Message`n"))
}

# Indica si un texto tiene pinta de lista JSON (el juego valida cada récord al leerlo).
function Test-JsonArray([string]$Text) {
  $trimmed = $Text.Trim()
  return $trimmed.StartsWith('[') -and $trimmed.EndsWith(']')
}

# Atiende una petición.
function Invoke-Request($Request, $Response) {
  $path = $Request.Url.AbsolutePath
  $method = $Request.HttpMethod
  if ($path -eq '/' -or $path -eq '/index.html') {
    if ($method -ne 'GET') { Send-Text $Response 405 'Método no admitido.'; return }
    if (-not (Test-Path -LiteralPath $IndexFile)) { Send-Text $Response 404 "No se encuentra $IndexFile."; return }
    Send-Bytes $Response 200 'text/html; charset=utf-8' ([System.IO.File]::ReadAllBytes($IndexFile))
    return
  }
  if ($path -eq '/api/records') {
    if ($method -eq 'GET') {
      $body = "[]`n"
      if (Test-Path -LiteralPath $RecordsFile) {
        $stored = [System.IO.File]::ReadAllText($RecordsFile, $Utf8)
        if (Test-JsonArray $stored) { $body = $stored }
      }
      Send-Bytes $Response 200 'application/json; charset=utf-8' ($Utf8.GetBytes($body))
      return
    }
    if ($method -eq 'PUT') {
      if (-not ("$($Request.ContentType)" -like 'application/json*')) {
        Send-Text $Response 415 'El ranking se envía como JSON.'; return
      }
      if ($Request.ContentLength64 -gt $MaxBodyBytes) {
        Send-Text $Response 413 'Petición demasiado grande.'; return
      }
      $reader = New-Object System.IO.StreamReader($Request.InputStream, $Utf8)
      $text = $reader.ReadToEnd()
      $reader.Close()
      if (-not (Test-JsonArray $text)) { Send-Text $Response 400 'El ranking debe ser una lista JSON.'; return }
      # Escritura atómica: primero en un temporal y luego se renombra.
      $temporary = "$RecordsFile.tmp"
      [System.IO.File]::WriteAllText($temporary, $text, $Utf8)
      Move-Item -LiteralPath $temporary -Destination $RecordsFile -Force
      $Response.StatusCode = 204
      return
    }
    Send-Text $Response 405 'Método no admitido.'
    return
  }
  Send-Text $Response 404 'No existe.'
}

$candidates = if ($Port -gt 0) { @($Port) } else { $FirstPort..($FirstPort + $PortAttempts - 1) }
$listener = $null
foreach ($candidate in $candidates) {
  $attempt = New-Object System.Net.HttpListener
  $attempt.Prefixes.Add("http://localhost:$candidate/")
  try {
    $attempt.Start()
    $listener = $attempt
    $Port = $candidate
    break
  } catch {
    $attempt.Close()
  }
}
if ($null -eq $listener) {
  [Console]::Error.WriteLine('No se ha podido abrir el servidor local: los puertos están ocupados.')
  exit 1
}

$url = "http://localhost:$Port/"
Write-Host "El juego se está jugando en $url"
Write-Host "Los récords se guardan en $RecordsFile"
Write-Host 'Para terminar, cierra esta ventana.'
if ($OpenBrowser) { Start-Process $url }

while ($listener.IsListening) {
  $context = $listener.GetContext()
  $response = $context.Response
  try {
    $response.Headers['Cache-Control'] = 'no-store'
    $response.Headers['X-Content-Type-Options'] = 'nosniff'
    Invoke-Request $context.Request $response
  } catch {
    try { $response.StatusCode = 500 } catch { }
  } finally {
    $response.Close()
  }
}
