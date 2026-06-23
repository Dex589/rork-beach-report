//
//  BeachHeaderView.swift
//  BeachReport
//
//  Branded sky-gradient header with a layered wave bottom edge.
//

import SwiftUI

/// Wave silhouette drawn along the bottom of the header.
private struct WaveShape: Shape {
    let baseline: CGFloat

    func path(in rect: CGRect) -> Path {
        var path = Path()
        let w = rect.width
        let h = rect.height
        let segment = w / 6
        let amplitude: CGFloat = 7.5
        path.move(to: CGPoint(x: 0, y: baseline))
        var x: CGFloat = 0
        var up = true
        while x < w {
            let cpX = x + segment / 2
            let cpY = up ? baseline - amplitude : baseline + amplitude
            path.addQuadCurve(to: CGPoint(x: x + segment, y: baseline), control: CGPoint(x: cpX, y: cpY))
            x += segment
            up.toggle()
        }
        path.addLine(to: CGPoint(x: w, y: h))
        path.addLine(to: CGPoint(x: 0, y: h))
        path.closeSubpath()
        return path
    }
}

struct BeachHeaderView: View {
    var beachName: String?
    var location: String?
    var isFavorite: Bool = false
    var showBeachInfo: Bool = true
    var onFavorite: (() -> Void)?

    var body: some View {
        ZStack(alignment: .bottom) {
            LinearGradient(
                colors: [Theme.gradientStart, Theme.gradientEnd],
                startPoint: .leading,
                endPoint: .trailing
            )

            ZStack(alignment: .bottom) {
                WaveShape(baseline: 12).fill(Color.white.opacity(0.15))
                WaveShape(baseline: 15).fill(Color.white.opacity(0.25))
                WaveShape(baseline: 18).fill(Color.white.opacity(0.4))
                WaveShape(baseline: 21).fill(Color.white)
            }
            .frame(height: 30)

            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    HStack(spacing: 8) {
                        Image(systemName: "water.waves")
                            .font(.system(size: 24, weight: .bold))
                            .foregroundStyle(.white)
                        HStack(spacing: 0) {
                            Text("Beach ").foregroundStyle(.white)
                            Text("Report").foregroundStyle(Theme.accentYellow)
                        }
                        .font(.system(size: 22, weight: .bold))
                    }
                    Spacer()
                    if let onFavorite {
                        Button(action: onFavorite) {
                            Image(systemName: isFavorite ? "heart.fill" : "heart")
                                .font(.system(size: 18, weight: .semibold))
                                .foregroundStyle(isFavorite ? Color(hex: "EF4444") : .white)
                                .frame(width: 36, height: 36)
                                .background(Color.white.opacity(0.25), in: Circle())
                        }
                    }
                }

                if showBeachInfo {
                    HStack(spacing: 6) {
                        Text(isFavorite ? "Favorite" : "Recently Viewed")
                            .font(.system(size: 13))
                            .foregroundStyle(.white.opacity(0.9))
                        Circle().fill(.white.opacity(0.7)).frame(width: 4, height: 4)
                        Text(beachName ?? "")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(.white)
                    }

                    HStack {
                        HStack(spacing: 6) {
                            Image(systemName: "mappin.and.ellipse")
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundStyle(.white)
                            Text(location ?? "")
                                .font(.system(size: 14, weight: .medium))
                                .foregroundStyle(.white)
                            Circle()
                                .fill(Color(hex: "10B981"))
                                .frame(width: 10, height: 10)
                                .overlay(Circle().stroke(.white, lineWidth: 2))
                        }
                        Spacer()
                        Image(systemName: "cloud.fill")
                            .font(.system(size: 16))
                            .foregroundStyle(.white)
                            .frame(width: 36, height: 36)
                            .background(Color.white.opacity(0.25), in: Circle())
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 22)
        }
        .frame(height: showBeachInfo ? 152 : 96)
        .ignoresSafeArea(edges: .top)
    }
}
