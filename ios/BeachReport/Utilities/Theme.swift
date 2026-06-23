//
//  Theme.swift
//  BeachReport
//
//  Centralized palette matching the app's sky-blue / slate aesthetic.
//

import SwiftUI

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r, g, b: UInt64
        switch hex.count {
        case 6:
            (r, g, b) = (int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (r, g, b) = (0, 0, 0)
        }
        self.init(.sRGB, red: Double(r) / 255, green: Double(g) / 255, blue: Double(b) / 255, opacity: 1)
    }
}

enum Theme {
    static let background = Color(hex: "F8FAFC")
    static let card = Color.white
    static let primary = Color(hex: "0EA5E9")
    static let textDark = Color(hex: "1E293B")
    static let textMuted = Color(hex: "64748B")
    static let textFaint = Color(hex: "94A3B8")

    static let gradientStart = Color(hex: "22D3EE")
    static let gradientEnd = Color(hex: "3B82F6")
    static let accentYellow = Color(hex: "FCD34D")

    static func flagColor(_ flag: FlagWarning) -> Color {
        switch flag {
        case .green: return Color(hex: "10B981")
        case .yellow: return Color(hex: "F59E0B")
        case .red: return Color(hex: "EF4444")
        case .purple: return Color(hex: "A855F7")
        case .none: return Color(hex: "6B7280")
        }
    }

    static func uvColor(_ uvIndex: Int) -> Color {
        if uvIndex <= 2 { return Color(hex: "10B981") }
        if uvIndex <= 5 { return Color(hex: "F59E0B") }
        if uvIndex <= 7 { return Color(hex: "F97316") }
        if uvIndex <= 10 { return Color(hex: "EF4444") }
        return Color(hex: "A855F7")
    }

    static func severityColor(_ severity: AlertSeverity) -> Color {
        switch severity {
        case .extreme: return Color(hex: "DC2626")
        case .high: return Color(hex: "EF4444")
        case .moderate: return Color(hex: "F59E0B")
        case .low: return Color(hex: "10B981")
        }
    }
}

extension View {
    /// Soft card drop shadow used throughout the app.
    func cardShadow(strong: Bool = false) -> some View {
        shadow(
            color: Color.black.opacity(strong ? 0.15 : 0.08),
            radius: strong ? 8 : 4,
            x: 0,
            y: strong ? 4 : 2
        )
    }
}
