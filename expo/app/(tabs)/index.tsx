import { useBeaches } from '@/contexts/BeachContext';
import { fetchBeachConditions, getUVGuidance } from '@/services/beachApi';
import { BeachConditions } from '@/types/beach';
import { useQuery } from '@tanstack/react-query';
import { router, useFocusEffect } from 'expo-router';
import { 
  ChevronLeft, 
  ChevronRight, 
  Droplets, 
  Wind, 
  Waves, 
  Sun, 
  Sunrise, 
  Sunset,
  Camera,
  AlertTriangle,
  Thermometer,
  Shirt,
  Clock,
  Umbrella,
  ArrowUp,
  ArrowDown,
  X
} from 'lucide-react-native';
import React, { useCallback, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  Dimensions,
  Linking,
  Alert
} from 'react-native';
import BeachHeader from '@/components/BeachHeader';
import AdBannerPlaceholder from '@/components/AdBannerPlaceholder';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { homeBeaches, selectedBeachId, toggleFavorite, isFavorite, isLoading: beachesLoading, clearSelectedBeach, removeBeachFromHome } = useBeaches();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const currentBeach = homeBeaches[currentIndex];

  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  React.useEffect(() => {
    if (homeBeaches.length > 0 && currentIndex > homeBeaches.length - 1) {
      setCurrentIndex(homeBeaches.length - 1);
    }
  }, [homeBeaches.length, currentIndex]);

  React.useEffect(() => {
    if (selectedBeachId && homeBeaches.length > 0) {
      const index = homeBeaches.findIndex(b => b.id === selectedBeachId);
      if (index !== -1) {
        setCurrentIndex(index);
      }
      clearSelectedBeach();
    }
  }, [selectedBeachId, homeBeaches, clearSelectedBeach]);

  const { data: conditions, isLoading: conditionsLoading, error: conditionsError } = useQuery<BeachConditions>({
    queryKey: ['beachConditions', currentBeach?.id],
    queryFn: () => {
      console.log('[HomeScreen] Fetching conditions for beach:', currentBeach?.name);
      return fetchBeachConditions(currentBeach!);
    },
    enabled: !!currentBeach,
    refetchInterval: 300000,
    retry: 2,
    retryDelay: 1000,
  });

  if (conditionsError) {
    console.error('[HomeScreen] Error loading conditions:', conditionsError);
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : homeBeaches.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < homeBeaches.length - 1 ? prev + 1 : 0));
  };

  const handleFavorite = () => {
    if (currentBeach) {
      toggleFavorite(currentBeach.id);
    }
  };

  const handleRemove = () => {
    if (!currentBeach || isFavorite(currentBeach.id)) {
      return;
    }
    const beachToRemove = currentBeach;
    Alert.alert(
      'Remove Beach',
      `Remove ${beachToRemove.name} from your home page?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeBeachFromHome(beachToRemove.id);
          },
        },
      ]
    );
  };

  const openCamera = () => {
    if (currentBeach?.cameraUrl) {
      Linking.openURL(currentBeach.cameraUrl);
    }
  };

  const openAlerts = () => {
    if (conditions) {
      router.push({
        pathname: '/alerts',
        params: {
          alerts: JSON.stringify(conditions.alerts),
          flagColor: conditions.flagWarning,
          beachName: currentBeach.name,
        },
      });
    }
  };

  if (beachesLoading) {
    console.log('[HomeScreen] Beaches still loading...');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0EA5E9" />
        <Text style={styles.loadingText}>Loading beaches...</Text>
      </View>
    );
  }

  console.log('[HomeScreen] Beaches loaded, count:', homeBeaches.length);

  if (!currentBeach) {
    return (
      <View style={styles.container}>
        <BeachHeader />
        <View style={styles.emptyContainer}>
          <Waves size={64} color="#94A3B8" />
          <Text style={styles.emptyText}>No beaches added yet</Text>
          <Text style={styles.emptySubtext}>Search for beaches to get started</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BeachHeader 
        beachName={currentBeach.name}
        location={`${currentBeach.name}, ${currentBeach.state}`}
        onFavorite={handleFavorite}
        isFavorite={isFavorite(currentBeach.id)}
      />
      <ScrollView ref={scrollViewRef} style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image 
            source={typeof currentBeach.imageUrl === 'number' ? currentBeach.imageUrl : { uri: currentBeach.imageUrl as string }} 
            style={styles.beachImage}
            resizeMode="cover"
          />
          {!isFavorite(currentBeach.id) && (
            <TouchableOpacity style={styles.removeButton} onPress={handleRemove} activeOpacity={0.8}>
              <X size={20} color="#FFF" strokeWidth={2.5} />
            </TouchableOpacity>
          )}
          <View style={styles.imageOverlay}>
            {homeBeaches.length > 1 && (
              <View style={styles.navigationRow}>
                <TouchableOpacity style={styles.navButton} onPress={handlePrevious}>
                  <ChevronLeft size={28} color="#FFF" />
                </TouchableOpacity>
                <View style={styles.paginationDots}>
                  {homeBeaches.map((_, index) => (
                    <View 
                      key={index}
                      style={[
                        styles.dot,
                        index === currentIndex && styles.activeDot
                      ]}
                    />
                  ))}
                </View>
                <TouchableOpacity style={styles.navButton} onPress={handleNext}>
                  <ChevronRight size={28} color="#FFF" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {conditionsLoading ? (
          <View style={styles.loadingSection}>
            <ActivityIndicator size="large" color="#0EA5E9" />
            <Text style={styles.loadingText}>Loading conditions...</Text>
          </View>
        ) : conditions ? (
          <View style={styles.content}>
            <AdBannerPlaceholder size="banner" />
            {conditions.flagWarning !== 'none' && (
              <TouchableOpacity 
                style={[styles.warningBanner, { backgroundColor: getFlagColor(conditions.flagWarning) }]}
                onPress={openAlerts}
                activeOpacity={0.8}
              >
                <AlertTriangle size={20} color="#FFF" />
                <Text style={styles.warningText}>{conditions.warningMessage}</Text>
                <ChevronRight size={20} color="#FFF" />
              </TouchableOpacity>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Current Conditions</Text>
              <View style={styles.conditionsGrid}>
                <View style={styles.conditionCard}>
                  <Thermometer size={24} color="#0EA5E9" />
                  <Text style={styles.conditionValue}>{conditions.weather.temperature}°F</Text>
                  <Text style={styles.conditionLabel}>Air Temperature</Text>
                </View>
                <View style={styles.conditionCard}>
                  <Wind size={24} color="#0EA5E9" />
                  <Text style={styles.conditionValue}>{conditions.weather.windSpeed} mph</Text>
                  <Text style={styles.conditionLabel}>Wind {conditions.weather.windDirection}</Text>
                </View>
                <View style={styles.conditionCard}>
                  <Droplets size={24} color="#0EA5E9" />
                  <Text style={styles.conditionValue}>{conditions.weather.humidity}%</Text>
                  <Text style={styles.conditionLabel}>Humidity</Text>
                </View>
                <View style={styles.conditionCard}>
                  <Waves size={24} color="#0EA5E9" />
                  <Text style={styles.conditionValue}>{conditions.surf.height.toFixed(1)} ft</Text>
                  <Text style={styles.conditionLabel}>Surf Height</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Water Temperature</Text>
              <View style={styles.infoCard}>
                <Droplets size={20} color="#0EA5E9" />
                <Text style={styles.infoText}>{conditions.waterQuality.temperature.toFixed(1)}°F</Text>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.uvProtectionCard}>
                <View style={styles.uvHeader}>
                  <Sun size={20} color="#B45309" />
                  <Text style={styles.uvProtectionTitle}>UV Protection Guide</Text>
                </View>
                
                <View style={styles.uvBadgeContainer}>
                  <View style={[styles.uvBadge, { backgroundColor: getUVColor(conditions.weather.uvIndex) }]}>
                    <Text style={styles.uvBadgeText}>UV {conditions.weather.uvIndex}</Text>
                  </View>
                  <Text style={styles.uvRiskText}>{getUVGuidance(conditions.weather.uvIndex)}</Text>
                </View>

                <View style={styles.uvRecommendations}>
                  <View style={styles.uvRecommendation}>
                    <Sun size={18} color="#B45309" />
                    <View style={styles.uvRecommendationText}>
                      <Text style={styles.uvRecommendationTitle}>Sunscreen</Text>
                      <Text style={styles.uvRecommendationDetail}>{getSunscreenRecommendation(conditions.weather.uvIndex)}</Text>
                    </View>
                  </View>

                  <View style={styles.uvRecommendation}>
                    <Shirt size={18} color="#B45309" />
                    <View style={styles.uvRecommendationText}>
                      <Text style={styles.uvRecommendationTitle}>Clothing</Text>
                      <Text style={styles.uvRecommendationDetail}>{getClothingRecommendation(conditions.weather.uvIndex)}</Text>
                    </View>
                  </View>

                  <View style={styles.uvRecommendation}>
                    <Clock size={18} color="#B45309" />
                    <View style={styles.uvRecommendationText}>
                      <Text style={styles.uvRecommendationTitle}>Timing</Text>
                      <Text style={styles.uvRecommendationDetail}>Seek shade during midday hours</Text>
                    </View>
                  </View>

                  <View style={styles.uvRecommendation}>
                    <Umbrella size={18} color="#B45309" />
                    <View style={styles.uvRecommendationText}>
                      <Text style={styles.uvRecommendationTitle}>Shade</Text>
                      <Text style={styles.uvRecommendationDetail}>{getShadeRecommendation(conditions.weather.uvIndex)}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sun Times</Text>
              <View style={styles.sunTimesContainer}>
                <View style={styles.sunTimeCard}>
                  <Sunrise size={24} color="#F59E0B" />
                  <Text style={styles.sunTimeLabel}>Sunrise</Text>
                  <Text style={styles.sunTimeValue}>{conditions.sunData.sunrise}</Text>
                </View>
                <View style={styles.sunTimeCard}>
                  <Sunset size={24} color="#F97316" />
                  <Text style={styles.sunTimeLabel}>Sunset</Text>
                  <Text style={styles.sunTimeValue}>{conditions.sunData.sunset}</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tide Information</Text>
              {(() => {
                const now = new Date();
                const currentTime = now.getHours() * 60 + now.getMinutes();
                
                const tidesWithMinutes = conditions.tides.map(tide => {
                  const [time, period] = tide.time.split(' ');
                  const [hours, minutes] = time.split(':').map(Number);
                  let totalMinutes = hours * 60 + minutes;
                  if (period === 'PM' && hours !== 12) totalMinutes += 12 * 60;
                  if (period === 'AM' && hours === 12) totalMinutes = minutes;
                  return { ...tide, totalMinutes };
                });
                
                let previousTide = null;
                let nextTide = null;
                
                for (let i = 0; i < tidesWithMinutes.length; i++) {
                  if (tidesWithMinutes[i].totalMinutes <= currentTime) {
                    previousTide = tidesWithMinutes[i];
                  }
                  if (tidesWithMinutes[i].totalMinutes > currentTime && !nextTide) {
                    nextTide = tidesWithMinutes[i];
                    break;
                  }
                }
                
                if (!previousTide && tidesWithMinutes.length > 0) {
                  previousTide = tidesWithMinutes[tidesWithMinutes.length - 1];
                }
                if (!nextTide && tidesWithMinutes.length > 0) {
                  nextTide = tidesWithMinutes[0];
                }
                
                const isRising = previousTide?.type === 'low' && nextTide?.type === 'high';
                const currentHeight = previousTide && nextTide 
                  ? previousTide.height + (nextTide.height - previousTide.height) * 0.5
                  : previousTide?.height || 0;
                
                return (
                  <>
                    <View style={styles.currentTideCard}>
                      <View style={styles.currentTideHeader}>
                        <Waves size={28} color="#0EA5E9" />
                        <Text style={styles.currentTideTitle}>Current Tide</Text>
                      </View>
                      <View style={styles.currentTideContent}>
                        <Text style={styles.currentTideHeight}>{currentHeight.toFixed(1)} ft</Text>
                        <View style={[styles.tideTrend, isRising ? styles.tideTrendRising : styles.tideTrendFalling]}>
                          {isRising ? <ArrowUp size={20} color="#0EA5E9" /> : <ArrowDown size={20} color="#F59E0B" />}
                          <Text style={[styles.tideTrendText, isRising ? styles.tideTrendTextRising : styles.tideTrendTextFalling]}>
                            {isRising ? 'Rising' : 'Falling'}
                          </Text>
                        </View>
                      </View>
                    </View>
                    {conditions.tides.map((tide, index) => (
                      <View key={index} style={styles.tideRow}>
                        <Text style={styles.tideTime}>{tide.time}</Text>
                        <Text style={[styles.tideType, tide.type === 'high' ? styles.highTide : styles.lowTide]}>
                          {tide.type === 'high' ? 'High' : 'Low'} Tide
                        </Text>
                        <Text style={styles.tideHeight}>{tide.height.toFixed(1)} ft</Text>
                      </View>
                    ))}
                  </>
                );
              })()}
            </View>

            <AdBannerPlaceholder size="medium" />

            {currentBeach.cameraUrl && (
              <View>
                <TouchableOpacity style={styles.cameraButton} onPress={openCamera}>
                  <Camera size={20} color="#FFF" />
                  <Text style={styles.cameraButtonText}>View Live Camera</Text>
                  {currentBeach.cameraType === 'nearby' && (
                    <View style={styles.nearbyBadge}>
                      <Text style={styles.nearbyBadgeText}>Nearby</Text>
                    </View>
                  )}
                </TouchableOpacity>
                {currentBeach.cameraType === 'nearby' && (
                  <Text style={styles.nearbyCaption}>
                    Nearby camera — shows the closest live view, not this exact beach.
                  </Text>
                )}
              </View>
            )}

            <Text style={styles.lastUpdated}>
              Last updated: {new Date(conditions.lastUpdated).toLocaleTimeString()}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function getFlagColor(flag: string): string {
  switch (flag) {
    case 'green': return '#10B981';
    case 'yellow': return '#F59E0B';
    case 'red': return '#EF4444';
    case 'purple': return '#A855F7';
    default: return '#6B7280';
  }
}

function getUVColor(uvIndex: number): string {
  if (uvIndex <= 2) return '#10B981';
  if (uvIndex <= 5) return '#F59E0B';
  if (uvIndex <= 7) return '#F97316';
  if (uvIndex <= 10) return '#EF4444';
  return '#A855F7';
}

function getSunscreenRecommendation(uvIndex: number): string {
  if (uvIndex <= 2) return 'SPF 15+';
  if (uvIndex <= 5) return 'SPF 30+';
  if (uvIndex <= 7) return 'SPF 30+, reapply every 2 hours';
  return 'SPF 50+, reapply frequently';
}

function getClothingRecommendation(uvIndex: number): string {
  if (uvIndex <= 2) return 'No special precautions needed';
  if (uvIndex <= 5) return 'Shirt, hat recommended';
  if (uvIndex <= 7) return 'Long sleeves, hat, sunglasses';
  return 'Full coverage clothing required';
}

function getShadeRecommendation(uvIndex: number): string {
  if (uvIndex <= 2) return 'Shade not essential';
  if (uvIndex <= 5) return 'Shade recommended 10am-4pm';
  if (uvIndex <= 7) return 'Shade recommended 10am-4pm';
  return 'Shade essential 10am-4pm';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
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
  imageContainer: {
    width: '100%',
    height: 300,
    position: 'relative',
  },
  beachImage: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  navigationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationDots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  activeDot: {
    backgroundColor: '#FFF',
    width: 24,
  },
  content: {
    padding: 16,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1E293B',
    marginBottom: 12,
  },
  conditionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  conditionCard: {
    flex: 1,
    minWidth: (width - 48) / 2,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  conditionValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1E293B',
    marginTop: 8,
  },
  conditionLabel: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1E293B',
  },
  uvProtectionCard: {
    backgroundColor: '#FEF3E2',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  uvHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  uvProtectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#92400E',
  },
  uvBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  uvBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  uvBadgeText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFF',
  },
  uvRiskText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#92400E',
  },
  uvRecommendations: {
    gap: 12,
  },
  uvRecommendation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  uvRecommendationText: {
    flex: 1,
  },
  uvRecommendationTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1E293B',
    marginBottom: 2,
  },
  uvRecommendationDetail: {
    fontSize: 14,
    color: '#64748B',
  },
  sunTimesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  sunTimeCard: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sunTimeLabel: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
  },
  sunTimeValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1E293B',
    marginTop: 4,
  },
  currentTideCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  currentTideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  currentTideTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1E293B',
  },
  currentTideContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentTideHeight: {
    fontSize: 48,
    fontWeight: '700' as const,
    color: '#0EA5E9',
  },
  tideTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  tideTrendRising: {
    backgroundColor: '#DBEAFE',
  },
  tideTrendFalling: {
    backgroundColor: '#FEF3C7',
  },
  tideTrendText: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  tideTrendTextRising: {
    color: '#0EA5E9',
  },
  tideTrendTextFalling: {
    color: '#F59E0B',
  },
  tideRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tideTime: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1E293B',
    flex: 1,
  },
  tideType: {
    fontSize: 14,
    fontWeight: '600' as const,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  highTide: {
    backgroundColor: '#DBEAFE',
    color: '#1E40AF',
  },
  lowTide: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
  tideHeight: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1E293B',
    marginLeft: 12,
  },
  cameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0EA5E9',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  cameraButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFF',
  },
  nearbyBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 2,
  },
  nearbyBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#FFF',
    letterSpacing: 0.3,
  },
  nearbyCaption: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 12,
    lineHeight: 16,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 16,
  },
  loadingSection: {
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
  },
});
