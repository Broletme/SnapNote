import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Modal,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import ImageView from 'react-native-image-viewing';
import { extractNotesFromImage } from '@/services/groq';

function parseNotes(text: string, fallbackTitle: string) {
  let type = '';
  let subject = '';
  let title = fallbackTitle.replace(/^[#\s]+/, '').trim();
  let whatThisIs = '';
  let explanation = '';
  let keyTakeaway = '';

  const lines = text.split('\n');
  let currentSection = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (currentSection === 'WHAT THIS IS') whatThisIs += '\n';
      else if (currentSection === 'EXPLANATION') explanation += '\n';
      else if (currentSection === 'KEY TAKEAWAY') keyTakeaway += '\n';
      continue;
    }

    if (trimmed.startsWith('TYPE:')) {
      type = trimmed.substring(5).trim();
      currentSection = 'TYPE';
    } else if (trimmed.startsWith('SUBJECT:')) {
      subject = trimmed.substring(8).trim();
      currentSection = 'SUBJECT';
    } else if (trimmed.startsWith('TITLE:')) {
      title = trimmed.substring(6).trim();
      currentSection = 'TITLE';
    } else if (trimmed.startsWith('WHAT THIS IS:')) {
      whatThisIs = trimmed.substring(13).trim();
      currentSection = 'WHAT THIS IS';
    } else if (trimmed.startsWith('EXPLANATION:')) {
      explanation = trimmed.substring(12).trim();
      currentSection = 'EXPLANATION';
    } else if (trimmed.startsWith('KEY TAKEAWAY:')) {
      keyTakeaway = trimmed.substring(13).trim();
      currentSection = 'KEY TAKEAWAY';
    } else {
      if (currentSection === 'WHAT THIS IS') {
        whatThisIs += (whatThisIs ? '\n' : '') + trimmed;
      } else if (currentSection === 'EXPLANATION') {
        explanation += (explanation ? '\n' : '') + trimmed;
      } else if (currentSection === 'KEY TAKEAWAY') {
        keyTakeaway += (keyTakeaway ? '\n' : '') + trimmed;
      }
    }
  }

  if (!type && !whatThisIs && !explanation && text) {
    explanation = text;
  }

  return { type, subject, title, whatThisIs, explanation, keyTakeaway };
}

interface CardItem {
  id: string;
  title: string;
  topic?: string;
  keyPoints?: string[];
  notesCount?: string;
  date: string;
  content?: string;
  imageUri?: string;
  isPlaceholder: boolean;
}

const INITIAL_CARDS: CardItem[] = [
  {
    id: 'placeholder-physics',
    title: 'Physics',
    notesCount: '12 notes',
    date: 'Last updated: 2 days ago',
    isPlaceholder: true,
  },
  {
    id: 'placeholder-math',
    title: 'Math',
    notesCount: '8 notes',
    date: 'Last updated: Yesterday',
    isPlaceholder: true,
  },
  {
    id: 'placeholder-chemistry',
    title: 'Chemistry',
    notesCount: '5 notes',
    date: 'Last updated: 3 days ago',
    isPlaceholder: true,
  },
];

export default function NotesScreen() {
  const [cards, setCards] = useState<CardItem[]>(INITIAL_CARDS);
  const [loading, setLoading] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CardItem | null>(null);
  const [isImageViewVisible, setIsImageViewVisible] = useState(false);

  const handlePickAndProcessImages = async () => {
    try {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Permission to access the photo gallery is required to import classroom photos.'
        );
        return;
      }

      // Launch the image picker with multiple selection enabled
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      setLoading(true);

      // Process each selected image with Groq API
      const newCards: CardItem[] = [];
      for (const asset of result.assets) {
        try {
          const notesText = await extractNotesFromImage(asset.uri);
          
          newCards.push({
            id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            title: 'Extracted Note',
            content: notesText,
            imageUri: asset.uri,
            date: 'Just now',
            isPlaceholder: false,
          });
        } catch (err) {
          console.error(`Failed to process image: ${asset.uri}`, err);
          Alert.alert('Processing Error', `Could not extract text from one of the images. Make sure your Groq API key is valid.`);
        }
      }

      if (newCards.length > 0) {
        setCards(prev => [...prev, ...newCards]);
      }
    } catch (error) {
      console.error('Gallery picker error:', error);
      Alert.alert('Error', 'An unexpected error occurred while picking photos.');
    } finally {
      setLoading(false);
    }
  };

  const deleteCard = (id: string) => {
    setCards(prev => prev.filter(card => card.id !== id));
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f0f" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>SnapNotes</Text>
          <Text style={styles.headerSubtitle}>your classroom knowledge base</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {cards.map(card => {
            const rawText = card.title + '\n' + (card.content || '');
            const parsed = card.isPlaceholder 
              ? { type: 'Sample', subject: 'General', title: card.title, whatThisIs: 'Placeholder content', explanation: card.content || '', keyTakeaway: '' }
              : parseNotes(rawText, card.title);

            return (
            <TouchableOpacity 
              key={card.id} 
              style={styles.card}
              activeOpacity={0.7}
              onPress={() => setSelectedCard(card)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {parsed.title}
                  </Text>
                  <View style={styles.badgesRow}>
                    {parsed.subject && parsed.subject.toLowerCase() !== 'general' ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{parsed.subject}</Text>
                      </View>
                    ) : null}
                    {parsed.type ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{parsed.type}</Text>
                      </View>
                    ) : null}
                    {card.notesCount && !parsed.type && !parsed.subject ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{card.notesCount}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
                <View style={styles.cardHeaderRight}>
                  {card.imageUri ? (
                    <Image source={{ uri: card.imageUri }} style={styles.cardThumbnail} />
                  ) : null}
                  {!card.isPlaceholder && (
                    <TouchableOpacity
                      onPress={() => deleteCard(card.id)}
                      style={styles.deleteButton}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.deleteButtonText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {parsed.whatThisIs ? (
                <Text style={styles.cardWhatThisIs} numberOfLines={2}>
                  {parsed.whatThisIs}
                </Text>
              ) : null}

              {parsed.explanation ? (
                <View style={styles.explanationContainer}>
                  <Text style={styles.cardContent} numberOfLines={2}>
                    {parsed.explanation}
                  </Text>
                  <Text style={styles.moreText}>+ more</Text>
                </View>
              ) : null}

              {parsed.keyTakeaway ? (
                <Text style={styles.cardNote} numberOfLines={2}>
                  💡 {parsed.keyTakeaway}
                </Text>
              ) : null}

              <Text style={styles.cardDate}>{card.date}</Text>
            </TouchableOpacity>
          )})}
        </ScrollView>

        {/* Floating Add Button */}
        <TouchableOpacity
          onPress={handlePickAndProcessImages}
          style={styles.fab}
          activeOpacity={0.8}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>

        {/* Loading Overlay */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#6c63ff" />
            <Text style={styles.loadingText}>Processing photos with Groq AI...</Text>
          </View>
        )}

        {/* Detail Modal */}
        <Modal
          visible={!!selectedCard}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setSelectedCard(null)}
        >
          {selectedCard && (() => {
            const rawText = selectedCard.title + '\n' + (selectedCard.content || '');
            const parsed = selectedCard.isPlaceholder 
              ? { type: 'Sample', subject: 'General', title: selectedCard.title, whatThisIs: 'Placeholder content', explanation: selectedCard.content || '', keyTakeaway: '' }
              : parseNotes(rawText, selectedCard.title);

            return (
              <SafeAreaView style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={() => setSelectedCard(null)} style={styles.closeButton}>
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={styles.modalScrollContent}>
                  {selectedCard.imageUri ? (
                    <TouchableOpacity activeOpacity={0.8} onPress={() => setIsImageViewVisible(true)}>
                      <Image 
                        source={{ uri: selectedCard.imageUri }} 
                        style={styles.modalImage} 
                        resizeMode="cover" 
                      />
                    </TouchableOpacity>
                  ) : null}
                  <Text style={styles.modalTitle}>{parsed.title}</Text>
                  <View style={styles.modalBadgesRow}>
                    {parsed.subject && parsed.subject.toLowerCase() !== 'general' ? (
                      <View style={[styles.badge, styles.modalBadge]}>
                        <Text style={styles.badgeText}>{parsed.subject}</Text>
                      </View>
                    ) : null}
                    {parsed.type ? (
                      <View style={[styles.badge, styles.modalBadge]}>
                        <Text style={styles.badgeText}>{parsed.type}</Text>
                      </View>
                    ) : null}
                  </View>
                  
                  {parsed.whatThisIs ? (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionLabel}>WHAT THIS IS</Text>
                      <Text style={styles.modalWhatThisIs}>{parsed.whatThisIs}</Text>
                    </View>
                  ) : null}

                  {parsed.explanation ? (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionLabel}>EXPLANATION</Text>
                      <Text style={styles.modalContentText}>{parsed.explanation}</Text>
                    </View>
                  ) : null}

                  {parsed.keyTakeaway ? (
                    <View style={styles.modalNoteContainer}>
                      <Text style={styles.modalNoteText}>💡 {parsed.keyTakeaway}</Text>
                    </View>
                  ) : null}
                </ScrollView>
              </SafeAreaView>
            );
          })()}
        </Modal>

        <ImageView
          images={selectedCard?.imageUri ? [{ uri: selectedCard.imageUri }] : []}
          imageIndex={0}
          visible={isImageViewVisible}
          onRequestClose={() => setIsImageViewVisible(false)}
        />
      </View>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#aaaaaa',
    marginTop: 4,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100, // Extra padding to scroll past the FAB
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2e2e2e',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardTitleContainer: {
    flex: 1,
    paddingRight: 10,
    justifyContent: 'flex-start',
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#2e2e2e',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    maxWidth: '80%',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    width: '100%',
  },
  badge: {
    backgroundColor: '#3a3a5a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    color: '#a3a0e4',
    fontWeight: '600',
  },
  deleteButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#ff4a4a',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardWhatThisIs: {
    fontSize: 13,
    color: '#aaaaaa',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  explanationContainer: {
    marginBottom: 12,
  },
  cardContent: {
    fontSize: 14,
    color: '#dddddd',
    lineHeight: 20,
  },
  moreText: {
    fontSize: 13,
    color: '#6c63ff',
    marginTop: 4,
    fontWeight: '600',
  },
  cardNote: {
    fontSize: 13,
    color: '#f5d44f',
    marginTop: 8,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  cardDate: {
    fontSize: 12,
    color: '#888888',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#6c63ff',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  fabText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'normal',
    lineHeight: 28,
  },
  loadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 15, 15, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    paddingRight: 20,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#ff4a4a',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalScrollContent: {
    padding: 24,
    paddingTop: 0,
    paddingBottom: 40,
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: '#1e1e1e',
  },
  modalTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  modalBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  modalBadge: {
    marginBottom: 0,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionLabel: {
    fontSize: 12,
    color: '#888888',
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 8,
  },
  modalWhatThisIs: {
    fontSize: 16,
    color: '#aaaaaa',
    fontStyle: 'italic',
    lineHeight: 24,
  },
  modalNoteContainer: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f5d44f',
  },
  modalNoteText: {
    fontSize: 15,
    color: '#f5d44f',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  modalBulletPoint: {
    fontSize: 18,
    color: '#dddddd',
    marginRight: 10,
    lineHeight: 26,
  },
  modalBulletText: {
    flex: 1,
    fontSize: 16,
    color: '#dddddd',
    lineHeight: 26,
  },
  modalContentText: {
    fontSize: 16,
    color: '#dddddd',
    lineHeight: 26,
  },
});
