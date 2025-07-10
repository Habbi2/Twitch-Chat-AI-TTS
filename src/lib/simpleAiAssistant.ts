// Simple AI Assistant wrapper for the UI
import { FreeAiService, FreeTTSService, FreeSTTService } from './freeAiService';

export class AIAssistant {
  private aiService: FreeAiService;
  private ttsService: FreeTTSService;
  private sttService: FreeSTTService;
  private isActive = false;

  constructor() {
    this.aiService = new FreeAiService();
    this.ttsService = new FreeTTSService();
    this.sttService = new FreeSTTService();
  }

  // Start the AI assistant
  start(): void {
    this.isActive = true;
    console.log('🤖 AI Assistant started');
  }

  // Stop the AI assistant
  stop(): void {
    this.isActive = false;
    this.ttsService.stop();
    this.sttService.stopListening();
    console.log('🤖 AI Assistant stopped');
  }

  // Process a chat message and generate AI opinion
  async processMessage(message: string): Promise<string> {
    console.log('🤖 AIAssistant.processMessage called with:', message);
    console.log('🔍 AI Assistant isActive:', this.isActive);
    
    if (!this.isActive) {
      console.warn('⚠️ AI Assistant is not active, returning default message');
      return 'AI Assistant is not active';
    }

    try {
      console.log('📤 Calling aiService.generateOpinion...');
      const opinion = await this.aiService.generateOpinion(message);
      console.log('📥 Received opinion from aiService:', opinion);
      return opinion;
    } catch (error) {
      console.error('❌ Error processing message in AIAssistant:', error);
      return 'No tengo opinión sobre eso... por ahora.';
    }
  }

  // Speak text using TTS
  async speak(text: string, options?: { rate?: number; pitch?: number; volume?: number }): Promise<void> {
    try {
      await this.ttsService.speak(text, options);
    } catch (error) {
      console.error('Error speaking text:', error);
    }
  }

  // Start listening for voice commands
  async startListening(onResult: (text: string) => void): Promise<void> {
    try {
      await this.sttService.startListening(onResult);
    } catch (error) {
      console.error('Error starting voice listening:', error);
      throw error;
    }
  }

  // Stop listening for voice commands
  stopListening(): void {
    this.sttService.stopListening();
  }

  // Check if currently listening
  isListening(): boolean {
    return this.sttService.getIsListening();
  }

  // Get status
  getStatus(): { isActive: boolean; isListening: boolean } {
    return {
      isActive: this.isActive,
      isListening: this.isListening()
    };
  }
}
