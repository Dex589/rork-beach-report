//
//  BeachConditions.swift
//  BeachReport
//

import Foundation

nonisolated struct WeatherData: Codable, Hashable {
    let temperature: Int
    let condition: String
    let humidity: Int
    let windSpeed: Int
    let windDirection: String
    let uvIndex: Int
}

nonisolated struct TideData: Codable, Hashable, Identifiable {
    var id: String { "\(time)-\(height)-\(type.rawValue)" }
    let time: String
    let height: Double
    let type: TideType

    enum TideType: String, Codable, Hashable {
        case high
        case low
    }
}

nonisolated struct SurfData: Codable, Hashable {
    let height: Double
    let period: Double
    let direction: String
}

nonisolated struct WaterQuality: Codable, Hashable {
    let temperature: Double
    var source: String?
}

nonisolated struct SunData: Codable, Hashable {
    let sunrise: String
    let sunset: String
    let goldenHour: String
}

nonisolated enum AlertType: String, Codable, Hashable {
    case weather, surf, wind, marine, water
}

nonisolated enum AlertSeverity: String, Codable, Hashable {
    case low, moderate, high, extreme
}

nonisolated struct BeachAlert: Codable, Hashable, Identifiable {
    let id: String
    let type: AlertType
    let severity: AlertSeverity
    let title: String
    let description: String
    var value: String?
    var threshold: String?
}

nonisolated enum FlagWarning: String, Codable, Hashable {
    case green, yellow, red, purple, none
}

nonisolated struct BeachConditions: Codable, Hashable {
    let beach: Beach
    let weather: WeatherData
    let tides: [TideData]
    let surf: SurfData
    let waterQuality: WaterQuality
    let sunData: SunData
    let flagWarning: FlagWarning
    var warningMessage: String?
    let alerts: [BeachAlert]
    let lastUpdated: Date
}

nonisolated struct BeachSearchResult: Identifiable, Hashable {
    var id: String { beach.id }
    let beach: Beach
    var distance: Double?
}
