import { useBeaches } from '@/contexts/BeachContext';
import { useLocation } from '@/contexts/LocationContext';
import { ALL_BEACHES, POPULAR_BEACHES } from '@/constants/beaches';
import { Beach, BeachSearchResult } from '@/types/beach';
import { Feather } from '@expo/vector-icons';
import React, { useState, useMemo } from 'react';
import { router } from 'expo-router';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  FlatList, 
  TouchableOpacity,
  ActivityIndicator,
  Image
} from 'react-native';
import BeachHeader from '@/components/BeachHeader';
import AdBannerPlaceholder from '@/components/AdBannerPlaceholder';

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const { location, isLoading: locationLoading, calculateDistance } = useLocation();
  const { addBeachToHome, homeBeaches } = useBeaches();

  const searchResults = useMemo<BeachSearchResult[]>(() => {
    let beaches = ALL_BEACHES;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      beaches = beaches.filter(beach => 
        beach.name.toLowerCase().includes(query) ||
        beach.state.toLowerCase().includes(query)
      );
    }

    if (location) {
      return beaches
        .map(beach => ({
          beach,
          distance: calculateDistance(
            location.latitude,
            location.longitude,
            beach.latitude,
            beach.longitude
          ),
        }))
        .sort((a, b) => a.distance! - b.distance!)
        .slice(0, searchQuery.trim() ? beaches.length : 5);
    }

    return (searchQuery.trim() ? beaches : POPULAR_BEACHES).map(beach => ({ beach }));
  }, [searchQuery, location, calculateDistance]);

  const isBeachInHome = (beachId: string) => {
    return homeBeaches.some(b => b.id === beachId);
  };

  const handleAddBeach = (beach: Beach) => {
    addBeachToHome(beach);
    router.push('/(tabs)');
  };

  const renderBeachItem = ({ item }: { item: BeachSearchResult }) => {
    const inHome = isBeachInHome(item.beach.id);

    return (
      <View style={styles.beachCard}>
        <Image 
          source={typeof item.beach.imageUrl === 'number' ? item.beach.imageUrl : { uri: item.beach.imageUrl as string }} 
          style={styles.beachThumbnail}
          resizeMode="cover"
        />
        <View style={styles.beachInfo}>
          <Text style={styles.beachName}>{item.beach.name}</Text>
          <Text style={styles.beachState}>{item.beach.state}</Text>
          {item.distance !== undefined && (
            <View style={styles.distanceRow}>
              <Feather name="map-pin" size={14} color="#64748B" />
              <Text style={styles.distanceText}>{item.distance.toFixed(1)} miles away</Text>
            </View>
          )}
        </View>
        <TouchableOpacity 
          style={[styles.addButton, inHome && styles.addedButton]}
          onPress={() => handleAddBeach(item.beach)}
          disabled={inHome}
        >
          {inHome ? (
            <Feather name="check" size={20} color="#10B981" />
          ) : (
            <Feather name="plus" size={20} color="#0EA5E9" />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <BeachHeader showBeachInfo={false} />
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Feather name="search" size={20} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search beaches..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94A3B8"
          />
        </View>
      </View>

      {locationLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0EA5E9" />
          <Text style={styles.loadingText}>Finding beaches near you...</Text>
        </View>
      ) : (
        <>
          <AdBannerPlaceholder size="banner" />
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>
              {searchQuery.trim() 
                ? 'Search Results' 
                : location 
                  ? 'Nearest Beaches' 
                  : 'Popular Beaches'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {searchResults.length} {searchResults.length === 1 ? 'beach' : 'beaches'}
            </Text>
          </View>

          <FlatList
            data={searchResults}
            renderItem={renderBeachItem}
            keyExtractor={(item) => item.beach.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Feather name="search" size={64} color="#CBD5E1" />
                <Text style={styles.emptyText}>No beaches found</Text>
                <Text style={styles.emptySubtext}>Try a different search term</Text>
              </View>
            }
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
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  headerContainer: {
    padding: 16,
    paddingBottom: 8,
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
    paddingTop: 8,
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
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  distanceText: {
    fontSize: 12,
    color: '#64748B',
  },
  addButton: {
    width: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
  },
  addedButton: {
    backgroundColor: '#F0FDF4',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
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
  },
});
