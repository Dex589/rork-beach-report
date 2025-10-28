import { Feather } from '@expo/vector-icons';
import React from 'react';
import { useRouter } from 'expo-router';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Linking
} from 'react-native';
import BeachHeader from '@/components/BeachHeader';

export default function SettingsScreen() {
  const router = useRouter();
  
  const handleContactSupport = () => {
    Linking.openURL('mailto:support@beach-report.com');
  };
  
  const handleVerifyData = () => {
    router.push('/verify-beaches');
  };

  return (
    <View style={styles.wrapper}>
      <BeachHeader showBeachInfo={false} />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
        <Feather name="settings" size={48} color="#0EA5E9" />
        <Text style={styles.headerTitle}>Beach Report</Text>
        <Text style={styles.headerSubtitle}>Real-time beach conditions</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Feather name="info" size={20} color="#64748B" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Version</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Sources</Text>
        <View style={styles.card}>
          <Text style={styles.dataSourceText}>
            Beach Report provides real-time beach conditions using data from:
          </Text>
          <Text style={styles.dataSourceItem}>• NOAA - Tide and marine data</Text>
          <Text style={styles.dataSourceItem}>• Open-Meteo - Weather information</Text>
          <Text style={styles.dataSourceItem}>• Sunrise-Sunset API - Sun times</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Features</Text>
        <View style={styles.card}>
          <View style={styles.featureItem}>
            <Feather name="map-pin" size={20} color="#0EA5E9" />
            <Text style={styles.featureText}>GPS-based beach discovery</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🌊</Text>
            <Text style={styles.featureText}>Real-time surf and tide data</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>☀️</Text>
            <Text style={styles.featureText}>UV index and sun times</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🚩</Text>
            <Text style={styles.featureText}>Beach safety warnings</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📸</Text>
            <Text style={styles.featureText}>Live beach camera links</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Developer Tools</Text>
        <TouchableOpacity style={styles.card} onPress={handleVerifyData}>
          <View style={styles.infoRow}>
            <Feather name="database" size={20} color="#0EA5E9" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Verify Beach Data</Text>
              <Text style={styles.infoValue}>Check all beach data sources</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <TouchableOpacity style={styles.card} onPress={handleContactSupport}>
          <View style={styles.infoRow}>
            <Feather name="mail" size={20} color="#0EA5E9" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Contact Support</Text>
              <Text style={styles.infoValue}>support@beach-report.com</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>
        Made with ❤️ for beach lovers
      </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F8FAFC',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#1E293B',
    marginTop: 16,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1E293B',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1E293B',
    marginTop: 2,
  },
  dataSourceText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
    lineHeight: 20,
  },
  dataSourceItem: {
    fontSize: 14,
    color: '#1E293B',
    marginBottom: 8,
    lineHeight: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 20,
  },
  featureText: {
    fontSize: 16,
    color: '#1E293B',
  },
  footer: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    padding: 32,
  },
});
