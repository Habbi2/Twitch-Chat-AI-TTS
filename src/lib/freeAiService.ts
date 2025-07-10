// Free AI Service using Hugging Face Inference API and browser speech
export class FreeAiService {
  private huggingFaceUrl: string;
  private model: string;
  private apiToken?: string;
  private conversationHistory: Array<{message: string, response: string, timestamp: number}> = [];
  private recentTopics: Set<string> = new Set();
  private responseHistory: Set<string> = new Set();

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
      
      // Clean up old conversation history (keep only last 50 messages)
      if (this.conversationHistory.length > 50) {
        this.conversationHistory = this.conversationHistory.slice(-50);
      }
      
      // Clean up old response history (keep only last 100 responses)
      if (this.responseHistory.size > 100) {
        const responses = Array.from(this.responseHistory);
        this.responseHistory = new Set(responses.slice(-100));
      }
      
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
      
      // Generate contextual opinion based on conversation history
      const opinion = this.generateContextualOpinion(chatMessage, sentiment);
      console.log('💭 Generated opinion:', opinion);
      
      // Store in conversation history
      this.conversationHistory.push({
        message: chatMessage,
        response: opinion,
        timestamp: Date.now()
      });
      
      // Add to response history to avoid repetition
      this.responseHistory.add(opinion);
      
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

  // Generate witty, contextual Spanish opinions that avoid repetition
  private generateContextualOpinion(message: string, sentiment: string): string {
    const lowercaseMessage = message.toLowerCase();
    
    // Check if we've seen similar messages recently
    const recentSimilarMessages = this.conversationHistory
      .filter(h => Date.now() - h.timestamp < 300000) // Last 5 minutes
      .filter(h => this.calculateSimilarity(h.message.toLowerCase(), lowercaseMessage) > 0.7);
    
    // Extract topics from the message
    const topics = this.extractTopics(lowercaseMessage);
    topics.forEach(topic => this.recentTopics.add(topic));
    
    // Clean up old topics (keep only last 20 topics)
    if (this.recentTopics.size > 20) {
      const topicsArray = Array.from(this.recentTopics);
      this.recentTopics = new Set(topicsArray.slice(-20));
    }
    
    // Generate response based on context and variety
    let possibleResponses: string[] = [];
    
    // Context-aware responses for repeated topics
    if (recentSimilarMessages.length > 0) {
      possibleResponses = this.getRepeatTopicResponses();
    }
    
    // Topic-specific deep responses
    if (possibleResponses.length === 0) {
      possibleResponses = this.getTopicSpecificResponses(lowercaseMessage, sentiment, topics);
    }
    
    // Sentiment-based responses as fallback
    if (possibleResponses.length === 0) {
      possibleResponses = this.getSentimentBasedResponses(sentiment);
    }
    
    // Filter out recently used responses
    const availableResponses = possibleResponses.filter(response => 
      !this.responseHistory.has(response)
    );
    
    // If all responses were used recently, use the original pool but add variety
    const finalResponses = availableResponses.length > 0 ? availableResponses : possibleResponses;
    
    // Add contextual modifiers for extra variety
    let selectedResponse = finalResponses[Math.floor(Math.random() * finalResponses.length)];
    selectedResponse = this.addContextualModifiers(selectedResponse);
    
    return selectedResponse;
  }

  // Calculate similarity between two messages
  private calculateSimilarity(msg1: string, msg2: string): number {
    const words1 = msg1.split(' ').filter(w => w.length > 2);
    const words2 = msg2.split(' ').filter(w => w.length > 2);
    
    if (words1.length === 0 || words2.length === 0) return 0;
    
    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length);
  }

  // Extract topics from message
  private extractTopics(message: string): string[] {
    const topics: string[] = [];
    
    // Gaming topics
    if (message.match(/\b(juego|jugar|game|gaming|gamer|play|jugando)\b/)) topics.push('gaming');
    if (message.match(/\b(stream|streaming|directo|vivo|live)\b/)) topics.push('streaming');
    if (message.match(/\b(música|canción|music|song|sonido)\b/)) topics.push('music');
    if (message.match(/\b(chat|charla|hablar|talk|talking)\b/)) topics.push('chat');
    if (message.match(/\b(like|follow|sub|suscri|sigue)\b/)) topics.push('engagement');
    if (message.match(/\b(noob|malo|bad|skill|habilidad)\b/)) topics.push('skill');
    if (message.match(/\b(hola|hello|buenas|hi|hey)\b/)) topics.push('greeting');
    if (message.match(/\b(pregunta|question|\?)\b/)) topics.push('question');
    if (message.match(/\b(lol|jaja|xd|funny|gracioso|divertido)\b/)) topics.push('humor');
    if (message.match(/\b(win|ganar|victory|victoria|good|bueno)\b/)) topics.push('success');
    if (message.match(/\b(fail|fallo|lose|perder|bad|malo)\b/)) topics.push('failure');
    
    return topics;
  }

  // Responses for repeated topics
  private getRepeatTopicResponses(): string[] {
    const responses = [
      "¿En serio? ¿Otra vez con lo mismo? La creatividad no es tu fuerte, ¿verdad?",
      "Déjà vu... ¿O es que el chat está en modo repetición automática?",
      "Vaya, qué original. Nadie había mencionado eso antes... en los últimos 5 minutos.",
      "¿Estamos en un loop temporal o simplemente no hay ideas nuevas?",
      "El chat parece un disco rayado. ¿Alguien tiene aceite para la aguja?",
      "Mismo tema, diferentes palabras. Qué innovador.",
      "¿Será que todos compartieron el mismo manual de conversación?",
      "La variedad es la sal de la vida... pero aquí solo hay sal, sin variedad."
    ];
    
    return responses;
  }

  // Topic-specific contextual responses
  private getTopicSpecificResponses(message: string, sentiment: string, topics: string[]): string[] {
    const responses: string[] = [];
    
    // Gaming context
    if (topics.includes('gaming')) {
      responses.push(
        "Ah, los videojuegos. Esa noble actividad donde se pierde tiempo con propósito.",
        "¡Gaming! Porque la vida real no tiene suficientes desafíos imposibles.",
        "Los juegos: donde todos son expertos hasta que tienen que jugar ellos.",
        "¿Gaming? Qué coincidencia, estamos en un stream de juegos. Sherlock Holmes tendría envidia.",
        "Los videojuegos: la única forma socialmente aceptable de gritar a pantallas."
      );
    }
    
    // Streaming context
    if (topics.includes('streaming')) {
      responses.push(
        "¡Streaming! Porque transmitir tu vida es más fácil que vivirla plenamente.",
        "Ah sí, el streaming. Donde todos son críticos de cine sin haber visto una película.",
        "Directo en vivo: donde los errores se vuelven memes instantáneos.",
        "El streaming: convertir hobbies en trabajos desde 2011.",
        "¿Streaming? No, esto es un experimento sociológico disfrazado."
      );
    }
    
    // Music context
    if (topics.includes('music')) {
      responses.push(
        "Música: el lenguaje universal... aunque algunos hablan en dialecto terrible.",
        "¿Música? Qué concept tan revolucionario para acompañar actividades.",
        "La música: porque el silencio era demasiado honesto.",
        "Ah, la música. Ese arte que une a las personas... y las separa en géneros.",
        "¿Música? Prefiero llamarlo 'sonidos organizados con intención emocional'."
      );
    }
    
    // Engagement context
    if (topics.includes('engagement')) {
      responses.push(
        "¡Likes y follows! Porque la validación digital es la nueva moneda social.",
        "Ah, el eterno 'dale like'. Tan sutil como un anuncio de teletienda.",
        "Suscríbete: porque comprometer tu atención es el nuevo compromiso.",
        "¿Follow? Claro, porque necesitamos más gente siguiendo y menos liderando.",
        "Los likes: esa dopamina barata que alimenta el ego moderno."
      );
    }
    
    // Skill/Performance context
    if (topics.includes('skill') || topics.includes('success') || topics.includes('failure')) {
      responses.push(
        "Skill: esa cosa misteriosa que se adquiere con práctica... qué concepto tan radical.",
        "¡Habilidad! Porque el talento natural es para los aburridos.",
        "Las habilidades: se desarrollan con tiempo, paciencia y muchas frustraciones.",
        "¿Skill? Ese es el DLC de la vida que cuesta tiempo y esfuerzo.",
        "La habilidad: donde la teoría se encuentra con la realidad y chocan violentamente."
      );
    }
    
    // Humor context
    if (topics.includes('humor')) {
      responses.push(
        "¡Humor! Porque reír es más barato que la terapia... aunque menos efectivo.",
        "Jajaja, el sonido universal de 'entendí la referencia'.",
        "Risa: ese mecanismo de defensa que nos hace olvidar la realidad.",
        "¿Humor? Ese condimento que hace digerible la existencia.",
        "La risa: el mejor medicamento... según estudios que nunca leí."
      );
    }
    
    return responses;
  }

  // Sentiment-based responses with more variety
  private getSentimentBasedResponses(sentiment: string): string[] {
    const responses = {
      POSITIVE: [
        "¡Qué energía tan contagiosa! Casi me dan ganas de ser optimista... casi.",
        "Tanto positivismo me ciega. ¿Alguien tiene gafas de sol para emociones?",
        "¡Vaya! Alguien desayunó arcoíris y unicornios hoy.",
        "Esa actitud positiva es más brillante que mi futuro profesional.",
        "¡Qué hermoso! Me dan ganas de sonreír... pero no lo haré por principio.",
        "Tu optimismo es tan puro que contamina mi cinismo existencial.",
        "¡Fantástico! Justo lo que necesitaba para equilibrar mi desesperanza.",
        "Ese entusiasmo podría iluminar una ciudad... o cegar a sus habitantes."
      ],
      NEGATIVE: [
        "Ah, el pesimismo. Un clásico que nunca pasa de moda.",
        "¡Qué refrescante! Un poco de negatividad para equilibrar el universo.",
        "Veo que alguien eligió la honestidad emocional hoy. Qué valiente.",
        "Tu negatividad es tan consistente que es casi inspiradora.",
        "¡Perfecto! Justo necesitaba algo de realismo crudo en mi día.",
        "Esa actitud sombría le da profundidad al chat. Muy filosófico.",
        "¡Excelente! Porque el optimismo estaba sobrevalorado de todas formas.",
        "Tu pesimismo es tan refinado que podría ser un vino añejo."
      ],
      NEUTRAL: [
        "Ah, la neutralidad. Suiza estaría orgullosa.",
        "¡Qué comentario tan... existente! Realmente ocupa espacio en el chat.",
        "La mediocridad tiene su encanto. Es predecible y reconfortante.",
        "¿Neutral? Qué concepto tan radical en estos tiempos polarizados.",
        "Tu comentario es tan neutral que podría mediar en conflictos internacionales.",
        "¡Fascinante! Como ver pintura secarse, pero con menos emoción.",
        "Neutralidad: la Suiza de las emociones. Respetable pero aburrida.",
        "¡Qué equilibrio! Ni muy alto ni muy bajo, justo en el limbo emocional."
      ]
    };
    
    return responses[sentiment as keyof typeof responses] || responses.NEUTRAL;
  }

  // Add contextual modifiers for extra variety
  private addContextualModifiers(response: string): string {
    const modifiers = [
      "Por cierto, ", "En fin, ", "Bueno, ", "Mira, ", "Oye, ", "Escucha, ",
      "A ver, ", "Digo yo, ", "Pues ", "Claro que ", "Obviamente, "
    ];
    
    const endings = [
      "... o eso creo.", "... pero qué sé yo.", "... supongo.", "... en mi humilde opinión.",
      "... pero hey, solo soy una IA.", "... o no, ustedes deciden.", "... más o menos.",
      "... pero no me hagan caso.", "... según mi limitada experiencia.", "... digo yo."
    ];
    
    // Sometimes add modifiers for variety
    if (Math.random() < 0.3) {
      const modifier = modifiers[Math.floor(Math.random() * modifiers.length)];
      response = modifier + response.toLowerCase();
    }
    
    // Sometimes add endings for variety
    if (Math.random() < 0.2) {
      const ending = endings[Math.floor(Math.random() * endings.length)];
      response = response + ending;
    }
    
    return response;
  }

  // Sarcastic Spanish fallback opinions when AI services fail
  private getFallbackOpinion(): string {
    const fallbacks = [
      "Qué comentario tan... especial.",
      "El chat está que arde hoy... de aburrimiento.",
      "Gracias por ese aporte tan valioso para la humanidad.",
      "¡Increíble! Otro comentario para enmarcar.",
      "La sabiduría del chat nunca deja de sorprenderme... o no.",
      "¡Qué suerte tengo de tener espectadores tan... únicos!",
      "Bueno, eso fue... interesante. Definamos 'interesante' libremente.",
      "¡Vaya! Otro comentario para la colección de... comentarios.",
      "La profundidad de este chat rivaliza con un charco después de la lluvia.",
      "¡Fascinante! Como ver crecer el pasto, pero menos emocionante."
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
