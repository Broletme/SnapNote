import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { answerFromNotes } from '../services/chat';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [savedNotes, setSavedNotes] = useState<any[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    async function loadNotes() {
      try {
        const jsonValue = await AsyncStorage.getItem('snapnotes_data');
        if (jsonValue != null) {
          setSavedNotes(JSON.parse(jsonValue));
        }
      } catch (e) {
        console.error('Failed to load notes for chat:', e);
      }
    }
    loadNotes();
  }, []);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsAiTyping(true);

    if (savedNotes.length === 0) {
      setTimeout(() => {
        const aiMessage: Message = {
          id: `msg-${Date.now() + 1}`,
          sender: 'ai',
          text: "You have no notes yet. Go to Home and import some classroom photos first!",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, aiMessage]);
        setIsAiTyping(false);
      }, 500);
      return;
    }

    try {
      const responseText = await answerFromNotes(userMessage.text, savedNotes);
      const aiMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        sender: 'ai',
        text: responseText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        sender: 'ai',
        text: "Sorry, I couldn't connect to the AI. Make sure your API key is valid.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAiTyping(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f0f" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            Ask your <Text style={styles.headerTitleHighlight}>notes</Text> ✨
          </Text>
          <Text style={styles.headerSubtitle}>Powered by SnapNotes AI</Text>
        </View>

        {/* Messages List */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map(message => {
            const isUser = message.sender === 'user';
            return (
              <View
                key={message.id}
                style={[
                  styles.messageWrapper,
                  isUser ? styles.messageUserWrapper : styles.messageAiWrapper,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    isUser ? styles.messageUserBubble : styles.messageAiBubble,
                  ]}
                >
                  <Text style={styles.messageText}>{message.text}</Text>
                  <Text style={styles.messageTime}>{message.time}</Text>
                </View>
              </View>
            );
          })}

          {isAiTyping && (
            <View style={[styles.messageWrapper, styles.messageAiWrapper]}>
              <View style={[styles.messageBubble, styles.messageAiBubble, styles.typingBubble]}>
                <Text style={styles.typingText}>...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Ask a question about your notes..."
            placeholderTextColor="#888888"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSend}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-up" size={24} color="#0f0f0f" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 50 : 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e1e',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  headerTitleHighlight: {
    color: '#6c63ff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#aaaaaa',
    marginTop: 4,
    fontWeight: '500',
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: 20,
    paddingBottom: 30,
    gap: 16,
  },
  messageWrapper: {
    flexDirection: 'row',
    width: '100%',
  },
  messageUserWrapper: {
    justifyContent: 'flex-end',
  },
  messageAiWrapper: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageUserBubble: {
    backgroundColor: '#6366f1',
    borderBottomRightRadius: 4,
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  messageAiBubble: {
    backgroundColor: '#1c1c1e',
    borderWidth: 0,
    borderBottomLeftRadius: 4,
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  messageText: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 24,
  },
  messageTime: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  typingBubble: {
    opacity: 0.7,
  },
  typingText: {
    color: '#aaaaaa',
    fontSize: 13,
    fontStyle: 'italic',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: '#0f0f0f',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#1c1c1e',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
    color: '#ffffff',
    fontSize: 16,
    maxHeight: 120,
  },
  sendButton: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    marginBottom: 2,
  },
});
