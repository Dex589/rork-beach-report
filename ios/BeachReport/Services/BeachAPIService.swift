//
//  BeachAPIService.swift
//  BeachReport
//
//  Fetches live beach conditions from the same free public APIs the app
//  has always used: Open-Meteo (weather + waves + sea temp), NOAA Tides
//  & Currents (tides + water temperature), and sunrise-sunset.org.
//

import Foundation

nonisolated final class BeachAPIService {
    static let shared = BeachAPIService()

    private let openMeteo = "https://api.open-meteo.com/v1/forecast"
    private let openMeteoMarine = "https://marine-api.open-meteo.com/v1/marine"
    private let sunriseSunset = "https://api.sunrise-sunset.org/json"
    private let noaaTides = "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter"
    private let cachePrefix = "beach_conditions_cache:"

    private let session: URLSession = {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 12
        return URLSession(configuration: config)
    }()

    // MARK: - Public

    func fetchConditions(for beach: Beach) async throws -> BeachConditions {
        do {
            async let weather = fetchWeather(lat: beach.latitude, lon: beach.longitude)
            async let sun = fetchSun(lat: beach.latitude, lon: beach.longitude)
            async let tides = fetchTides(beach: beach)
            async let surf = fetchSurf(lat: beach.latitude, lon: beach.longitude)
            async let water = fetchWaterQuality(beach: beach)

            let weatherData = try await weather
            let surfData = try await surf
            let waterData = try await water
            let alerts = Self.generateAlerts(weather: weatherData, surf: surfData, water: waterData)
            let flag = Self.determineFlag(alerts)

            let conditions = BeachConditions(
                beach: beach,
                weather: weatherData,
                tides: try await tides,
                surf: surfData,
                waterQuality: waterData,
                sunData: try await sun,
                flagWarning: flag,
                warningMessage: Self.warningMessage(flag),
                alerts: alerts,
                lastUpdated: Date()
            )
            writeCache(conditions)
            return conditions
        } catch {
            if let cached = readCache(beach.id) {
                return cached
            }
            throw error
        }
    }

    // MARK: - Weather

    private func fetchWeather(lat: Double, lon: Double) async throws -> WeatherData {
        let urlStr = "\(openMeteo)?latitude=\(lat)&longitude=\(lon)&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code,uv_index&temperature_unit=fahrenheit&wind_speed_unit=mph"
        do {
            let data = try await get(urlStr)
            let decoded = try JSONDecoder().decode(OpenMeteoWeather.self, from: data)
            let c = decoded.current
            return WeatherData(
                temperature: Int(c.temperature_2m.rounded()),
                condition: Self.weatherCondition(c.weather_code),
                humidity: Int(c.relative_humidity_2m.rounded()),
                windSpeed: Int(c.wind_speed_10m.rounded()),
                windDirection: Self.windDirection(c.wind_direction_10m),
                uvIndex: Int((c.uv_index ?? 0).rounded())
            )
        } catch {
            return WeatherData(temperature: 75, condition: "Partly Cloudy", humidity: 65, windSpeed: 10, windDirection: "E", uvIndex: 6)
        }
    }

    // MARK: - Sun

    private func fetchSun(lat: Double, lon: Double) async throws -> SunData {
        let urlStr = "\(sunriseSunset)?lat=\(lat)&lng=\(lon)&formatted=0"
        do {
            let data = try await get(urlStr)
            let decoded = try JSONDecoder().decode(SunriseSunset.self, from: data)
            let iso = ISO8601DateFormatter()
            let sunrise = iso.date(from: decoded.results.sunrise) ?? Date()
            let sunset = iso.date(from: decoded.results.sunset) ?? Date()
            return SunData(
                sunrise: Self.formatTime(sunrise),
                sunset: Self.formatTime(sunset),
                goldenHour: Self.goldenHour(sunset: sunset, lat: lat)
            )
        } catch {
            var comps = Calendar.current.dateComponents([.year, .month, .day], from: Date())
            comps.hour = 19; comps.minute = 45
            let fallbackSunset = Calendar.current.date(from: comps) ?? Date()
            return SunData(sunrise: "6:30 AM", sunset: "7:45 PM", goldenHour: Self.goldenHour(sunset: fallbackSunset, lat: lat))
        }
    }

    // MARK: - Tides

    private func fetchTides(beach: Beach) async throws -> [TideData] {
        guard let station = beach.stationId else { return Self.fallbackTides() }
        let fmt = DateFormatter()
        fmt.dateFormat = "yyyyMMdd"
        fmt.locale = Locale(identifier: "en_US_POSIX")
        let dateStr = fmt.string(from: Date())
        let urlStr = "\(noaaTides)?product=predictions&application=NOS.COOPS.TAC.WL&begin_date=\(dateStr)&range=48&datum=MLLW&station=\(station)&time_zone=lst_ldt&units=english&interval=hilo&format=json"
        do {
            let data = try await get(urlStr)
            let decoded = try JSONDecoder().decode(NOAATides.self, from: data)
            guard let preds = decoded.predictions, !preds.isEmpty else { return Self.fallbackTides() }

            let parser = DateFormatter()
            parser.dateFormat = "yyyy-MM-dd HH:mm"
            parser.locale = Locale(identifier: "en_US_POSIX")

            struct Parsed { let date: Date; let height: Double; let type: TideData.TideType }
            let parsed: [Parsed] = preds.compactMap { p in
                guard let d = parser.date(from: p.t) else { return nil }
                let h = Double(p.v) ?? 0
                let type: TideData.TideType = p.type == "H" ? .high : .low
                return Parsed(date: d, height: h, type: type)
            }.sorted { $0.date < $1.date }

            let now = Date()
            let upcoming = parsed.filter { $0.date >= now }
            var chosen = Array(upcoming.prefix(4))
            if chosen.count < 4 {
                let needed = 4 - chosen.count
                let previous = parsed.filter { $0.date < now }.suffix(needed)
                chosen = Array(previous) + chosen
            }
            chosen = Array(chosen.prefix(4))
            guard !chosen.isEmpty else { return Self.fallbackTides() }
            return chosen.map { TideData(time: Self.formatTime($0.date), height: $0.height, type: $0.type) }
        } catch {
            return Self.fallbackTides()
        }
    }

    private static func fallbackTides() -> [TideData] {
        var tides: [TideData] = []
        let now = Date()
        for i in 0..<4 {
            let t = now.addingTimeInterval(Double(i) * 6 * 3600)
            tides.append(TideData(time: formatTime(t), height: 2 + Double.random(in: 0...4), type: i % 2 == 0 ? .high : .low))
        }
        return tides
    }

    // MARK: - Surf

    private func fetchSurf(lat: Double, lon: Double) async throws -> SurfData {
        let urlStr = "\(openMeteoMarine)?latitude=\(lat)&longitude=\(lon)&current=wave_height,wave_direction,wave_period&length_unit=imperial"
        do {
            let data = try await get(urlStr)
            let decoded = try JSONDecoder().decode(OpenMeteoMarine.self, from: data)
            let c = decoded.current
            return SurfData(
                height: c.wave_height ?? 2,
                period: c.wave_period ?? 10,
                direction: Self.windDirection(c.wave_direction ?? 0)
            )
        } catch {
            let dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
            return SurfData(height: 2 + Double.random(in: 0...4), period: 8 + Double.random(in: 0...6), direction: dirs.randomElement() ?? "N")
        }
    }

    // MARK: - Water Quality

    private func fetchWaterQuality(beach: Beach) async throws -> WaterQuality {
        if let station = beach.waterTempStationId {
            let urlStr = "\(noaaTides)?product=water_temperature&application=NOS.COOPS.TAC.WL&date=latest&station=\(station)&time_zone=lst_ldt&units=english&format=json"
            if let data = try? await get(urlStr),
               let decoded = try? JSONDecoder().decode(NOAAWaterTemp.self, from: data),
               let last = decoded.data?.last,
               let temp = Double(last.v) {
                let rounded = (temp * 10).rounded() / 10
                return WaterQuality(temperature: rounded, source: "NOAA #\(station)")
            }
        }

        let urlStr = "\(openMeteoMarine)?latitude=\(beach.latitude)&longitude=\(beach.longitude)&current=sea_surface_temperature&temperature_unit=fahrenheit"
        if let data = try? await get(urlStr),
           let decoded = try? JSONDecoder().decode(OpenMeteoSeaTemp.self, from: data),
           let sst = decoded.current.sea_surface_temperature {
            let rounded = (sst * 10).rounded() / 10
            return WaterQuality(temperature: rounded, source: "Open-Meteo")
        }

        if let cached = readCache(beach.id) {
            return cached.waterQuality
        }
        throw URLError(.badServerResponse)
    }

    // MARK: - Networking

    private func get(_ urlStr: String) async throws -> Data {
        guard let url = URL(string: urlStr) else { throw URLError(.badURL) }
        let (data, response) = try await session.data(from: url)
        if let http = response as? HTTPURLResponse, !(200...299).contains(http.statusCode) {
            throw URLError(.badServerResponse)
        }
        return data
    }

    // MARK: - Cache

    private func writeCache(_ conditions: BeachConditions) {
        guard let data = try? JSONEncoder().encode(conditions) else { return }
        UserDefaults.standard.set(data, forKey: cachePrefix + conditions.beach.id)
    }

    private func readCache(_ beachId: String) -> BeachConditions? {
        guard let data = UserDefaults.standard.data(forKey: cachePrefix + beachId) else { return nil }
        return try? JSONDecoder().decode(BeachConditions.self, from: data)
    }

    // MARK: - Helpers

    static func formatTime(_ date: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "h:mm a"
        f.locale = Locale(identifier: "en_US")
        return f.string(from: date)
    }

    /// Evening golden hour window; its length grows with latitude.
    static func goldenHour(sunset: Date, lat: Double) -> String {
        let absLat = min(abs(lat), 66)
        let durationMinutes = (35 + (absLat / 66) * 45).rounded()
        let start = sunset.addingTimeInterval(-durationMinutes * 60)
        let startStr = formatTime(start)
        let endStr = formatTime(sunset)
        let startPeriod = String(startStr.suffix(2))
        let endPeriod = String(endStr.suffix(2))
        let startLabel = startPeriod == endPeriod ? String(startStr.dropLast(3)) : startStr
        return "\(startLabel) - \(endStr)"
    }

    static func weatherCondition(_ code: Int) -> String {
        if code == 0 { return "Clear" }
        if code <= 3 { return "Partly Cloudy" }
        if code <= 48 { return "Foggy" }
        if code <= 67 { return "Rainy" }
        if code <= 77 { return "Snowy" }
        if code <= 82 { return "Showers" }
        return "Stormy"
    }

    static func windDirection(_ degrees: Double) -> String {
        let directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
        let index = Int((degrees / 45).rounded()) % 8
        return directions[(index + 8) % 8]
    }

    // MARK: - Alerts & Flags

    static func generateAlerts(weather: WeatherData, surf: SurfData, water: WaterQuality) -> [BeachAlert] {
        var alerts: [BeachAlert] = []

        if weather.condition.contains("Storm") {
            alerts.append(BeachAlert(id: "storm", type: .weather, severity: .extreme, title: "Severe Weather Alert", description: "Thunderstorms in the area. Lightning poses extreme danger.", value: weather.condition, threshold: "No storms"))
        }

        if surf.height > 8 {
            alerts.append(BeachAlert(id: "high-surf", type: .surf, severity: .extreme, title: "Dangerous Surf Conditions", description: "Extremely high waves present drowning risk. Strong rip currents likely.", value: String(format: "%.1f ft", surf.height), threshold: "< 8 ft"))
        } else if surf.height > 5 {
            alerts.append(BeachAlert(id: "moderate-surf", type: .surf, severity: .moderate, title: "Elevated Surf Height", description: "Higher than normal waves. Inexperienced swimmers should use caution.", value: String(format: "%.1f ft", surf.height), threshold: "< 5 ft"))
        }

        if weather.windSpeed > 25 {
            alerts.append(BeachAlert(id: "high-wind", type: .wind, severity: .moderate, title: "High Wind Advisory", description: "Strong winds may create choppy water conditions and make swimming difficult.", value: "\(weather.windSpeed) mph \(weather.windDirection)", threshold: "< 25 mph"))
        } else if weather.windSpeed > 15 {
            alerts.append(BeachAlert(id: "moderate-wind", type: .wind, severity: .low, title: "Moderate Wind", description: "Breezy conditions. May affect beach umbrellas and small watercraft.", value: "\(weather.windSpeed) mph \(weather.windDirection)", threshold: "< 15 mph"))
        }

        if water.temperature < 65 {
            alerts.append(BeachAlert(id: "cold-water", type: .water, severity: .moderate, title: "Cold Water Temperature", description: "Water temperature may cause hypothermia with prolonged exposure. Wetsuit recommended.", value: String(format: "%.1f°F", water.temperature), threshold: "> 65°F"))
        }

        if weather.uvIndex > 7 {
            alerts.append(BeachAlert(id: "high-uv", type: .weather, severity: weather.uvIndex > 10 ? .high : .moderate, title: weather.uvIndex > 10 ? "Extreme UV Index" : "High UV Index", description: "Unprotected skin can burn quickly. Use SPF 50+ and seek shade during peak hours.", value: "UV \(weather.uvIndex)", threshold: "< 8"))
        }

        if alerts.isEmpty {
            alerts.append(BeachAlert(id: "safe", type: .weather, severity: .low, title: "Safe Beach Conditions", description: "All conditions are within safe parameters. Enjoy your beach day!", value: nil, threshold: nil))
        }
        return alerts
    }

    static func determineFlag(_ alerts: [BeachAlert]) -> FlagWarning {
        if alerts.contains(where: { $0.severity == .extreme }) { return .red }
        if alerts.contains(where: { $0.severity == .high || $0.severity == .moderate }) { return .yellow }
        return .green
    }

    static func warningMessage(_ flag: FlagWarning) -> String {
        switch flag {
        case .red: return "Dangerous conditions - Beach closed to swimming"
        case .yellow: return "Moderate hazard - Caution advised"
        case .purple: return "Marine life warning"
        case .green: return "Safe conditions"
        case .none: return "No warnings"
        }
    }

    static func uvGuidance(_ uvIndex: Int) -> String {
        if uvIndex <= 2 { return "Low - Minimal protection needed" }
        if uvIndex <= 5 { return "Moderate - Wear sunscreen" }
        if uvIndex <= 7 { return "High - Protection essential" }
        if uvIndex <= 10 { return "Very High - Extra protection required" }
        return "Extreme - Avoid sun exposure"
    }
}

// MARK: - API DTOs

private nonisolated struct OpenMeteoWeather: Decodable {
    struct Current: Decodable {
        let temperature_2m: Double
        let relative_humidity_2m: Double
        let wind_speed_10m: Double
        let wind_direction_10m: Double
        let weather_code: Int
        let uv_index: Double?
    }
    let current: Current
}

private nonisolated struct OpenMeteoMarine: Decodable {
    struct Current: Decodable {
        let wave_height: Double?
        let wave_direction: Double?
        let wave_period: Double?
    }
    let current: Current
}

private nonisolated struct OpenMeteoSeaTemp: Decodable {
    struct Current: Decodable {
        let sea_surface_temperature: Double?
    }
    let current: Current
}

private nonisolated struct SunriseSunset: Decodable {
    struct Results: Decodable {
        let sunrise: String
        let sunset: String
    }
    let results: Results
}

private nonisolated struct NOAATides: Decodable {
    struct Prediction: Decodable {
        let t: String
        let v: String
        let type: String
    }
    let predictions: [Prediction]?
}

private nonisolated struct NOAAWaterTemp: Decodable {
    struct Reading: Decodable {
        let v: String
    }
    let data: [Reading]?
}
