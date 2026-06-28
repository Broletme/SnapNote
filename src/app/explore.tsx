import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'msg-1',
    sender: 'user',
    text: "Can you summarize the Newton's laws from my Physics notes?",
    time: '10:30 AM',
  },
  {
    id: 'msg-2',
    sender: 'ai',
    text: "Based on your Physics notes, Newton's three laws of motion are:\n\n• First Law (Inertia): An object remains at rest or in uniform motion unless acted upon by an external force.\n\n• Second Law (F = ma): Acceleration is produced when a force acts on a mass. The force is equal to mass multiplied by acceleration.\n\n• Third Law (Action-Reaction): For every action, there is an equal and opposite reaction.",
    time: '10:31 AM',
  },
  {
    id: 'msg-3',
    sender: 'user',
    text: 'What are the key formulas for electromagnetism?',
    time: '10:33 AM',
  },
  {
    id: 'msg-4',
    sender: 'ai',
    text: "Here are the essential electromagnetism formulas extracted from your classroom slides:\n\n• Coulomb's Law: F = k * (|q₁q₂|) / r²\n• Ohm's Law: V = I * R\n• Electric Field: E = F / q\n• Faraday's Law: EMF = -dΦ/dt",
    time: '10:34 AM',
  },
];

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    // Simulate AI typing and responding
    setIsAiTyping(true);
    setTimeout(() => {
      const aiMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        sender: 'ai',
        text: `I've checked your notes on that topic. Here is what I found:\n\n• Related concept: We've saved classroom images matching "${userMessage.text}".\n• Summary: In your imported notes, key concepts are being indexed. Make sure to import more photos of your slides to get complete formulas and explanations!`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsAiTyping(false);
    }, 1000);
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
          <Text style={styles.headerTitle}>Ask your notes</Text>
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
                <Text style={styles.typingText}>SnapNotes AI is typing...</Text>
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
            <Text style={styles.sendButtonText}>Send</Text>
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
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e1e',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.5,
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
    backgroundColor: '#6c63ff',
    borderBottomRightRadius: 4,
  },
  messageAiBubble: {
    backgroundColor: '#1e1e1e',
    borderColor: '#2e2e2e',
    borderWidth: 1,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 22,
  },
  messageTime: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 6,
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e1e1e',
    backgroundColor: '#0f0f0f',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#2e2e2e',
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#6c63ff',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
