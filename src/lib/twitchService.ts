import tmi from 'tmi.js';

export interface TwitchMessage {
  id: string;
  username: string;
  message: string;
  timestamp: number;
  badges: Record<string, string> | null;
  emotes: Record<string, string[]> | null;
}

export class TwitchService {
  private client: tmi.Client | null = null;
  private channel: string;
  private onMessageCallback: ((message: TwitchMessage) => void) | null = null;

  constructor() {
    this.channel = process.env.NEXT_PUBLIC_TWITCH_CHANNEL || 'habbi3';
  }

  // Connect to Twitch chat
  async connect(): Promise<void> {
    try {
      const options: tmi.Options = {
        identity: {
          username: process.env.NEXT_PUBLIC_TWITCH_BOT_USERNAME || 'justinfan12345', // Anonymous user
          password: process.env.NEXT_PUBLIC_TWITCH_OAUTH_TOKEN, // Optional for read-only
        },
        channels: [this.channel],
        options: {
          debug: true, // Enable debug to see what's happening
          skipMembership: true, // Skip membership events to reduce API calls
          skipUpdatingEmotesets: true, // Skip emote fetching to avoid CORS
        },
        connection: {
          reconnect: true,
          secure: true,
        },
      };

      this.client = new tmi.Client(options);

      // Set up event listeners
      this.client.on('message', this.handleMessage.bind(this));
      this.client.on('connected', this.handleConnected.bind(this));
      this.client.on('disconnected', this.handleDisconnected.bind(this));

      await this.client.connect();
      console.log(`✅ Connected to Twitch channel: ${this.channel}`);
    } catch (error) {
      console.error('❌ Error connecting to Twitch:', error);
      throw error;
    }
  }

  // Disconnect from Twitch chat
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
      console.log('Disconnected from Twitch');
    }
  }

  // Handle incoming messages
  private handleMessage(channel: string, tags: Record<string, unknown>, message: string, self: boolean): void {
    // Ignore messages from the bot itself
    if (self) {
      console.log('🤖 Ignoring self message');
      return;
    }

    const username = (tags['display-name'] as string) || (tags.username as string) || 'Unknown';
    
    // Filter out common bot messages and commands
    if (this.isFilteredMessage(message, username)) {
      console.log(`🚫 Filtered message from ${username}: ${message}`);
      return;
    }

    const twitchMessage: TwitchMessage = {
      id: (tags.id as string) || Date.now().toString(),
      username: username,
      message: message.trim(),
      timestamp: Date.now(),
      badges: (tags.badges as Record<string, string>) || null,
      emotes: (tags.emotes as Record<string, string[]>) || null,
    };

    console.log(`💬 [${twitchMessage.username}]: ${twitchMessage.message}`);
    console.log('📞 Calling onMessageCallback with message:', twitchMessage);

    // Call the message callback if set
    if (this.onMessageCallback) {
      this.onMessageCallback(twitchMessage);
      console.log('✅ Message callback executed');
    } else {
      console.warn('⚠️ No message callback set!');
    }
  }

  // Filter out unwanted messages
  private isFilteredMessage(message: string, username: string): boolean {
    const lowercaseUsername = username?.toLowerCase() || '';

    console.log(`🔍 Checking filter for: "${message}" from ${username}`);

    // Filter out bot messages
    const botKeywords = ['nightbot', 'streamelements', 'streamlabs', 'moobot', 'fossabot'];
    if (botKeywords.some(bot => lowercaseUsername.includes(bot))) {
      console.log(`🤖 Filtering bot message from ${username}`);
      return true;
    }

    // Filter out very short messages (less than 2 characters, more permissive)
    if (message.trim().length < 2) {
      console.log(`📏 Filtering too short message: "${message}"`);
      return true;
    }

    // Only filter messages that are ONLY emotes (be more permissive)
    if (/^:[a-zA-Z0-9_]+:$/.test(message.trim())) {
      console.log(`😀 Filtering emote-only message: "${message}"`);
      return true;
    }

    console.log(`✅ Message passed filter: "${message}"`);
    return false;
  }

  // Handle connection events
  private handleConnected(addr: string, port: number): void {
    console.log(`🌐 Connected to Twitch IRC: ${addr}:${port}`);
  }

  private handleDisconnected(reason: string): void {
    console.log(`🔌 Disconnected from Twitch IRC: ${reason}`);
  }

  // Set callback for new messages
  onMessage(callback: (message: TwitchMessage) => void): void {
    this.onMessageCallback = callback;
  }

  // Send a message to chat (requires authentication)
  async sendMessage(message: string): Promise<void> {
    if (this.client) {
      try {
        await this.client.say(this.channel, message);
        console.log(`📤 Sent message: ${message}`);
      } catch (error) {
        console.error('❌ Error sending message:', error);
      }
    }
  }

  // Get connection status
  isConnected(): boolean {
    return this.client?.readyState() === 'OPEN';
  }

  // Get current channel
  getChannel(): string {
    return this.channel;
  }
}
