//
//  BeachStore.swift
//  BeachReport
//
//  Manages the user's favorites and home-screen beaches, persisted to disk.
//

import Foundation
import Observation

@MainActor
@Observable
final class BeachStore {
    private(set) var favorites: [String] = []
    private(set) var homeBeaches: [Beach] = []
    var selectedBeachId: String?

    private let maxHomeBeaches = 5
    private let favoritesKey = "beach_report_favorites"
    private let homeBeachesKey = "beach_report_home_beaches"

    init() {
        load()
    }

    private func load() {
        let defaults = UserDefaults.standard

        if let data = defaults.data(forKey: favoritesKey),
           let ids = try? JSONDecoder().decode([String].self, from: data) {
            favorites = ids
        }

        if let data = defaults.data(forKey: homeBeachesKey),
           let stored = try? JSONDecoder().decode([Beach].self, from: data),
           !stored.isEmpty {
            // Rehydrate from the freshest catalog data so station/camera updates apply.
            homeBeaches = stored.map { BeachData.beach(withId: $0.id) ?? $0 }
        } else if let first = BeachData.popular.first {
            homeBeaches = [first]
        }
    }

    // MARK: - Favorites

    func isFavorite(_ beachId: String) -> Bool {
        favorites.contains(beachId)
    }

    func toggleFavorite(_ beachId: String) {
        if favorites.contains(beachId) {
            favorites.removeAll { $0 == beachId }
        } else {
            favorites.append(beachId)
        }
        persist(favorites, key: favoritesKey)
    }

    var favoriteBeaches: [Beach] {
        BeachData.all.filter { favorites.contains($0.id) }
    }

    // MARK: - Home beaches

    func addBeachToHome(_ beach: Beach) {
        if homeBeaches.contains(where: { $0.id == beach.id }) {
            selectedBeachId = beach.id
            return
        }
        if homeBeaches.count >= maxHomeBeaches {
            homeBeaches = [beach] + homeBeaches.prefix(maxHomeBeaches - 1)
        } else {
            homeBeaches = [beach] + homeBeaches
        }
        selectedBeachId = beach.id
        persist(homeBeaches, key: homeBeachesKey)
    }

    func removeBeachFromHome(_ beachId: String) {
        homeBeaches.removeAll { $0.id == beachId }
        persist(homeBeaches, key: homeBeachesKey)
    }

    func isInHome(_ beachId: String) -> Bool {
        homeBeaches.contains { $0.id == beachId }
    }

    // MARK: - Persistence

    private func persist<T: Encodable>(_ value: T, key: String) {
        if let data = try? JSONEncoder().encode(value) {
            UserDefaults.standard.set(data, forKey: key)
        }
    }
}
