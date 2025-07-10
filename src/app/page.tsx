'use client';

import { useState, useEffect, useRef } from 'react';
import { TwitchService, TwitchMessage } from '@/lib/twitchService';
import { AIAssistant } from '@/lib/simpleAiAssistant';

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
  opinion?: string;
}

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [isAIEnabled, setIsAIEnabled] = useState(true); // Start with AI enabled
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentlyReading, setCurrentlyReading] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');

  const twitchServiceRef = useRef<TwitchService | null>(null);
  const aiAssistantRef = useRef<AIAssistant | null>(null);

  useEffect(() => {
    // Initialize services
    twitchServiceRef.current = new TwitchService();
    aiAssistantRef.current = new AIAssistant();

    // Start AI assistant by default
    if (aiAssistantRef.current) {
      aiAssistantRef.current.start();
      setIsAIEnabled(true);
      console.log('🚀 AI Assistant auto-started on initialization');
    }

    return () => {
      // Cleanup
      if (twitchServiceRef.current) {
        twitchServiceRef.current.disconnect();
      }
      if (aiAssistantRef.current) {
        aiAssistantRef.current.stop();
      }
    };
  }, []);

  const connectToTwitch = async () => {
    if (!twitchServiceRef.current) return;

    try {
      setConnectionStatus('Connecting...');
      
      // Set up message listener BEFORE connecting
      twitchServiceRef.current.onMessage((message: TwitchMessage) => {
        console.log('📨 Received message in React component:', message);
        const newMessage: ChatMessage = {
          id: message.id,
          username: message.username,
          message: message.message,
          timestamp: new Date(message.timestamp)
        };

        console.log('➕ Adding message to chat:', newMessage);
        setChatMessages(prev => {
          const updated = [...prev.slice(-50), newMessage];
          console.log('💬 Updated chat messages count:', updated.length);
          return updated;
        });

        // Generate AI opinion if enabled
        console.log('🔍 Checking AI conditions:');
        console.log('  - isAIEnabled:', isAIEnabled);
        console.log('  - aiAssistantRef.current exists:', !!aiAssistantRef.current);
        
        if (isAIEnabled && aiAssistantRef.current) {
          console.log('🤖 Processing message with AI:', message.message);
          aiAssistantRef.current.processMessage(message.message)
            .then((opinion: string) => {
              console.log('💭 AI Opinion received:', opinion);
              setChatMessages(prev => 
                prev.map(msg => 
                  msg.id === newMessage.id 
                    ? { ...msg, opinion }
                    : msg
                )
              );

              // Speak the comment and opinion
              const textToSpeak = `${message.username} dice: ${message.message}. Mi opinión: ${opinion}`;
              setCurrentlyReading(textToSpeak);
              console.log('🔊 Speaking:', textToSpeak);
              
              aiAssistantRef.current?.speak(textToSpeak)
                .then(() => {
                  console.log('✅ Finished speaking');
                  setCurrentlyReading('');
                })
                .catch((error: Error) => {
                  console.error('❌ TTS Error:', error);
                  setCurrentlyReading('');
                });
            })
            .catch((error: Error) => {
              console.error('❌ Error processing message:', error);
            });
        } else {
          console.log('ℹ️ AI disabled or not available, skipping AI processing');
          console.log('  - Reason: isAIEnabled =', isAIEnabled, ', aiAssistant exists =', !!aiAssistantRef.current);
        }
      });
      
      // Now connect
      await twitchServiceRef.current.connect();

      setIsConnected(true);
      setConnectionStatus('Connected to habbi3');
    } catch (error) {
      console.error('Connection error:', error);
      setConnectionStatus('Connection failed');
    }
  };

  const disconnect = () => {
    if (twitchServiceRef.current) {
      twitchServiceRef.current.disconnect();
      setIsConnected(false);
      setConnectionStatus('Disconnected');
    }
  };

  const toggleAI = () => {
    const newAIState = !isAIEnabled;
    console.log('🎛️ Toggling AI from', isAIEnabled, 'to', newAIState);
    setIsAIEnabled(newAIState);
    
    if (newAIState && aiAssistantRef.current) {
      console.log('🚀 Starting AI assistant');
      aiAssistantRef.current.start();
    } else if (aiAssistantRef.current) {
      console.log('🛑 Stopping AI assistant');
      aiAssistantRef.current.stop();
    }
  };

  const toggleVoiceListening = async () => {
    if (!aiAssistantRef.current) return;

    if (isListening) {
      aiAssistantRef.current.stopListening();
      setIsListening(false);
      console.log('🎤 Stopped voice listening');
    } else {
      try {
        await aiAssistantRef.current.startListening((text: string) => {
          console.log('🎤 Voice command received:', text);
          
          // Create a mock message from voice input
          const voiceMessage: ChatMessage = {
            id: Date.now().toString(),
            username: 'Streamer (Voz)',
            message: text,
            timestamp: new Date()
          };

          // Add voice message to chat
          setChatMessages(prev => {
            const updated = [...prev.slice(-50), voiceMessage];
            console.log('🎤 Added voice message to chat:', voiceMessage);
            return updated;
          });

          // Process voice input with AI if enabled
          if (isAIEnabled && aiAssistantRef.current) {
            console.log('🤖 Processing voice input with AI:', text);
            aiAssistantRef.current.processMessage(text)
              .then((opinion: string) => {
                console.log('💭 AI Opinion for voice:', opinion);
                
                // Update the voice message with AI opinion
                setChatMessages(prev => 
                  prev.map(msg => 
                    msg.id === voiceMessage.id 
                      ? { ...msg, opinion }
                      : msg
                  )
                );

                // Speak the AI's response to the voice command
                const textToSpeak = `Has dicho: ${text}. Mi opinión: ${opinion}`;
                setCurrentlyReading(textToSpeak);
                console.log('🔊 Speaking response to voice:', textToSpeak);
                
                aiAssistantRef.current?.speak(textToSpeak)
                  .then(() => {
                    console.log('✅ Finished speaking voice response');
                    setCurrentlyReading('');
                  })
                  .catch((error: Error) => {
                    console.error('❌ TTS Error for voice response:', error);
                    setCurrentlyReading('');
                  });
              })
              .catch((error: Error) => {
                console.error('❌ Error processing voice input:', error);
              });
          } else {
            console.log('ℹ️ AI disabled, not processing voice input');
          }
        });
        setIsListening(true);
        console.log('🎤 Started voice listening');
      } catch (error) {
        console.error('Voice listening error:', error);
      }
    }
  };

  const clearChat = () => {
    setChatMessages([]);
  };

  const testTTS = async () => {
    if (aiAssistantRef.current) {
      const testMessage = "Hola, este es un mensaje de prueba para verificar que la síntesis de voz funciona correctamente.";
      setCurrentlyReading(testMessage);
      console.log('🧪 Testing TTS:', testMessage);
      
      try {
        await aiAssistantRef.current.speak(testMessage);
        console.log('✅ TTS test completed');
      } catch (error) {
        console.error('❌ TTS test failed:', error);
      } finally {
        setCurrentlyReading('');
      }
    }
  };

  const testAI = async () => {
    if (aiAssistantRef.current && isAIEnabled) {
      const testMessage = "Hola, ¿cómo estás?";
      console.log('🧪 Testing AI with message:', testMessage);
      
      try {
        const opinion = await aiAssistantRef.current.processMessage(testMessage);
        console.log('🤖 AI Response:', opinion);
        
        const textToSpeak = `Mensaje de prueba: ${testMessage}. Mi opinión: ${opinion}`;
        setCurrentlyReading(textToSpeak);
        
        await aiAssistantRef.current.speak(textToSpeak);
      } catch (error) {
        console.error('❌ AI test failed:', error);
      } finally {
        setCurrentlyReading('');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto p-6">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            🤖 Habbi3 AI Assistant
          </h1>
          <p className="text-gray-300">
            Asistente IA sarcástico para Twitch - Lee el chat y da opiniones picantes
          </p>
        </header>

        {/* Control Panel */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Conexión Twitch</label>
              <button
                onClick={isConnected ? disconnect : connectToTwitch}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                  isConnected
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {isConnected ? 'Desconectar' : 'Conectar'}
              </button>
              <p className="text-xs mt-1 text-gray-400">{connectionStatus}</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">IA Sarcástica</label>
              <button
                onClick={toggleAI}
                disabled={!isConnected}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                  isAIEnabled
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-gray-600 hover:bg-gray-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isAIEnabled ? 'IA Activa' : 'IA Inactiva'}
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Escucha por Voz</label>
              <button
                onClick={toggleVoiceListening}
                disabled={!isConnected}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                  isListening
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-600 hover:bg-gray-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isListening ? '🎤 Escuchando' : '🎤 Pausado'}
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Pruebas</label>
              <button
                onClick={testTTS}
                className="w-full py-2 px-4 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 transition-colors mb-1"
              >
                🔊 Test Voz
              </button>
              <button
                onClick={testAI}
                disabled={!isAIEnabled}
                className="w-full py-1 px-2 rounded text-xs bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                🤖 Test IA
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Acciones</label>
              <button
                onClick={clearChat}
                className="w-full py-2 px-4 rounded-lg font-medium bg-yellow-600 hover:bg-yellow-700 transition-colors"
              >
                Limpiar Chat
              </button>
            </div>
          </div>
        </div>

        {/* Currently Reading */}
        {currentlyReading && (
          <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-4 mb-6">
            <h3 className="font-semibold mb-2">🔊 Leyendo ahora:</h3>
            <p className="text-yellow-200">{currentlyReading}</p>
          </div>
        )}

        {/* Chat Messages */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Chat de habbi3</h2>
            <span className="text-sm text-gray-400">
              {chatMessages.length} mensajes
            </span>
          </div>
          
          <div className="max-h-96 overflow-y-auto space-y-3">
            {chatMessages.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                {isConnected 
                  ? 'Esperando mensajes del chat...' 
                  : 'Conecta para ver los mensajes del chat'
                }
              </p>
            ) : (
              chatMessages.map((msg) => (
                <div key={msg.id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-purple-400">
                      {msg.username}
                    </span>
                    <span className="text-xs text-gray-500">
                      {msg.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-gray-200 mb-2">{msg.message}</p>
                  {msg.opinion && (
                    <div className="bg-purple-900 rounded p-3 mt-2 border-l-4 border-purple-500">
                      <p className="text-purple-200 text-sm">
                        <span className="font-semibold">🤖 Opinión IA:</span> {msg.opinion}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-8 text-gray-400">
          <p>Hecho con 💜 para el canal de habbi3 | Totalmente gratis</p>
        </footer>
      </div>
    </div>
  );
}
