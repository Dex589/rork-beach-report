//
//  SettingsView.swift
//  BeachReport
//

import SwiftUI

struct SettingsView: View {
    private var appVersion: String {
        Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0"
    }

    var body: some View {
        VStack(spacing: 0) {
            BeachHeaderView(showBeachInfo: false)

            ScrollView(showsIndicators: false) {
                VStack(spacing: 0) {
                    VStack(spacing: 4) {
                        Image(systemName: "gearshape.fill").font(.system(size: 44)).foregroundStyle(Theme.primary)
                        Text("Beach Report").font(.system(size: 28, weight: .bold)).foregroundStyle(Theme.textDark).padding(.top, 12)
                        Text("Real-time beach conditions").font(.system(size: 16)).foregroundStyle(Theme.textMuted)
                    }
                    .padding(32)

                    section("About") {
                        card {
                            row(icon: "info.circle", label: "Version", value: appVersion)
                        }
                    }

                    section("Data Sources") {
                        card {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Beach Report provides real-time beach conditions using data from:")
                                    .font(.system(size: 14)).foregroundStyle(Theme.textMuted).lineSpacing(4)
                                    .padding(.bottom, 4)
                                dataItem("NOAA - Tide and marine data")
                                dataItem("Open-Meteo - Weather information")
                                dataItem("Sunrise-Sunset API - Sun times")
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                        }
                    }

                    section("Features") {
                        card {
                            VStack(alignment: .leading, spacing: 12) {
                                feature("📍", "GPS-based beach discovery")
                                feature("🌊", "Real-time surf and tide data")
                                feature("☀️", "UV index and sun times")
                                feature("🚩", "Beach safety warnings")
                                feature("📸", "Live beach camera links")
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                        }
                    }

                    section("Support") {
                        Link(destination: URL(string: "mailto:support@beach-report.com")!) {
                            card {
                                row(icon: "envelope", label: "Contact Support", value: "support@beach-report.com")
                            }
                        }
                        .buttonStyle(.plain)
                    }

                    Text("Made with ❤️ for beach lovers")
                        .font(.system(size: 14)).foregroundStyle(Theme.textFaint)
                        .padding(32)
                }
            }
        }
        .background(Theme.background)
        .ignoresSafeArea(edges: .bottom)
    }

    private func section<Content: View>(_ title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title).font(.system(size: 18, weight: .bold)).foregroundStyle(Theme.textDark)
            content()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
    }

    private func card<Content: View>(@ViewBuilder content: () -> Content) -> some View {
        content()
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Theme.card, in: RoundedRectangle(cornerRadius: 12))
            .cardShadow()
    }

    private func row(icon: String, label: String, value: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon).foregroundStyle(Theme.primary).frame(width: 22)
            VStack(alignment: .leading, spacing: 2) {
                Text(label).font(.system(size: 14)).foregroundStyle(Theme.textMuted)
                Text(value).font(.system(size: 16, weight: .semibold)).foregroundStyle(Theme.textDark)
            }
            Spacer()
        }
    }

    private func dataItem(_ text: String) -> some View {
        Text("• \(text)").font(.system(size: 14)).foregroundStyle(Theme.textDark).lineSpacing(4)
    }

    private func feature(_ emoji: String, _ text: String) -> some View {
        HStack(spacing: 12) {
            Text(emoji).font(.system(size: 18))
            Text(text).font(.system(size: 16)).foregroundStyle(Theme.textDark)
        }
    }
}
