//
//  AlertsView.swift
//  BeachReport
//

import SwiftUI

struct AlertsView: View {
    let alerts: [BeachAlert]
    let flag: FlagWarning
    let beachName: String

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 16) {
                    flagStatusCard

                    VStack(alignment: .leading, spacing: 4) {
                        Text("Active Alerts (\(alerts.count))")
                            .font(.system(size: 22, weight: .bold)).foregroundStyle(Theme.textDark)
                        Text("These conditions were evaluated to determine the current flag status")
                            .font(.system(size: 14)).foregroundStyle(Theme.textMuted)
                    }

                    ForEach(alerts) { alert in
                        alertCard(alert)
                    }

                    infoBox
                }
                .padding(16)
            }
            .background(Theme.background)
            .navigationTitle("Beach Alerts")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }

    private var flagStatusCard: some View {
        HStack(spacing: 16) {
            Image(systemName: flag == .green ? "checkmark.circle.fill" : "exclamationmark.triangle.fill")
                .font(.system(size: 30)).foregroundStyle(.white)
            VStack(alignment: .leading, spacing: 4) {
                Text(flagLabel).font(.system(size: 20, weight: .bold)).foregroundStyle(.white)
                Text(beachName).font(.system(size: 14)).foregroundStyle(.white.opacity(0.9))
            }
            Spacer()
        }
        .padding(20)
        .background(Theme.flagColor(flag), in: RoundedRectangle(cornerRadius: 16))
        .cardShadow(strong: true)
    }

    private func alertCard(_ alert: BeachAlert) -> some View {
        VStack(spacing: 0) {
            HStack(spacing: 12) {
                Image(systemName: iconName(alert.type))
                    .font(.system(size: 22)).foregroundStyle(.white)
                    .frame(width: 48, height: 48)
                    .background(Color.white.opacity(0.2), in: Circle())
                VStack(alignment: .leading, spacing: 6) {
                    Text(alert.title).font(.system(size: 16, weight: .bold)).foregroundStyle(.white)
                    Text(alert.severity.rawValue.uppercased())
                        .font(.system(size: 11, weight: .bold)).foregroundStyle(.white).tracking(0.5)
                        .padding(.horizontal, 10).padding(.vertical, 4)
                        .background(Color.white.opacity(0.25), in: Capsule())
                }
                Spacer()
            }
            .padding(16)
            .background(Theme.severityColor(alert.severity))

            VStack(alignment: .leading, spacing: 16) {
                Text(alert.description).font(.system(size: 15)).foregroundStyle(Color(hex: "475569")).lineSpacing(4)
                if let value = alert.value, let threshold = alert.threshold {
                    VStack(spacing: 8) {
                        HStack {
                            Text("Current Value:").font(.system(size: 14, weight: .medium)).foregroundStyle(Theme.textMuted)
                            Spacer()
                            Text(value).font(.system(size: 14, weight: .bold)).foregroundStyle(Theme.textDark)
                        }
                        HStack {
                            Text("Safe Threshold:").font(.system(size: 14, weight: .medium)).foregroundStyle(Theme.textMuted)
                            Spacer()
                            Text(threshold).font(.system(size: 14, weight: .bold)).foregroundStyle(Color(hex: "10B981"))
                        }
                    }
                    .padding(12)
                    .background(Color(hex: "F1F5F9"), in: RoundedRectangle(cornerRadius: 8))
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(16)
        }
        .background(Theme.card)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .cardShadow()
    }

    private var infoBox: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("About Beach Flags").font(.system(size: 16, weight: .bold)).foregroundStyle(Color(hex: "1E40AF"))
            Text("Beach flag colors indicate water safety conditions. Green means safe, yellow indicates moderate hazards, red means dangerous conditions, and purple warns of marine life hazards. Always follow lifeguard instructions and posted warnings.")
                .font(.system(size: 14)).foregroundStyle(Color(hex: "1E40AF")).lineSpacing(4)
        }
        .padding(16)
        .background(Color(hex: "EFF6FF"), in: RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color(hex: "BFDBFE"), lineWidth: 1))
    }

    private func iconName(_ type: AlertType) -> String {
        switch type {
        case .weather: return "sun.max.fill"
        case .surf: return "water.waves"
        case .wind: return "wind"
        case .water: return "drop.fill"
        case .marine: return "exclamationmark.triangle.fill"
        }
    }

    private var flagLabel: String {
        switch flag {
        case .green: return "Green Flag - Safe Conditions"
        case .yellow: return "Yellow Flag - Moderate Hazard"
        case .red: return "Red Flag - Dangerous Conditions"
        case .purple: return "Purple Flag - Marine Life Warning"
        case .none: return "No Flag Status"
        }
    }
}
