# Pruebas de la voz de narración

Fecha: 2 de octubre de 2026. Equipo: macOS 15.7.3. Voz: la del sistema (Voz 1 de Siri, según el autor), con `say` **sin `-v`**.

## Prueba de voz

```bash
say -o video/audio/prueba_voz.aiff "Hola, esto es una prueba de la narración de ТЕТРИС"
```

Según `ffprobe`: 2,62 s, PCM de 16 bits, 22 050 Hz, mono. Según `volumedetect`: volumen medio de −17,0 dB y pico de −2,1 dB, así que no es silencio. **OK.**

## Comandos embebidos y velocidad

Frase de prueba: «Caen piezas de siete formas. Gíralas, y encájalas para completar líneas.»

| Variante                             | Duración | ¿Cambia el audio?        | Conclusión                                                         |
| ------------------------------------ | -------- | ------------------------ | ------------------------------------------------------------------ |
| Sin comandos (velocidad por defecto) | 5,43 s   | —                        | Referencia.                                                        |
| `[[slnc 1000]]` entre las dos frases | 6,23 s   | Sí                       | **Funciona.** Añade unos 0,8 s, porque absorbe la pausa del punto. |
| `[[rate 120]]` al principio          | 6,79 s   | Sí                       | **Funciona** (más lento).                                          |
| `[[rate 260]]` al principio          | 2,44 s   | Sí                       | **Funciona** (más rápido).                                         |
| `[[emph +]]` antes de «siete»        | 5,43 s   | No: idéntico byte a byte | **No tiene efecto** con esta voz.                                  |
| `say -r 150`                         | 5,98 s   | Sí                       | **Funciona.**                                                      |
| `say -r 230`                         | 2,99 s   | Sí                       | **Funciona.**                                                      |

## Decisiones

- **Velocidad por frase:** cada frase se genera como un clip con su propio `-r`, tomado del guion (170–205). Se ajusta tras escuchar la muestra de la escena 3.
- **Pausas:**
  - entre frases, las pone el montaje (cada clip es independiente);
  - dentro de una frase, se usa `[[slnc N]]` donde haga falta.
- **Énfasis:** `[[emph]]` no se usa porque no tiene efecto. El énfasis sale de la puntuación (exclamaciones, interrogaciones, puntos suspensivos) y del ritmo.
- **Tratamiento de audio:** filtro de paso alto a 80 Hz, realce suave de presencia (+2 dB a 3 kHz) y compresión suave (ratio 2,5:1). Después se convierte a 48 kHz. No se cambia el timbre.
