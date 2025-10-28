import { useBeaches } from '@/contexts/BeachContext';
import { ALL_BEACHES } from '@/constants/beaches';
import { Beach } from '@/types/beach';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import { router } from 'expo-router';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  Image
} from 'react-native';
import BeachHeader from '@/components/BeachHeader';
import AdBannerPlaceholder from '@/components/AdBannerPlaceholder';

export default function FavoritesScreen() {
  const { favorites, toggleFavorite, addBeachToHome } = useBeaches();

  const favoriteBeaches = ALL_BEACHES.filter(beach => favorites.includes(beach.id));

  const handleRemoveFavorite = (beachId: string) => {
    toggleFavorite(beachId);
  };

  const handleViewBeach = async (beach: Beach) => {
    await addBeachToHome(beach);
    router.push('/(tabs)');
  };

  const renderBeachItem = ({ item }: { item: Beach }) => (
    <View style={styles.beachCard}>
      <TouchableOpacity 
        style={styles.beachContent}
        onPress={() => handleViewBeach(item)}
        activeOpacity={0.7}
      >
        <Image 
          source={typeof item.imageUrl === 'number' ? item.imageUrl : { uri: item.imageUrl as string }} 
          style={styles.beachThumbnail}
          resizeMode="cover"
        />
        <View style={styles.beachInfo}>
          <Text style={styles.beachName}>{item.name}</Text>
          <Text style={styles.beachState}>{item.state}</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.removeButton}
        onPress={() => handleRemoveFavorite(item.id)}
      >
        <Feather name="trash-2" size={20} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <BeachHeader showBeachInfo={false} />
      {favoriteBeaches.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="heart" size={64} color="#CBD5E1" />
          <Text style={styles.emptyText}>No favorite beaches yet</Text>
          <Text style={styles.emptySubtext}>
            Tap the heart icon on any beach to add it to your favorites
          </Text>
        </View>
      ) : (
        <>
          <AdBannerPlaceholder size="banner" />
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Favorite Beaches</Text>
            <Text style={styles.headerSubtitle}>
              {favoriteBeaches.length} {favoriteBeaches.length === 1 ? 'beach' : 'beaches'}
            </Text>
          </View>
          <FlatList
            data={favoriteBeaches}
            renderItem={renderBeachItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerContainer: {
    padding: 16,
    backgroundColor: '#F8FAFC',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
  },
  beachCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  beachContent: {
    flex: 1,
    flexDirection: 'row',
  },
  beachThumbnail: {
    width: 100,
    height: 100,
  },
  beachInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  beachName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1E293B',
  },
  beachState: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  removeButton: {
    width: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#1E293B',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
  },
});
