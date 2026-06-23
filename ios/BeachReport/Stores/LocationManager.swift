//
//  LocationManager.swift
//  BeachReport
//
//  Optional GPS access used to sort beaches by distance.
//

import Foundation
import CoreLocation
import Observation

@MainActor
@Observable
final class LocationManager: NSObject, CLLocationManagerDelegate {
    private(set) var location: CLLocationCoordinate2D?
    private(set) var hasPermission: Bool?
    private(set) var isLoading: Bool = true

    private let manager = CLLocationManager()

    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyKilometer
        requestPermission()
    }

    func requestPermission() {
        let status = manager.authorizationStatus
        switch status {
        case .notDetermined:
            manager.requestWhenInUseAuthorization()
        case .authorizedWhenInUse, .authorizedAlways:
            hasPermission = true
            manager.requestLocation()
        default:
            hasPermission = false
            isLoading = false
        }
    }

    nonisolated func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        let status = manager.authorizationStatus
        Task { @MainActor in
            switch status {
            case .authorizedWhenInUse, .authorizedAlways:
                self.hasPermission = true
                manager.requestLocation()
            case .notDetermined:
                break
            default:
                self.hasPermission = false
                self.isLoading = false
            }
        }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let coord = locations.last?.coordinate else { return }
        Task { @MainActor in
            self.location = coord
            self.isLoading = false
        }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        Task { @MainActor in
            self.isLoading = false
        }
    }

    /// Great-circle distance in miles.
    func distance(to beach: Beach) -> Double? {
        guard let loc = location else { return nil }
        let r = 3959.0
        let dLat = (beach.latitude - loc.latitude) * .pi / 180
        let dLon = (beach.longitude - loc.longitude) * .pi / 180
        let a = sin(dLat / 2) * sin(dLat / 2) +
            cos(loc.latitude * .pi / 180) * cos(beach.latitude * .pi / 180) *
            sin(dLon / 2) * sin(dLon / 2)
        let c = 2 * atan2(sqrt(a), sqrt(1 - a))
        return r * c
    }
}
