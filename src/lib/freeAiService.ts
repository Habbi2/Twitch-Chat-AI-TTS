// Free AI Service using Hugging Face Inference API and browser speech
export class FreeAiService {
  private huggingFaceUrl: string;
  private model: string;
  private apiToken?: string;

  constructor() {
    this.huggingFaceUrl = process.env.HUGGINGFACE_API_URL || 'https://api-inference.huggingface.co/models';
    this.model = process.env.HUGGINGFACE_MODEL || 'microsoft/DialoGPT-medium';
    this.apiToken = process.env.HUGGINGFACE_API_TOKEN;
    
    console.log('🤖 FreeAiService initialized');
    console.log('🔗 Hugging Face URL:', this.huggingFaceUrl);
    console.log('🔑 API Token configured:', this.apiToken ? 'Yes' : 'No');
  }

  // Generate AI opinion using free Hugging Face API
  async generateOpinion(chatMessage: string): Promise<string> {
    try {
      console.log('🤖 Generating opinion for:', chatMessage);
      
      // Try sentiment analysis first, but fallback if it fails
      let sentiment = 'NEUTRAL';
      try {
        sentiment = await this.analyzeSentiment(chatMessage);
        console.log('📊 Sentiment detected:', sentiment);
      } catch (error) {
        console.warn('⚠️ Sentiment analysis failed, using local detection:', error);
        // Use local sentiment detection as fallback
        sentiment = this.detectLocalSentiment(chatMessage);
        console.log('🔍 Local sentiment detected:', sentiment);
      }
      
      // Generate opinion based on sentiment and message content
      const opinion = this.generateLocalOpinion(chatMessage, sentiment);
      console.log('💭 Generated opinion:', opinion);
      
      return opinion;
    } catch (error) {
      console.error('❌ Error generating opinion:', error);
      return this.getFallbackOpinion();
    }
  }

  // Free sentiment analysis using our Next.js API route (avoids CORS issues)
  private async analyzeSentiment(text: string): Promise<string> {
    try {
      console.log('📊 Analyzing sentiment for:', text);
      
      const response = await fetch('/api/sentiment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        console.warn(`⚠️ Sentiment API returned ${response.status}: ${response.statusText}`);
        throw new Error(`Sentiment analysis failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('📊 Sentiment API response:', result);
      
      if (result && result.sentiment) {
        return result.sentiment;
      } else {
        console.warn('⚠️ Unexpected sentiment API response format:', result);
        return 'NEUTRAL';
      }
    } catch (error) {
      console.error('❌ Sentiment analysis error:', error);
      throw error; // Re-throw to be caught by the calling function
    }
  }

  // Local sentiment detection as fallback
  private detectLocalSentiment(text: string): string {
    const lowercaseText = text.toLowerCase();
    
    // Positive indicators
    const positiveWords = [
      'genial', 'increíble', 'fantástico', 'excelente', 'bueno', 'bien', 'perfecto',
      'amor', 'me gusta', 'hermoso', 'divertido', 'feliz', 'alegre', 'cool',
      'jajaja', 'jeje', 'lol', 'xd', '😂', '😍', '❤️', '👍', '🔥'
    ];
    
    // Negative indicators
    const negativeWords = [
      'malo', 'terrible', 'horrible', 'odio', 'aburrido', 'feo', 'estúpido',
      'idiota', 'basura', 'mierda', 'pendejo', 'molesto', 'triste', 'enojado',
      'wtf', 'shit', '😡', '👎', '💩', '😭'
    ];
    
    const positiveCount = positiveWords.filter(word => lowercaseText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowercaseText.includes(word)).length;
    
    if (positiveCount > negativeCount) {
      return 'POSITIVE';
    } else if (negativeCount > positiveCount) {
      return 'NEGATIVE';
    } else {
      return 'NEUTRAL';
    }
  }

  // Generate witty, sarcastic Spanish opinions based on patterns and sentiment
  private generateLocalOpinion(message: string, sentiment: string): string {
    const lowercaseMessage = message.toLowerCase();
    
    // Witty and sarcastic Spanish opinion templates
    const opinions = {
      POSITIVE: [
        "¡Qué optimista! Me gusta esa energía... aunque sea un poco ingenua.",
        "¡Vaya! Alguien se tomó sus vitaminas de positividad hoy.",
        "Tanto entusiasmo me da miedo... pero está bien, supongo.",
        "¡Qué hermoso! Casi se me cae una lágrima... casi.",
        "Este comentario brilla más que mi futuro, y eso ya es decir algo."
      ],
      NEGATIVE: [
        "Ah, el pesimismo clásico. Nunca pasa de moda, ¿verdad?",
        "Veo que alguien despertó con el pie izquierdo... y el derecho también.",
        "Qué originalidad quejarse. Nadie había pensado en eso antes...",
        "¡Perfecto! Justo lo que necesitaba para alegrar mi día.",
        "Gracias por ese rayito de sol. Realmente iluminas el chat.",
        "Tu negatividad es tan refrescante como un cubito de hielo en el desierto."
      ],
      NEUTRAL: [
        "Interesante... si es que podemos llamar 'interesante' a esto.",
        "Vaya comentario más... existente.",
        "Gracias por ese aporte tan... único.",
        "El chat siempre sorprende con su... creatividad.",
        "Qué profundo. Casi filosofico, diría yo.",
        "Otro comentario para los anales de la historia... o no."
      ]
    };

    // Sarcastic responses for specific Spanish content
    if (lowercaseMessage.includes('juego') || lowercaseMessage.includes('jugar') || lowercaseMessage.includes('game')) {
      return "¡Ah sí! Los juegos, esa actividad tan productiva. Sigamos gastando vida en pixels.";
    }
    
    if (lowercaseMessage.includes('música') || lowercaseMessage.includes('canción') || lowercaseMessage.includes('music')) {
      return "Música... porque hablar es muy mainstream, ¿no?";
    }
    
    if (lowercaseMessage.includes('hola') || lowercaseMessage.includes('hello') || lowercaseMessage.includes('buenas')) {
      return "¡Miren! Alguien que sabe saludar. Todo un fenómeno social.";
    }
    
    if (lowercaseMessage.includes('?')) {
      return "Ooh, una pregunta. Qué conceptual. Déjame consultar mi bola de cristal...";
    }

    if (lowercaseMessage.includes('lol') || lowercaseMessage.includes('jaja') || lowercaseMessage.includes('xd')) {
      return "¡Qué gracioso! Me estoy riendo tanto que casi se me mueve un músculo de la cara.";
    }

    if (lowercaseMessage.includes('noob') || lowercaseMessage.includes('malo')) {
      return "Ah, la crítica constructiva. Tan sutil como un ladrillo en la cara.";
    }

    if (lowercaseMessage.includes('stream') || lowercaseMessage.includes('directo')) {
      return "Sí, es un stream. Qué observador. Sherlock Holmes estaría orgulloso.";
    }

    if (lowercaseMessage.includes('like') || lowercaseMessage.includes('follow') || lowercaseMessage.includes('suscri')) {
      return "¡Ah! El clásico 'dale like y suscríbete'. Qué original y nada desesperado.";
    }

    // Return random sarcastic opinion based on sentiment
    const sentimentOpinions = opinions[sentiment as keyof typeof opinions] || opinions.NEUTRAL;
    return sentimentOpinions[Math.floor(Math.random() * sentimentOpinions.length)];
  }

  // Sarcastic Spanish fallback opinions when AI services fail
  private getFallbackOpinion(): string {
    const fallbacks = [
      "Qué comentario tan... especial.",
      "El chat está que arde hoy... de aburrimiento.",
      "Gracias por ese aporte tan valioso para la humanidad.",
      "¡Increíble! Otro comentario para enmarcar.",
      "La sabiduría del chat nunca deja de sorprenderme... o no.",
      "¡Qué suerte tengo de tener espectadores tan... únicos!"
    ];
    
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
}

// Browser-based Text-to-Speech service (completely free)
export class FreeTTSService {
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.synth = window.speechSynthesis;
      this.loadVoices();
    }
  }

  private loadVoices() {
    if (this.synth) {
      this.voices = this.synth.getVoices();
      
      // If voices aren't loaded yet, wait for the event
      if (this.voices.length === 0) {
        this.synth.addEventListener('voiceschanged', () => {
          this.voices = this.synth!.getVoices();
        });
      }
    }
  }

  // Speak text using browser's built-in TTS
  speak(text: string, options: { rate?: number; pitch?: number; volume?: number } = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synth) {
        console.error('❌ Speech synthesis not supported');
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      console.log('🔊 TTS: Preparing to speak:', text);

      // Cancel any ongoing speech
      this.synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configure voice options
      utterance.rate = options.rate || 0.9; // Slightly slower for clarity
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume || 0.8;
      utterance.lang = 'es-ES'; // Set Spanish language

      // Try to use a Spanish voice (prefer female Spanish voices for sarcastic delivery)
      const allVoices = this.synth.getVoices();
      console.log('Available voices:', allVoices.map(v => `${v.name} (${v.lang})`));
      
      const preferredVoice = allVoices.find(voice => 
        voice.lang.includes('es') && voice.name.toLowerCase().includes('female')
      ) || allVoices.find(voice => voice.lang.includes('es')) || 
         allVoices.find(voice => voice.lang.includes('en')) || allVoices[0];

      if (preferredVoice) {
        utterance.voice = preferredVoice;
        console.log('🎤 Using voice:', preferredVoice.name, preferredVoice.lang);
      }

      utterance.onstart = () => {
        console.log('🔊 TTS: Started speaking');
      };

      utterance.onend = () => {
        console.log('✅ TTS: Finished speaking');
        resolve();
      };
      
      utterance.onerror = (event) => {
        console.error('❌ TTS Error:', event);
        reject(new Error(`TTS Error: ${event.error}`));
      };

      console.log('🔊 TTS: Starting speech...');
      this.synth.speak(utterance);
    });
  }

  // Stop current speech
  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  // Get available voices
  getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }
}

// Browser-based Speech Recognition (completely free)
export class FreeSTTService {
  private recognition: any = null;
  private isListening = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = false;
        this.recognition.lang = 'es-ES'; // Spanish recognition for streamer interaction
      }
    }
  }

  // Start listening for voice commands
  startListening(onResult: (text: string) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition not supported'));
        return;
      }

      this.recognition.onresult = (event: any) => {
        const result = event.results[event.results.length - 1];
        if (result.isFinal) {
          onResult(result[0].transcript);
        }
      };

      this.recognition.onerror = (event: any) => {
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      this.recognition.onstart = () => {
        this.isListening = true;
        resolve();
      };

      this.recognition.start();
    });
  }

  // Stop listening
  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  // Check if currently listening
  getIsListening(): boolean {
    return this.isListening;
  }
}
