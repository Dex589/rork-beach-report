import { useLocalSearchParams, Stack } from 'expo-router';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { AlertTriangle, Wind, Waves, Droplets, Sun, CheckCircle } from 'lucide-react-native';
import { Alert } from '@/types/beach';

export default function AlertsScreen() {
  const params = useLocalSearchParams();
  const alertsData = params.alerts as string;
  const flagColor = params.flagColor as string;
  const beachName = params.beachName as string;

  let alerts: Alert[] = [];
  try {
    alerts = JSON.parse(alertsData);
  } catch (error) {
    console.error('Error parsing alerts:', error);
  }

  const getAlertIcon = (type: Alert['type']) => {
    const iconProps = { size: 24, color: '#FFF' };
    switch (type) {
      case 'weather':
        return <Sun {...iconProps} />;
      case 'surf':
        return <Waves {...iconProps} />;
      case 'wind':
        return <Wind {...iconProps} />;
      case 'water':
        return <Droplets {...iconProps} />;
      case 'marine':
        return <AlertTriangle {...iconProps} />;
      default:
        return <AlertTriangle {...iconProps} />;
    }
  };

  const getSeverityColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'extreme':
        return '#DC2626';
      case 'high':
        return '#EF4444';
      case 'moderate':
        return '#F59E0B';
      case 'low':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getSeverityLabel = (severity: Alert['severity']) => {
    switch (severity) {
      case 'extreme':
        return 'EXTREME';
      case 'high':
        return 'HIGH';
      case 'moderate':
        return 'MODERATE';
      case 'low':
        return 'LOW';
      default:
        return 'INFO';
    }
  };

  const getFlagColorHex = (flag: string) => {
    switch (flag) {
      case 'green':
        return '#10B981';
      case 'yellow':
        return '#F59E0B';
      case 'red':
        return '#EF4444';
      case 'purple':
        return '#A855F7';
      default:
        return '#6B7280';
    }
  };

  const getFlagLabel = (flag: string) => {
    switch (flag) {
      case 'green':
        return 'Green Flag - Safe Conditions';
      case 'yellow':
        return 'Yellow Flag - Moderate Hazard';
      case 'red':
        return 'Red Flag - Dangerous Conditions';
      case 'purple':
        return 'Purple Flag - Marine Life Warning';
      default:
        return 'No Flag Status';
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Beach Alerts',
          headerStyle: {
            backgroundColor: '#FFF',
          },
          headerTintColor: '#1E293B',
          headerShadowVisible: true,
        }} 
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={[styles.flagStatusCard, { backgroundColor: getFlagColorHex(flagColor) }]}>
            <View style={styles.flagStatusHeader}>
              {flagColor === 'green' ? (
                <CheckCircle size={32} color="#FFF" />
              ) : (
                <AlertTriangle size={32} color="#FFF" />
              )}
              <View style={styles.flagStatusText}>
                <Text style={styles.flagStatusTitle}>{getFlagLabel(flagColor)}</Text>
                <Text style={styles.flagStatusSubtitle}>{beachName}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Alerts ({alerts.length})</Text>
            <Text style={styles.sectionSubtitle}>
              These conditions were evaluated to determine the current flag status
            </Text>
          </View>

          {alerts.map((alert) => (
            <View key={alert.id} style={styles.alertCard}>
              <View style={[styles.alertHeader, { backgroundColor: getSeverityColor(alert.severity) }]}>
                <View style={styles.alertIconContainer}>
                  {getAlertIcon(alert.type)}
                </View>
                <View style={styles.alertHeaderText}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <View style={styles.severityBadge}>
                    <Text style={styles.severityText}>{getSeverityLabel(alert.severity)}</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.alertBody}>
                <Text style={styles.alertDescription}>{alert.description}</Text>
                
                {alert.value && alert.threshold && (
                  <View style={styles.alertMetrics}>
                    <View style={styles.metricRow}>
                      <Text style={styles.metricLabel}>Current Value:</Text>
                      <Text style={styles.metricValue}>{alert.value}</Text>
                    </View>
                    <View style={styles.metricRow}>
                      <Text style={styles.metricLabel}>Safe Threshold:</Text>
                      <Text style={styles.metricThreshold}>{alert.threshold}</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          ))}

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>About Beach Flags</Text>
            <Text style={styles.infoText}>
              Beach flag colors indicate water safety conditions. Green means safe, yellow indicates moderate hazards, 
              red means dangerous conditions, and purple warns of marine life hazards. Always follow lifeguard instructions 
              and posted warnings.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  flagStatusCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  flagStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  flagStatusText: {
    flex: 1,
  },
  flagStatusTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#FFF',
    marginBottom: 4,
  },
  flagStatusSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#1E293B',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  alertCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  alertIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertHeaderText: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFF',
    marginBottom: 6,
  },
  severityBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#FFF',
    letterSpacing: 0.5,
  },
  alertBody: {
    padding: 16,
  },
  alertDescription: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 16,
  },
  alertMetrics: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500' as const,
  },
  metricValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '700' as const,
  },
  metricThreshold: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '700' as const,
  },
  infoBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1E40AF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
});
