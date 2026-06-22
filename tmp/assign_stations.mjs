import fs from 'fs';

const stationsData = JSON.parse(fs.readFileSync('/tmp/watertemp_stations.json', 'utf8'));
const stations = stationsData.stations.map(s => ({ id: s.id, lat: s.lat, lng: s.lng, name: s.name }));

const beachesPath = 'expo/constants/beaches.ts';
const src = fs.readFileSync(beachesPath, 'utf8');
const lines = src.split('\n');

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const toRad = d => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function nearestStation(lat, lon) {
  let best = null;
  let bestD = Infinity;
  for (const s of stations) {
    const d = haversine(lat, lon, s.lat, s.lng);
    if (d < bestD) { bestD = d; best = s; }
  }
  return { station: best, distance: bestD };
}

// Parse beach objects: find blocks with id/latitude/longitude/stationId.
// We process line by line, tracking the current object's properties and line indices.
const THRESHOLD_KM = 120;
let out = [];
let i = 0;
let assigned = 0;
let skippedExisting = 0;
let skippedFar = 0;
const log = [];

// We'll detect object boundaries by `{` ... `}` at 2-space indent inside the array.
// Simpler: scan for "id: '...'," lines, then within that block gather latitude, longitude, stationId, waterTempStationId line numbers.

// Build index of beach blocks
const blocks = [];
for (let n = 0; n < lines.length; n++) {
  const m = lines[n].match(/^\s{4}id:\s*'([^']+)',\s*$/);
  if (m) {
    blocks.push({ start: n, id: m[1] });
  }
}
// determine end of each block as start of next or '];'
for (let b = 0; b < blocks.length; b++) {
  blocks[b].end = (b + 1 < blocks.length) ? blocks[b + 1].start : lines.length;
}

const insertions = []; // { afterLine, text }
for (const blk of blocks) {
  let lat = null, lon = null, stationLine = -1, lonLine = -1, hasWaterTemp = false, name = blk.id;
  for (let n = blk.start; n < blk.end; n++) {
    const l = lines[n];
    let mm;
    if ((mm = l.match(/^\s{4}name:\s*'([^']+)'/))) name = mm[1];
    if ((mm = l.match(/^\s{4}latitude:\s*(-?[\d.]+)/))) lat = parseFloat(mm[1]);
    if ((mm = l.match(/^\s{4}longitude:\s*(-?[\d.]+)/))) { lon = parseFloat(mm[1]); lonLine = n; }
    if (l.match(/^\s{4}stationId:/)) stationLine = n;
    if (l.match(/^\s{4}waterTempStationId:/)) hasWaterTemp = true;
  }
  if (hasWaterTemp) { skippedExisting++; continue; }
  if (lat === null || lon === null) { continue; }
  const { station, distance } = nearestStation(lat, lon);
  if (!station || distance > THRESHOLD_KM) {
    skippedFar++;
    log.push(`SKIP(far ${distance.toFixed(0)}km) ${name} -> ${station ? station.id : 'none'}`);
    continue;
  }
  const afterLine = stationLine >= 0 ? stationLine : lonLine;
  insertions.push({ afterLine, text: `    waterTempStationId: '${station.id}',` });
  assigned++;
  log.push(`ASSIGN ${name} -> ${station.id} (${station.name}, ${distance.toFixed(0)}km)`);
}

// apply insertions (sort desc by line so indices stay valid)
insertions.sort((a, b) => b.afterLine - a.afterLine);
for (const ins of insertions) {
  lines.splice(ins.afterLine + 1, 0, ins.text);
}

fs.writeFileSync(beachesPath, lines.join('\n'));
console.log(log.join('\n'));
console.log('\n--- SUMMARY ---');
console.log('assigned:', assigned, 'skippedExisting:', skippedExisting, 'skippedFar:', skippedFar, 'totalBlocks:', blocks.length);
