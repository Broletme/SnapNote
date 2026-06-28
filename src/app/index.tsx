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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { extractNotesFromImage } from '@/services/groq';

interface CardItem {
  id: string;
  title: string;
  notesCount?: string;
  date: string;
  content?: string;
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
          
          // Split notes to find the first non-empty line as title
          const lines = notesText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
          const title = lines[0] || 'Extracted Note';
          const bodyText = lines.slice(1).join('\n');

          newCards.push({
            id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title,
            content: bodyText || notesText,
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
          {cards.map(card => (
            <View key={card.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {card.title}
                  </Text>
                  {card.notesCount && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{card.notesCount}</Text>
                    </View>
                  )}
                </View>
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

              {card.content && (
                <Text style={styles.cardContent} numberOfLines={4}>
                  {card.content}
                </Text>
              )}

              <Text style={styles.cardDate}>{card.date}</Text>
            </View>
          ))}
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    maxWidth: '80%',
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
  cardContent: {
    fontSize: 14,
    color: '#dddddd',
    lineHeight: 20,
    marginBottom: 12,
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
});
