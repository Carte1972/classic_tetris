#!/usr/bin/env perl
# Servidor local de ТЕТРИС para los lanzadores de macOS y Linux: sirve el juego en
# http://127.0.0.1 y guarda el ranking en un archivo JSON (records.json), de modo que los
# récords se conservan en el disco entre sesiones. Solo usa módulos que vienen con Perl.
#
# Uso: perl records_server.pl <carpeta del juego> <archivo de récords> [--port N] [--open COMANDO]
#   --port N        usa ese puerto (por defecto, el primero libre a partir del 47321)
#   --open COMANDO  abre el juego con ese programa (open en macOS, xdg-open en Linux)
#
# Rutas: GET / sirve index.html; GET /api/records devuelve el ranking (o [] si aún no hay);
# PUT /api/records lo guarda. Solo atiende peticiones dirigidas a 127.0.0.1 o localhost,
# para que ninguna web de fuera pueda escribir en el disco.
use strict;
use warnings;
use utf8;
use IO::Select;
use IO::Socket::INET;
use Socket qw(SOMAXCONN);

binmode STDOUT, ':encoding(UTF-8)';
binmode STDERR, ':encoding(UTF-8)';
# Los mensajes salen en el acto aunque la salida no sea un terminal.
$| = 1;

# Primer puerto que se prueba y cuántos se intentan si están ocupados.
my $FIRST_PORT    = 47321;
my $PORT_ATTEMPTS = 10;

# Tamaño máximo de una petición (cabeceras y cuerpo): el ranking ocupa unos 1,5 KB.
my $MAX_REQUEST_BYTES = 65536;

# Segundos que se espera a una conexión que no termina de enviar su petición.
my $IDLE_TIMEOUT_SECONDS = 10;

# Bytes que se leen de cada conexión de una vez.
my $READ_CHUNK_BYTES = 16384;

my %REASONS = (
  200 => 'OK',
  204 => 'No Content',
  400 => 'Bad Request',
  403 => 'Forbidden',
  404 => 'Not Found',
  405 => 'Method Not Allowed',
  413 => 'Payload Too Large',
  415 => 'Unsupported Media Type',
  500 => 'Internal Server Error',
);

my ($game_dir, $records_file, @options) = @ARGV;
die "Uso: perl records_server.pl <carpeta del juego> <archivo de récords> [--port N] [--open COMANDO]\n"
  unless defined $game_dir && defined $records_file;
my ($fixed_port, $opener);
while (@options) {
  my $option = shift @options;
  if    ($option eq '--port') { $fixed_port = shift @options; }
  elsif ($option eq '--open') { $opener     = shift @options; }
  else                        { die "Opción desconocida: $option\n"; }
}
my $index_file = "$game_dir/index.html";

my @candidates =
  defined $fixed_port ? ($fixed_port) : ($FIRST_PORT .. $FIRST_PORT + $PORT_ATTEMPTS - 1);
my ($server, $port);
for my $candidate (@candidates) {
  $server = IO::Socket::INET->new(
    LocalAddr => '127.0.0.1',
    LocalPort => $candidate,
    Proto     => 'tcp',
    Listen    => SOMAXCONN,
    ReuseAddr => 1,
  );
  if ($server) {
    $port = $candidate;
    last;
  }
}
die "No se ha podido abrir el servidor local: los puertos están ocupados.\n" unless $server;

my $url = "http://127.0.0.1:$port/";
print "ТЕТРИС se está jugando en $url\n";
print "Los récords se guardan en $records_file\n";
print "Para terminar, cierra esta ventana o pulsa Ctrl+C.\n";

$SIG{PIPE} = 'IGNORE';
$SIG{CHLD} = 'IGNORE';
if (defined $opener) {
  my $pid = fork();
  if (defined $pid && $pid == 0) {
    exec($opener, $url) or exit 1;
  }
}

# Lee un archivo entero como bytes.
sub read_bytes {
  my ($path) = @_;
  open(my $handle, '<:raw', $path) or return undef;
  local $/;
  my $content = <$handle>;
  close($handle);
  return $content // '';
}

# Indica si un texto tiene pinta de lista JSON (el juego valida cada récord al leerlo).
sub looks_like_json_array {
  my ($text) = @_;
  return $text =~ /\A\s*\[.*\]\s*\z/s;
}

# Respuesta de texto (los mensajes se envían en UTF-8).
sub text_response {
  my ($status, $message) = @_;
  my $body = "$message\n";
  utf8::encode($body);
  return ($status, 'text/plain; charset=utf-8', $body);
}

# Guarda el ranking de forma atómica: primero en un temporal y luego lo renombra.
sub save_records {
  my ($body) = @_;
  my $temporary = "$records_file.tmp";
  open(my $handle, '>:raw', $temporary) or return 0;
  print {$handle} $body or return 0;
  close($handle) or return 0;
  return rename($temporary, $records_file);
}

# Atiende una petición completa y devuelve estado, tipo de contenido y cuerpo.
sub handle_request {
  my ($request) = @_;
  my $host = $request->{headers}{host} // '';
  return text_response(403, 'Solo se admiten peticiones locales.')
    unless $host eq "127.0.0.1:$port" || $host eq "localhost:$port";
  my ($method, $path) = ($request->{method}, $request->{path});
  $path =~ s/\?.*\z//s;

  if ($path eq '/' || $path eq '/index.html') {
    return text_response(405, 'Método no admitido.') unless $method eq 'GET';
    my $page = read_bytes($index_file);
    return text_response(404, "No se encuentra $index_file.") unless defined $page;
    return (200, 'text/html; charset=utf-8', $page);
  }

  if ($path eq '/api/records') {
    if ($method eq 'GET') {
      my $stored = read_bytes($records_file);
      my $body   = defined $stored && looks_like_json_array($stored) ? $stored : "[]\n";
      return (200, 'application/json; charset=utf-8', $body);
    }
    if ($method eq 'PUT') {
      my $type = $request->{headers}{'content-type'} // '';
      return text_response(415, 'El ranking se envía como JSON.') unless $type =~ m{\Aapplication/json}i;
      return text_response(400, 'El ranking debe ser una lista JSON.')
        unless looks_like_json_array($request->{body});
      return text_response(500, "No se ha podido escribir $records_file.")
        unless save_records($request->{body});
      return (204, undef, '');
    }
    return text_response(405, 'Método no admitido.');
  }

  return text_response(404, 'No existe.');
}

# Intenta separar una petición HTTP completa del búfer de una conexión.
# Devuelve la petición, 'too_large' si se pasa del límite o undef si aún faltan datos.
sub parse_request {
  my ($buffer) = @_;
  my $header_end = index($buffer, "\r\n\r\n");
  if ($header_end < 0) {
    return length($buffer) > $MAX_REQUEST_BYTES ? 'too_large' : undef;
  }
  my ($request_line, @header_lines) = split(/\r\n/, substr($buffer, 0, $header_end));
  my ($method, $path) = split(/ /, $request_line // '');
  my %headers;
  for my $line (@header_lines) {
    my ($name, $value) = $line =~ /\A([^:]+):\s*(.*)\z/ or next;
    $headers{lc $name} = $value;
  }
  my $length = $headers{'content-length'} // 0;
  $length = 0 unless $length =~ /\A\d+\z/;
  return 'too_large' if $header_end + 4 + $length > $MAX_REQUEST_BYTES;
  my $body = substr($buffer, $header_end + 4);
  return undef if length($body) < $length;
  return {
    method  => $method // '',
    path    => $path   // '',
    headers => \%headers,
    body    => substr($body, 0, $length),
  };
}

# Envía la respuesta y cierra la conexión.
sub send_response {
  my ($client, $status, $type, $body) = @_;
  my $head = "HTTP/1.1 $status $REASONS{$status}\r\n";
  $head .= "Content-Type: $type\r\n" if defined $type;
  $head .= 'Content-Length: ' . length($body) . "\r\n";
  $head .= "Cache-Control: no-store\r\nX-Content-Type-Options: nosniff\r\nConnection: close\r\n\r\n";
  my $data = $head . $body;
  while (length $data) {
    my $written = syswrite($client, $data);
    last unless $written;
    substr($data, 0, $written) = '';
  }
}

# Varias conexiones a la vez: los navegadores abren alguna de más que no envía nada.
my $select = IO::Select->new($server);
my (%buffers, %last_activity, %draining);

sub drop_client {
  my ($client) = @_;
  $select->remove($client);
  delete $buffers{$client};
  delete $last_activity{$client};
  delete $draining{$client};
  close($client);
}

while (1) {
  for my $handle ($select->can_read(1)) {
    if ($handle == $server) {
      my $client = $server->accept() or next;
      $select->add($client);
      $buffers{$client}       = '';
      $last_activity{$client} = time;
      next;
    }
    my $read = sysread($handle, my $chunk, $READ_CHUNK_BYTES);
    if (!$read) {
      drop_client($handle);
      next;
    }
    $last_activity{$handle} = time;
    # Tras rechazar una petición grande se lee el resto sin guardarlo: cerrar con datos
    # sin leer haría que el sistema cortase la conexión y se perdiera la respuesta.
    next if $draining{$handle};
    $buffers{$handle} .= $chunk;
    my $request = parse_request($buffers{$handle});
    next unless defined $request;
    if (ref $request) {
      send_response($handle, handle_request($request));
      drop_client($handle);
      next;
    }
    send_response($handle, text_response(413, 'Petición demasiado grande.'));
    shutdown($handle, 1);
    $draining{$handle} = 1;
    $buffers{$handle}  = '';
  }
  for my $handle ($select->handles) {
    next if $handle == $server;
    drop_client($handle) if time - $last_activity{$handle} > $IDLE_TIMEOUT_SECONDS;
  }
}
