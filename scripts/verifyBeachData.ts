import { ALL_BEACHES } from '../constants/beaches';

const NOAA_TIDES_API = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';

interface VerificationResult {
  beachId: string;
  beachName: string;
  stationId?: string;
  waterTempStationId?: string;
  tideStatus: 'success' | 'failed' | 'no-station';
  waterTempStatus: 'success' | 'failed' | 'no-station' | 'fallback-to-marine';
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
  console.log(`Verifying ${beach.name}...`);
  
  const result: VerificationResult = {
    beachId: beach.id,
    beachName: beach.name,
    stationId: beach.stationId,
    waterTempStationId: beach.waterTempStationId,
    tideStatus: 'no-station',
    waterTempStatus: 'no-station',
  };

  // Check tide data
  if (beach.stationId) {
    const tideCheck = await verifyStation(beach.stationId, 'predictions');
    result.tideStatus = tideCheck.success ? 'success' : 'failed';
    result.tideError = tideCheck.error;
  }

  // Check water temperature
  if (beach.waterTempStationId) {
    const waterTempCheck = await verifyStation(beach.waterTempStationId, 'water_temperature');
    result.waterTempStatus = waterTempCheck.success ? 'success' : 'failed';
    result.waterTempError = waterTempCheck.error;
  } else if (beach.stationId) {
    // Try using main station for water temp
    const waterTempCheck = await verifyStation(beach.stationId, 'water_temperature');
    result.waterTempStatus = waterTempCheck.success ? 'success' : 'fallback-to-marine';
    result.waterTempError = waterTempCheck.error;
  } else {
    result.waterTempStatus = 'fallback-to-marine';
  }

  return result;
}

async function verifyAllBeaches() {
  console.log(`Starting verification of ${ALL_BEACHES.length} beaches...\n`);
  
  const results: VerificationResult[] = [];
  
  // Process beaches in batches to avoid overwhelming the API
  const batchSize = 5;
  for (let i = 0; i < ALL_BEACHES.length; i += batchSize) {
    const batch = ALL_BEACHES.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(verifyBeach));
    results.push(...batchResults);
    
    // Small delay between batches
    if (i + batchSize < ALL_BEACHES.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Generate report
  console.log('\n\n=== VERIFICATION REPORT ===\n');
  
  const tideSuccess = results.filter(r => r.tideStatus === 'success').length;
  const tideFailed = results.filter(r => r.tideStatus === 'failed').length;
  const tideNoStation = results.filter(r => r.tideStatus === 'no-station').length;
  
  const waterTempSuccess = results.filter(r => r.waterTempStatus === 'success').length;
  const waterTempFailed = results.filter(r => r.waterTempStatus === 'failed').length;
  const waterTempFallback = results.filter(r => r.waterTempStatus === 'fallback-to-marine').length;
  
  console.log('TIDE DATA:');
  console.log(`  ✓ Success: ${tideSuccess}`);
  console.log(`  ✗ Failed: ${tideFailed}`);
  console.log(`  - No Station: ${tideNoStation}`);
  
  console.log('\nWATER TEMPERATURE:');
  console.log(`  ✓ Success: ${waterTempSuccess}`);
  console.log(`  ✗ Failed: ${waterTempFailed}`);
  console.log(`  ~ Fallback to Marine API: ${waterTempFallback}`);
  
  console.log('\n\n=== BEACHES WITH ISSUES ===\n');
  
  const beachesWithIssues = results.filter(r => 
    r.tideStatus === 'failed' || r.waterTempStatus === 'failed'
  );
  
  if (beachesWithIssues.length === 0) {
    console.log('No beaches with issues found!');
  } else {
    beachesWithIssues.forEach(beach => {
      console.log(`\n${beach.beachName} (${beach.beachId}):`);
      if (beach.tideStatus === 'failed') {
        console.log(`  Tide: FAILED - Station ${beach.stationId} - ${beach.tideError}`);
      }
      if (beach.waterTempStatus === 'failed') {
        console.log(`  Water Temp: FAILED - Station ${beach.waterTempStationId || beach.stationId} - ${beach.waterTempError}`);
      }
    });
  }
  
  console.log('\n\n=== BEACHES NEEDING WATER TEMP STATIONS ===\n');
  
  const needsWaterTempStation = results.filter(r => 
    r.waterTempStatus === 'fallback-to-marine' && r.tideStatus === 'success'
  );
  
  if (needsWaterTempStation.length > 0) {
    console.log(`Found ${needsWaterTempStation.length} beaches that could benefit from dedicated water temp stations:\n`);
    needsWaterTempStation.forEach(beach => {
      console.log(`  - ${beach.beachName} (${beach.beachId}) - Tide station: ${beach.stationId}`);
    });
  }
  
  // Export results as JSON
  console.log('\n\n=== FULL RESULTS (JSON) ===\n');
  console.log(JSON.stringify(results, null, 2));
}

verifyAllBeaches().catch(console.error);
