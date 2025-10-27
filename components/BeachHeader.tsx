import { ChevronLeft, ChevronRight, Heart, MapPin, Waves, Cloud } from 'lucide-react-native';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

interface BeachHeaderProps {
  beachName?: string;
  location?: string;
  onBack?: () => void;
  onFavorite?: () => void;
  onRefresh?: () => void;
  isFavorite?: boolean;
  onViewDetails?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  weatherIcon?: boolean;
  showBeachInfo?: boolean;
}

export default function BeachHeader({ 
  beachName = 'Clearwater Beach', 
  location = 'Clearwater Beach, FL', 
  onBack,
  onFavorite,
  onRefresh,
  isFavorite = false,
  onViewDetails,
  onPrevious,
  onNext,
  weatherIcon = true,
  showBeachInfo = true
}: BeachHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#22D3EE', '#3B82F6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <View style={[styles.content, { paddingTop: insets.top + 12 }]}>
          <View style={styles.topRow}>
            <View style={styles.titleRow}>
              <Waves size={28} color="#FFF" strokeWidth={2.5} />
              <Text style={styles.appTitle}>
                <Text style={styles.beachText}>Beach </Text>
                <Text style={styles.reportText}>Report</Text>
              </Text>
            </View>
            
            <View style={styles.topRightButtons}>
              {onViewDetails && (
                <TouchableOpacity style={styles.viewDetailsButton} onPress={onViewDetails}>
                  <Text style={styles.viewDetailsText}>View Details</Text>
                </TouchableOpacity>
              )}
              {onFavorite && (
                <TouchableOpacity style={styles.roundButton} onPress={onFavorite}>
                  <Heart 
                    size={20} 
                    color={isFavorite ? '#EF4444' : '#FFF'} 
                    fill={isFavorite ? '#EF4444' : 'transparent'}
                    strokeWidth={2}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {showBeachInfo && (
            <View style={styles.subtitleRow}>
              <View style={styles.recentlyViewed}>
                <Text style={styles.recentlyViewedText}>{isFavorite ? 'Favorite' : 'Recently Viewed'}</Text>
                <View style={styles.dot} />
                <Text style={styles.beachNameText}>{beachName}</Text>
              </View>
            </View>
          )}

          {showBeachInfo && (
          <View style={styles.bottomRow}>
            <View style={styles.locationRow}>
              <MapPin size={16} color="#FFF" strokeWidth={2} />
              <Text style={styles.locationText}>{location}</Text>
              <View style={styles.statusDot} />
            </View>

            <View style={styles.navigationButtons}>
              {onPrevious && (
                <TouchableOpacity style={styles.navButton} onPress={onPrevious}>
                  <ChevronLeft size={20} color="#FFF" strokeWidth={2.5} />
                </TouchableOpacity>
              )}
              {weatherIcon && (
                <View style={styles.weatherIcon}>
                  <Cloud size={20} color="#FFF" fill="#FFF" />
                </View>
              )}
              {onNext && (
                <TouchableOpacity style={styles.navButton} onPress={onNext}>
                  <ChevronRight size={20} color="#FFF" strokeWidth={2.5} />
                </TouchableOpacity>
              )}
            </View>
          </View>
          )}
        </View>

        <View style={styles.waveContainer}>
          <Svg width="100%" height="30" viewBox="0 0 1440 30" preserveAspectRatio="none" style={styles.waveSvg}>
            <Path
              d="M0,15 Q120,0 240,15 T480,15 T720,15 T960,15 T1200,15 T1440,15 L1440,30 L0,30 Z"
              fill="rgba(255, 255, 255, 0.15)"
            />
            <Path
              d="M0,18 Q120,3 240,18 T480,18 T720,18 T960,18 T1200,18 T1440,18 L1440,30 L0,30 Z"
              fill="rgba(255, 255, 255, 0.25)"
            />
            <Path
              d="M0,21 Q120,6 240,21 T480,21 T720,21 T960,21 T1200,21 T1440,21 L1440,30 L0,30 Z"
              fill="rgba(255, 255, 255, 0.4)"
            />
            <Path
              d="M0,24 Q120,9 240,24 T480,24 T720,24 T960,24 T1200,24 T1440,24 L1440,30 L0,30 Z"
              fill="#FFFFFF"
            />
          </Svg>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  gradient: {
    paddingBottom: 0,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
  },
  beachText: {
    color: '#FFF',
  },
  reportText: {
    color: '#FCD34D',
  },
  topRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewDetailsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  viewDetailsText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  roundButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentlyViewed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recentlyViewedText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  beachNameText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '500' as const,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500' as const,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  navigationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weatherIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveContainer: {
    height: 30,
    overflow: 'hidden',
  },
  waveSvg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
