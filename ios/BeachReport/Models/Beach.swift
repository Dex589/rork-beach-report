//
//  Beach.swift
//  BeachReport
//

import Foundation

/// A single beach and the NOAA stations used to source its data.
nonisolated struct Beach: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let state: String
    let latitude: Double
    let longitude: Double
    let stationId: String?
    let waterTempStationId: String?
    let imageUrl: String?
    let cameraUrl: String?
    let cameraType: CameraType?

    enum CameraType: String, Codable, Hashable {
        case direct
        case nearby
    }
}
