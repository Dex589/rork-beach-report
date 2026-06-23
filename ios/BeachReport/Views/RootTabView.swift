//
//  RootTabView.swift
//  BeachReport
//

import SwiftUI

struct RootTabView: View {
    @State private var store = BeachStore()
    @State private var locationManager = LocationManager()
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            HomeView()
                .tabItem { Label("Home", systemImage: "house.fill") }
                .tag(0)

            SearchView(onAdded: { selectedTab = 0 })
                .tabItem { Label("Search", systemImage: "magnifyingglass") }
                .tag(1)

            FavoritesView(onView: { selectedTab = 0 })
                .tabItem { Label("Favorites", systemImage: "heart.fill") }
                .tag(2)

            SettingsView()
                .tabItem { Label("Settings", systemImage: "gearshape.fill") }
                .tag(3)
        }
        .tint(Theme.primary)
        .environment(store)
        .environment(locationManager)
    }
}
