import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { ALL_BEACHES } from '@/constants/beaches';

const NOAA_TIDES_API = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';

interface VerificationResult {
  beachId: string;
  beachName: string;
  stationId?: string;
  waterTempStationId?: string;
  tideStatus: 'success' | 'failed' | 'no-station' | 'pending';
  waterTempStatus: 'success' | 'failed' | 'no-station' | 'fallback-to-marine' | 'pending';
  tideError?: string;
  waterTempError?: string;
}

async function verifyStation(stationId: string, product: 'predictions' | 'water_temperature'): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    
    let url: string;
    if (product === 'predictions') {
      url = `${NOAA_TIDES_API}?product=predictions&application=NOS.COOPS.TAC.WL&begin_date=${dateStr}&range=48&datum=MLLW&station=${stationId}&time_zone=lst_ldt&units=english&interval=hilo&format=json`;
    } else {
      url = `${NOAA_TIDES_API}?product=water_temperature&application=NOS.COOPS.TAC.WL&begin_date=${dateStr}&range=1&station=${stationId}&time_zone=lst_ldt&units=english&format=json`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }
    
    const data = await response.json();
    
    if (product === 'predictions') {
      if (data?.predictions && Array.isArray(data.predictions) && data.predictions.length > 0) {
        return { success: true };
      }
      return { success: false, error: 'No predictions data' };
    } else {
      if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
        return { success: true };
      }
      return { success: false, error: 'No water temp data' };
    }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Unknown error' };
  }
}

async function verifyBeach(beach: typeof ALL_BEACHES[0]): Promise<VerificationResult> {
  const result: VerificationResult = {
    beachId: beach.id,
    beachName: beach.name,
    stationId: beach.stationId,
    waterTempStationId: beach.waterTempStationId,
    tideStatus: 'no-station',
    waterTempStatus: 'no-station',
  };

  if (beach.stationId) {
    const tideCheck = await verifyStation(beach.stationId, 'predictions');
    result.tideStatus = tideCheck.success ? 'success' : 'failed';
    result.tideError = tideCheck.error;
  }

  if (beach.waterTempStationId) {
    const waterTempCheck = await verifyStation(beach.waterTempStationId, 'water_temperature');
    result.waterTempStatus = waterTempCheck.success ? 'success' : 'failed';
    result.waterTempError = waterTempCheck.error;
  } else if (beach.stationId) {
    const waterTempCheck = await verifyStation(beach.stationId, 'water_temperature');
    result.waterTempStatus = waterTempCheck.success ? 'success' : 'fallback-to-marine';
    result.waterTempError = waterTempCheck.error;
  } else {
    result.waterTempStatus = 'fallback-to-marine';
  }

  return result;
}

export default function VerifyBeachesScreen() {
  const [results, setResults] = useState<VerificationResult[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    verifyAllBeaches();
  }, []);

  async function verifyAllBeaches() {
    setIsVerifying(true);
    const allResults: VerificationResult[] = [];
    
    const batchSize = 5;
    for (let i = 0; i < ALL_BEACHES.length; i += batchSize) {
      const batch = ALL_BEACHES.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(verifyBeach));
      allResults.push(...batchResults);
      setResults([...allResults]);
      setProgress(Math.round((allResults.length / ALL_BEACHES.length) * 100));
      
      if (i + batchSize < ALL_BEACHES.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    setIsVerifying(false);
  }

  const tideSuccess = results.filter(r => r.tideStatus === 'success').length;
  const tideFailed = results.filter(r => r.tideStatus === 'failed').length;
  const waterTempSuccess = results.filter(r => r.waterTempStatus === 'success').length;
  const waterTempFailed = results.filter(r => r.waterTempStatus === 'failed').length;
  const waterTempFallback = results.filter(r => r.waterTempStatus === 'fallback-to-marine').length;

  const beachesWithIssues = results.filter(r => 
    r.tideStatus === 'failed' || r.waterTempStatus === 'failed'
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Stack.Screen options={{ title: 'Beach Data Verification' }} />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Beach Data Verification</Text>
          {isVerifying && (
            <View style={styles.progressContainer}>
              <ActivityIndicator size="large" color="#0066CC" />
              <Text style={styles.progressText}>
                Verifying... {progress}% ({results.length}/{ALL_BEACHES.length})
              </Text>
            </View>
          )}
        </View>

        {results.length > 0 && (
          <>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Summary</Text>
              
              <View style={styles.summarySection}>
                <Text style={styles.summaryLabel}>Tide Data:</Text>
                <Text style={styles.summarySuccess}>✓ Success: {tideSuccess}</Text>
                <Text style={styles.summaryFailed}>✗ Failed: {tideFailed}</Text>
              </View>

              <View style={styles.summarySection}>
                <Text style={styles.summaryLabel}>Water Temperature:</Text>
                <Text style={styles.summarySuccess}>✓ Success: {waterTempSuccess}</Text>
                <Text style={styles.summaryFailed}>✗ Failed: {waterTempFailed}</Text>
                <Text style={styles.summaryFallback}>~ Fallback: {waterTempFallback}</Text>
              </View>
            </View>

            {beachesWithIssues.length > 0 && (
              <View style={styles.issuesCard}>
                <Text style={styles.issuesTitle}>Beaches With Issues ({beachesWithIssues.length})</Text>
                {beachesWithIssues.map((beach) => (
                  <View key={beach.beachId} style={styles.issueItem}>
                    <Text style={styles.beachName}>{beach.beachName}</Text>
                    <Text style={styles.beachId}>ID: {beach.beachId}</Text>
                    {beach.tideStatus === 'failed' && (
                      <Text style={styles.errorText}>
                        Tide: FAILED - Station {beach.stationId} - {beach.tideError}
                      </Text>
                    )}
                    {beach.waterTempStatus === 'failed' && (
                      <Text style={styles.errorText}>
                        Water Temp: FAILED - Station {beach.waterTempStationId || beach.stationId} - {beach.waterTempError}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            <View style={styles.allResultsCard}>
              <Text style={styles.allResultsTitle}>All Results</Text>
              {results.map((beach) => (
                <View key={beach.beachId} style={styles.resultItem}>
                  <Text style={styles.beachName}>{beach.beachName}</Text>
                  <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>Tide:</Text>
                    <Text style={[
                      styles.statusValue,
                      beach.tideStatus === 'success' && styles.statusSuccess,
                      beach.tideStatus === 'failed' && styles.statusFailed,
                    ]}>
                      {beach.tideStatus}
                    </Text>
                  </View>
                  <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>Water Temp:</Text>
                    <Text style={[
                      styles.statusValue,
                      beach.waterTempStatus === 'success' && styles.statusSuccess,
                      beach.waterTempStatus === 'failed' && styles.statusFailed,
                      beach.waterTempStatus === 'fallback-to-marine' && styles.statusFallback,
                    ]}>
                      {beach.waterTempStatus}
                    </Text>
                  </View>
                  {beach.stationId && (
                    <Text style={styles.stationInfo}>Station: {beach.stationId}</Text>
                  )}
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 10,
  },
  progressContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  progressText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
  },
  summaryCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 15,
  },
  summarySection: {
    marginBottom: 15,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#333333',
    marginBottom: 5,
  },
  summarySuccess: {
    fontSize: 14,
    color: '#10B981',
    marginLeft: 10,
  },
  summaryFailed: {
    fontSize: 14,
    color: '#EF4444',
    marginLeft: 10,
  },
  summaryFallback: {
    fontSize: 14,
    color: '#F59E0B',
    marginLeft: 10,
  },
  issuesCard: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  issuesTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#DC2626',
    marginBottom: 15,
  },
  issueItem: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#FCA5A5',
  },
  allResultsCard: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  allResultsTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 15,
  },
  resultItem: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  beachName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 5,
  },
  beachId: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 5,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666666',
    width: 100,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  statusSuccess: {
    color: '#10B981',
  },
  statusFailed: {
    color: '#EF4444',
  },
  statusFallback: {
    color: '#F59E0B',
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 5,
    marginLeft: 10,
  },
  stationInfo: {
    fontSize: 12,
    color: '#666666',
    marginTop: 5,
  },
});
