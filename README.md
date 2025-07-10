# 🤖 Habbi3 AI Assistant

Un asistente de IA sarcástico y divertido para el canal de Twitch **habbi3**. Lee los comentarios del chat en voz alta y da opiniones ingeniosas, sarcásticas e irónicas.

## ✨ Características

- **🎤 Lectura de chat en voz alta**: Lee los comentarios de los espectadores usando síntesis de voz
- **🤖 Opiniones sarcásticas**: Genera respuestas divertidas, sarcásticas e irónicas sobre los comentarios
- **🗣️ Reconocimiento de voz**: Escucha comandos de voz del streamer
- **🇪🇸 En español**: Configurado específicamente para español con comentarios picantes
- **💰 Completamente gratuito**: Usa servicios gratuitos (Hugging Face, Web Speech API)
- **🌐 Fácil deployment en Vercel**: Listo para producción

## 🚀 Instalación y Uso

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
El archivo `.env.local` ya está configurado para el canal habbi3:

```bash
# Twitch Configuration
TWITCH_CHANNEL=habbi3
TWITCH_BOT_USERNAME=habbi3_ai_bot
TWITCH_OAUTH_TOKEN=tu_token_actual  # Ya configurado

# Public environment variables (accessible in browser)
NEXT_PUBLIC_TWITCH_CHANNEL=habbi3
NEXT_PUBLIC_TWITCH_BOT_USERNAME=habbi3_ai_bot
NEXT_PUBLIC_TWITCH_OAUTH_TOKEN=tu_token_actual  # Necesario para el navegador
```

**Importante**: Para que funcione en el navegador, necesitas agregar `NEXT_PUBLIC_TWITCH_OAUTH_TOKEN` a tu `.env.local`

### 3. Ejecutar en desarrollo
```bash
npm run dev
```

### 4. Abrir en el navegador
Ve a `http://localhost:3000`

## 🔧 Configuración

### Obtener Token OAuth de Twitch (Opcional)
1. Ve a [https://twitchapps.com/tmi/](https://twitchapps.com/tmi/)
2. Autoriza la aplicación
3. Copia el token oauth y ponlo en `.env.local`

**Nota**: El token OAuth es opcional. Sin él, la aplicación funcionará en modo de solo lectura.

## 🎮 Cómo usar

1. **Conectar**: Haz clic en "Conectar" para conectarte al chat de habbi3
2. **Activar IA**: Haz clic en "IA Activa" para empezar a generar opiniones sarcásticas
3. **Escucha por voz**: Activa el micrófono para dar comandos de voz
4. **Disfruta**: El asistente leerá los comentarios y dará opiniones divertidas

## 💬 Ejemplos de Respuestas Sarcásticas

- **Comentario positivo**: "¡Qué optimista! Me gusta esa energía... aunque sea un poco ingenua."
- **Pregunta**: "Ooh, una pregunta. Qué conceptual. Déjame consultar mi bola de cristal..."
- **Spam**: "Ah, el pesimismo clásico. Nunca pasa de moda, ¿verdad?"
- **Saludo**: "¡Miren! Alguien que sabe saludar. Todo un fenómeno social."

## 🌐 Deploy en Vercel

1. Haz fork de este proyecto
2. Conecta tu repositorio a Vercel
3. Agrega las variables de entorno en Vercel
4. Deploy automático

## 🛠️ Tecnologías Utilizadas

- **Next.js 14**: Framework React con App Router
- **TypeScript**: Tipado estático
- **Tailwind CSS**: Estilos modernos
- **TMI.js**: Cliente de Twitch IRC
- **Web Speech API**: Síntesis y reconocimiento de voz (gratis)
- **Hugging Face**: IA gratuita para análisis de sentimientos
- **Vercel**: Hosting y deployment

## 🎤 Comandos de Voz

Puedes dar estos comandos de voz al asistente:

- "read chat" - Leer todos los mensajes
- "stop reading" - Solo leer mensajes seleccionados
- "volume up/down" - Ajustar volumen
- "speak faster/slower" - Ajustar velocidad
- "stop talking" - Parar la voz actual
- "say hello" - Saludar al chat

## 🐛 Resolución de Problemas

### No se conecta a Twitch
- Verifica el nombre del canal en `.env.local`
- Asegúrate de que el canal esté en vivo o haya actividad reciente
- Revisa la consola del navegador para errores

### No funciona la voz
- Dale permisos de micrófono al navegador
- Usa Chrome o Edge (mejor compatibilidad con Web Speech API)
- Verifica que tu dispositivo tenga altavoces/auriculares

### No genera opiniones
- Revisa que la IA esté activada
- Verifica la conexión a internet
- Los servicios de Hugging Face pueden tener límites de rate

## 📝 Licencia

MIT License - Siéntete libre de modificar y usar para tu canal.

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Especialmente:
- Más respuestas sarcásticas en español
- Mejores filtros de mensajes
- Nuevas características de voz
- Optimizaciones de rendimiento

---

Hecho con 💜 para el canal de **habbi3** y la comunidad de Twitch
