import { TwitchService, TwitchMessage } from './twitchService';
import { FreeAiService, FreeTTSService, FreeSTTService } from './freeAiService';

export interface AssistantConfig {
  enableVoice: boolean;
  enableTTS: boolean;
  enableSTT: boolean;
  readAllMessages: boolean;
  generateOpinions: boolean;
  voiceRate: number;
  voicePitch: number;
  voiceVolume: number;
}

export class TwitchAiAssistant {
  private twitchService: TwitchService;
  private aiService: FreeAiService;
  private ttsService: FreeTTSService;
  private sttService: FreeSTTService;
  private config: AssistantConfig;
  private isActive: boolean = false;
  private messageQueue: TwitchMessage[] = [];
  private processingMessage: boolean = false;

  constructor(config: Partial<AssistantConfig> = {}) {
    this.config = {
      enableVoice: true,
      enableTTS: true,
      enableSTT: true,
      readAllMessages: false, // Only read selected messages to avoid spam
      generateOpinions: true,
      voiceRate: 1,
      voicePitch: 1,
      voiceVolume: 0.8,
      ...config,
    };

    this.twitchService = new TwitchService();
    this.aiService = new FreeAiService();
    this.ttsService = new FreeTTSService();
    this.sttService = new FreeSTTService();

    this.setupEventHandlers();
  }

  // Start the AI assistant
  async start(): Promise<void> {
    try {
      console.log('🤖 Starting Twitch AI Assistant for channel: habbi3');
      
      // Connect to Twitch
      await this.twitchService.connect();
      
      // Start voice recognition if enabled
      if (this.config.enableSTT && this.config.enableVoice) {
        await this.startVoiceRecognition();
      }

      this.isActive = true;
      console.log('✅ AI Assistant is now active!');

      // Welcome message
      if (this.config.enableTTS) {
        await this.speak("AI Assistant is now online and ready to interact with habbi3's chat!");
      }

    } catch (error) {
      console.error('❌ Error starting AI Assistant:', error);
      throw error;
    }
  }

  // Stop the AI assistant
  async stop(): Promise<void> {
    this.isActive = false;
    
    // Stop voice recognition
    this.sttService.stopListening();
    
    // Stop any ongoing speech
    this.ttsService.stop();
    
    // Disconnect from Twitch
    await this.twitchService.disconnect();
    
    console.log('🛑 AI Assistant stopped');
  }

  // Setup event handlers
  private setupEventHandlers(): void {
    this.twitchService.onMessage(this.handleTwitchMessage.bind(this));
  }

  // Handle incoming Twitch messages
  private async handleTwitchMessage(message: TwitchMessage): Promise<void> {
    if (!this.isActive) return;

    console.log(`📨 Processing message from ${message.username}: ${message.message}`);

    // Add to queue for processing
    this.messageQueue.push(message);

    // Process queue if not already processing
    if (!this.processingMessage) {
      await this.processMessageQueue();
    }
  }

  // Process the message queue
  private async processMessageQueue(): Promise<void> {
    if (this.processingMessage || this.messageQueue.length === 0) return;

    this.processingMessage = true;

    while (this.messageQueue.length > 0 && this.isActive) {
      const message = this.messageQueue.shift()!;
      await this.processMessage(message);
      
      // Small delay between messages to prevent overwhelming
      await this.delay(1000);
    }

    this.processingMessage = false;
  }

  // Process individual message
  private async processMessage(message: TwitchMessage): Promise<void> {
    try {
      // Decide if this message should be read aloud
      const shouldRead = this.shouldReadMessage(message);
      
      if (shouldRead && this.config.enableTTS) {
        // Read the chat message
        const chatText = `${message.username} says: ${message.message}`;
        await this.speak(chatText);
        
        // Generate and speak AI opinion if enabled
        if (this.config.generateOpinions) {
          const opinion = await this.aiService.generateOpinion(message.message);
          await this.speak(opinion);
        }
      }

    } catch (error) {
      console.error('❌ Error processing message:', error);
    }
  }

  // Determine if a message should be read aloud
  private shouldReadMessage(message: TwitchMessage): boolean {
    // Always read if configured to read all messages
    if (this.config.readAllMessages) return true;

    const lowercaseMessage = message.message.toLowerCase();

    // Read messages that mention common attention words
    const attentionWords = [
      'habbi3', 'streamer', 'hey', 'question', 'love', 'great', 'awesome',
      'game', 'play', 'music', 'song', 'opinion', 'think', 'favorite'
    ];

    const hasAttentionWord = attentionWords.some(word => 
      lowercaseMessage.includes(word)
    );

    // Read questions
    const isQuestion = message.message.includes('?');

    // Read longer, meaningful messages (more than 10 characters)
    const isMeaningful = message.message.trim().length > 10;

    // Read messages from subscribers/VIPs (if badge info is available)
    const isImportantUser = !!(message.badges && (
      message.badges.subscriber || 
      message.badges.vip || 
      message.badges.moderator ||
      message.badges.broadcaster
    ));

    return hasAttentionWord || isQuestion || (isMeaningful && Math.random() < 0.3) || isImportantUser;
  }

  // Start voice recognition for streamer commands
  private async startVoiceRecognition(): Promise<void> {
    try {
      await this.sttService.startListening((text: string) => {
        this.handleVoiceCommand(text);
      });
      console.log('🎤 Voice recognition started');
    } catch (error) {
      console.error('❌ Voice recognition error:', error);
    }
  }

  // Handle voice commands from the streamer
  private async handleVoiceCommand(command: string): Promise<void> {
    const lowercaseCommand = command.toLowerCase();
    console.log(`🎤 Voice command: ${command}`);

    if (lowercaseCommand.includes('read chat')) {
      this.config.readAllMessages = true;
      await this.speak("I'll now read all chat messages");
    } else if (lowercaseCommand.includes('stop reading')) {
      this.config.readAllMessages = false;
      await this.speak("I'll now only read selected messages");
    } else if (lowercaseCommand.includes('volume up')) {
      this.config.voiceVolume = Math.min(1, this.config.voiceVolume + 0.2);
      await this.speak("Volume increased");
    } else if (lowercaseCommand.includes('volume down')) {
      this.config.voiceVolume = Math.max(0.1, this.config.voiceVolume - 0.2);
      await this.speak("Volume decreased");
    } else if (lowercaseCommand.includes('speak faster')) {
      this.config.voiceRate = Math.min(2, this.config.voiceRate + 0.2);
      await this.speak("Speaking faster now");
    } else if (lowercaseCommand.includes('speak slower')) {
      this.config.voiceRate = Math.max(0.5, this.config.voiceRate - 0.2);
      await this.speak("Speaking slower now");
    } else if (lowercaseCommand.includes('stop talking')) {
      this.ttsService.stop();
    } else if (lowercaseCommand.includes('say hello')) {
      await this.speak("Hello everyone! Welcome to habbi3's stream!");
    }
  }

  // Speak text using TTS
  private async speak(text: string): Promise<void> {
    if (!this.config.enableTTS) return;

    try {
      await this.ttsService.speak(text, {
        rate: this.config.voiceRate,
        pitch: this.config.voicePitch,
        volume: this.config.voiceVolume,
      });
    } catch (error) {
      console.error('❌ TTS error:', error);
    }
  }

  // Utility delay function
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get current status
  getStatus(): { 
    isActive: boolean; 
    isConnected: boolean; 
    isListening: boolean;
    queueLength: number;
    channel: string;
  } {
    return {
      isActive: this.isActive,
      isConnected: this.twitchService.isConnected(),
      isListening: this.sttService.getIsListening(),
      queueLength: this.messageQueue.length,
      channel: this.twitchService.getChannel(),
    };
  }

  // Update configuration
  updateConfig(newConfig: Partial<AssistantConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Configuration updated:', this.config);
  }

  // Get current configuration
  getConfig(): AssistantConfig {
    return { ...this.config };
  }
}
