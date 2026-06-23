//
//  FavoritesView.swift
//  BeachReport
//

import SwiftUI

struct FavoritesView: View {
    @Environment(BeachStore.self) private var store
    var onView: () -> Void

    var body: some View {
        VStack(spacing: 0) {
            BeachHeaderView(showBeachInfo: false)

            let favorites = store.favoriteBeaches
            if favorites.isEmpty {
                emptyState
            } else {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Favorite Beaches").font(.system(size: 24, weight: .bold)).foregroundStyle(Theme.textDark)
                    Text("\(favorites.count) \(favorites.count == 1 ? "beach" : "beaches")")
                        .font(.system(size: 14)).foregroundStyle(Theme.textMuted)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(16)

                ScrollView(showsIndicators: false) {
                    LazyVStack(spacing: 12) {
                        ForEach(favorites) { beach in
                            beachCard(beach)
                        }
                    }
                    .padding(.horizontal, 16).padding(.bottom, 16)
                }
            }
        }
        .background(Theme.background)
        .ignoresSafeArea(edges: .bottom)
    }

    private func beachCard(_ beach: Beach) -> some View {
        HStack(spacing: 0) {
            Button {
                store.addBeachToHome(beach)
                onView()
            } label: {
                HStack(spacing: 0) {
                    thumbnail(beach)
                    VStack(alignment: .leading, spacing: 4) {
                        Text(beach.name).font(.system(size: 18, weight: .semibold)).foregroundStyle(Theme.textDark)
                        Text(beach.state).font(.system(size: 14)).foregroundStyle(Theme.textMuted)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(12)
                }
            }
            .buttonStyle(.plain)

            Button {
                store.toggleFavorite(beach.id)
            } label: {
                Image(systemName: "trash")
                    .font(.system(size: 18))
                    .foregroundStyle(Color(hex: "EF4444"))
                    .frame(width: 48)
                    .frame(maxHeight: .infinity)
                    .background(Color(hex: "FEF2F2"))
            }
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
            Image(systemName: "heart").font(.system(size: 56)).foregroundStyle(Color(hex: "CBD5E1"))
            Text("No favorite beaches yet").font(.system(size: 20, weight: .semibold)).foregroundStyle(Theme.textDark).padding(.top, 8)
            Text("Tap the heart icon on any beach to add it to your favorites")
                .font(.system(size: 16)).foregroundStyle(Theme.textMuted).multilineTextAlignment(.center)
                .padding(.horizontal, 32)
            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}
