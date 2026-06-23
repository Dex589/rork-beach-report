//
//  SearchView.swift
//  BeachReport
//

import SwiftUI

struct SearchView: View {
    @Environment(BeachStore.self) private var store
    @Environment(LocationManager.self) private var locationManager
    var onAdded: () -> Void

    @State private var searchQuery = ""

    private var results: [BeachSearchResult] {
        var beaches = BeachData.all
        let trimmed = searchQuery.trimmingCharacters(in: .whitespaces)
        if !trimmed.isEmpty {
            let q = trimmed.lowercased()
            beaches = beaches.filter { $0.name.lowercased().contains(q) || $0.state.lowercased().contains(q) }
        }

        if locationManager.location != nil {
            let mapped = beaches.map { BeachSearchResult(beach: $0, distance: locationManager.distance(to: $0)) }
                .sorted { ($0.distance ?? .greatestFiniteMagnitude) < ($1.distance ?? .greatestFiniteMagnitude) }
            return trimmed.isEmpty ? Array(mapped.prefix(5)) : mapped
        }

        let base = trimmed.isEmpty ? BeachData.popular : beaches
        return base.map { BeachSearchResult(beach: $0) }
    }

    private var headerTitle: String {
        if !searchQuery.trimmingCharacters(in: .whitespaces).isEmpty { return "Search Results" }
        return locationManager.location != nil ? "Nearest Beaches" : "Popular Beaches"
    }

    var body: some View {
        VStack(spacing: 0) {
            BeachHeaderView(showBeachInfo: false)

            HStack(spacing: 12) {
                Image(systemName: "magnifyingglass").foregroundStyle(Theme.textFaint)
                TextField("Search beaches...", text: $searchQuery)
                    .autocorrectionDisabled()
                    .font(.system(size: 16))
            }
            .padding(.horizontal, 16).padding(.vertical, 12)
            .background(Color(hex: "F1F5F9"), in: RoundedRectangle(cornerRadius: 12))
            .padding(16)
            .background(Theme.card)
            .overlay(alignment: .bottom) { Divider() }

            if locationManager.isLoading {
                Spacer()
                ProgressView().tint(Theme.primary)
                Text("Finding beaches near you...").font(.system(size: 16)).foregroundStyle(Theme.textMuted).padding(.top, 12)
                Spacer()
            } else {
                VStack(alignment: .leading, spacing: 4) {
                    Text(headerTitle).font(.system(size: 24, weight: .bold)).foregroundStyle(Theme.textDark)
                    Text("\(results.count) \(results.count == 1 ? "beach" : "beaches")")
                        .font(.system(size: 14)).foregroundStyle(Theme.textMuted)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 16).padding(.top, 16).padding(.bottom, 8)

                if results.isEmpty {
                    emptyState
                } else {
                    ScrollView(showsIndicators: false) {
                        LazyVStack(spacing: 12) {
                            ForEach(results) { result in
                                beachCard(result)
                            }
                        }
                        .padding(16)
                    }
                }
            }
        }
        .background(Theme.background)
        .ignoresSafeArea(edges: .bottom)
    }

    private func beachCard(_ result: BeachSearchResult) -> some View {
        let inHome = store.isInHome(result.beach.id)
        return HStack(spacing: 0) {
            thumbnail(result.beach)
            VStack(alignment: .leading, spacing: 4) {
                Text(result.beach.name).font(.system(size: 18, weight: .semibold)).foregroundStyle(Theme.textDark)
                Text(result.beach.state).font(.system(size: 14)).foregroundStyle(Theme.textMuted)
                if let distance = result.distance {
                    HStack(spacing: 4) {
                        Image(systemName: "mappin.and.ellipse").font(.system(size: 12)).foregroundStyle(Theme.textMuted)
                        Text(String(format: "%.1f miles away", distance)).font(.system(size: 12)).foregroundStyle(Theme.textMuted)
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(12)

            Button {
                if !inHome {
                    store.addBeachToHome(result.beach)
                    onAdded()
                }
            } label: {
                VStack(spacing: 2) {
                    Image(systemName: inHome ? "checkmark" : "plus")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundStyle(inHome ? Color(hex: "10B981") : Theme.primary)
                    Text(inHome ? "Added" : "Add")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(inHome ? Color(hex: "10B981") : Theme.primary)
                }
                .frame(width: 48)
                .frame(maxHeight: .infinity)
                .background(inHome ? Color(hex: "F0FDF4") : Color(hex: "EFF6FF"))
            }
            .disabled(inHome)
        }
        .frame(height: 100)
        .background(Theme.card)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .cardShadow()
    }

    private func thumbnail(_ beach: Beach) -> some View {
        Color(.secondarySystemBackground)
            .frame(width: 100, height: 100)
            .overlay {
                AsyncImage(url: beach.imageUrl.flatMap(URL.init)) { phase in
                    if let image = phase.image {
                        image.resizable().aspectRatio(contentMode: .fill)
                    } else {
                        Image(systemName: "water.waves").foregroundStyle(Theme.textFaint)
                    }
                }
                .allowsHitTesting(false)
            }
            .clipped()
    }

    private var emptyState: some View {
        VStack(spacing: 8) {
            Spacer()
            Image(systemName: "magnifyingglass").font(.system(size: 56)).foregroundStyle(Color(hex: "CBD5E1"))
            Text("No beaches found").font(.system(size: 20, weight: .semibold)).foregroundStyle(Theme.textDark).padding(.top, 8)
            Text("Try a different search term").font(.system(size: 16)).foregroundStyle(Theme.textMuted)
            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}
