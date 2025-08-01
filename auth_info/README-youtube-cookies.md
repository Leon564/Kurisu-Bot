# YouTube Cookies Configuration

## Configuración de Cookies para YouTube

Este bot puede usar cookies de YouTube para mejorar la descarga de videos y música, especialmente para contenido que requiere autenticación.

### Configuración

1. **Copia el archivo de ejemplo:**
   ```
   cp auth_info/youtube-cookies.example.json auth_info/youtube-cookies.json
   ```

2. **Obtén tus cookies de YouTube:**
   - Instala una extensión del navegador como "EditThisCookie" o "Cookie Editor"
   - Visita YouTube en tu navegador
   - Exporta las cookies en formato JSON
   - Copia el array de cookies al archivo `youtube-cookies.json`

3. **Formato del archivo:**
   El archivo debe contener un array de objetos con la estructura de cookies del navegador:
   ```json
   [
     {
       "domain": ".youtube.com",
       "expirationDate": 1787070660,
       "hostOnly": false,
       "httpOnly": false,
       "name": "__Secure-1PAPISID",
       "path": "/",
       "sameSite": "unspecified",
       "secure": true,
       "session": false,
       "storeId": "0",
       "value": "tu_valor_de_cookie_aqui",
       "id": 1
     }
   ]
   ```

### Comportamiento

- **Si el archivo existe:** Las cookies se cargan automáticamente al iniciar el bot
- **Si el archivo no existe:** El bot funciona normalmente sin cookies
- **En caso de error:** Se muestra una advertencia pero el bot continúa funcionando

### Logs

- ✅ `YouTube cookies loaded successfully` - Cookies cargadas correctamente
- ⚠️ `Failed to load YouTube cookies, proceeding without them` - Error al cargar cookies

### Notas Importantes

- Las cookies son sensibles, manténlas seguras
- Agrega `youtube-cookies.json` a tu `.gitignore` para no subirlas al repositorio
- Las cookies pueden expirar, actualízalas si es necesario
