//
//  BeachData.swift
//  BeachReport
//
//  Loads the bundled beach dataset (200 beaches) and exposes the
//  full list plus the curated "popular" subset.
//

import Foundation

enum BeachData {
    /// Every beach in the catalog, decoded from the bundled JSON resource.
    static let all: [Beach] = {
        guard let url = Bundle.main.url(forResource: "beaches", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let beaches = try? JSONDecoder().decode([Beach].self, from: data) else {
            print("[BeachData] Failed to load beaches.json")
            return []
        }
        return beaches
    }()

    /// IDs of the curated popular beaches, used as the default home/search list.
    static let popularIds: [String] = {
        guard let url = Bundle.main.url(forResource: "popular", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let ids = try? JSONDecoder().decode([String].self, from: data) else {
            return []
        }
        return ids
    }()

    static let popular: [Beach] = {
        let lookup = Dictionary(uniqueKeysWithValues: all.map { ($0.id, $0) })
        return popularIds.compactMap { lookup[$0] }
    }()

    static func beach(withId id: String) -> Beach? {
        all.first { $0.id == id }
    }
}
