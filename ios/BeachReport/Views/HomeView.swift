//
//  HomeView.swift
//  BeachReport
//

import SwiftUI

struct HomeView: View {
    @Environment(BeachStore.self) private var store

    @State private var currentIndex = 0
    @State private var conditions: BeachConditions?
    @State private var isLoadingConditions = false
    @State private var loadTask: Task<Void, Never>?
    @State private var dragOffset: CGFloat = 0
    @State private var showAlerts = false
    @State private var beachToRemove: Beach?

    private var currentBeach: Beach? {
        guard !store.homeBeaches.isEmpty else { return nil }
        let index = min(currentIndex, store.homeBeaches.count - 1)
        return store.homeBeaches[index]
    }

    var body: some View {
        VStack(spacing: 0) {
            BeachHeaderView(
                beachName: currentBeach?.name,
                location: currentBeach.map { "\($0.name), \($0.state)" },
                isFavorite: currentBeach.map { store.isFavorite($0.id) } ?? false,
                onFavorite: { if let b = currentBeach { store.toggleFavorite(b.id) } }
            )

            if let beach = currentBeach {
                content(for: beach)
            } else {
                emptyState
            }
        }
        .background(Theme.background)
        .ignoresSafeArea(edges: .bottom)
        .task(id: currentBeach?.id) { await loadConditions() }
        .onChange(of: store.selectedBeachId) { _, newValue in
            guard let id = newValue,
                  let index = store.homeBeaches.firstIndex(where: { $0.id == id }) else { return }
            currentIndex = index
            store.selectedBeachId = nil
        }
        .onChange(of: store.homeBeaches.count) { _, count in
            if currentIndex > max(count - 1, 0) { currentIndex = max(count - 1, 0) }
        }
        .sheet(isPresented: $showAlerts) {
            if let conditions {
                AlertsView(alerts: conditions.alerts, flag: conditions.flagWarning, beachName: conditions.beach.name)
            }
        }
        .alert("Remove Beach", isPresented: Binding(get: { beachToRemove != nil }, set: { if !$0 { beachToRemove = nil } })) {
            Button("Cancel", role: .cancel) { beachToRemove = nil }
            Button("Remove", role: .destructive) {
                if let b = beachToRemove { store.removeBeachFromHome(b.id) }
                beachToRemove = nil
            }
        } message: {
            Text("Remove \(beachToRemove?.name ?? "") from your home page?")
        }
    }

    // MARK: - Content

    @ViewBuilder
    private func content(for beach: Beach) -> some View {
        ScrollViewReader { proxy in
            ScrollView(showsIndicators: false) {
                VStack(spacing: 0) {
                    Color.clear.frame(height: 0).id("top")
                    heroImage(beach)

                    if isLoadingConditions && conditions == nil {
                        loadingSection
                    } else if let conditions {
                        conditionsBody(conditions, beach: beach)
                    }
                }
            }
            .offset(x: dragOffset)
            .simultaneousGesture(swipeGesture(proxy: proxy))
            .onChange(of: currentIndex) { _, _ in
                proxy.scrollTo("top", anchor: .top)
            }
        }
    }

    private func swipeGesture(proxy: ScrollViewProxy) -> some Gesture {
        DragGesture(minimumDistance: 20)
            .onChanged { value in
                if abs(value.translation.width) > abs(value.translation.height) {
                    dragOffset = value.translation.width
                }
            }
            .onEnded { value in
                let threshold: CGFloat = 60
                guard store.homeBeaches.count > 1,
                      abs(value.translation.width) > threshold,
                      abs(value.translation.width) > abs(value.translation.height) else {
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) { dragOffset = 0 }
                    return
                }
                let goNext = value.translation.width < 0
                let screenW = UIScreen.main.bounds.width
                withAnimation(.easeIn(duration: 0.15)) {
                    dragOffset = goNext ? -screenW : screenW
                }
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
                    changeBeach(next: goNext)
                    dragOffset = goNext ? screenW : -screenW
                    withAnimation(.easeOut(duration: 0.22)) { dragOffset = 0 }
                }
            }
    }

    private func changeBeach(next: Bool) {
        let count = store.homeBeaches.count
        guard count > 1 else { return }
        if next {
            currentIndex = currentIndex < count - 1 ? currentIndex + 1 : 0
        } else {
            currentIndex = currentIndex > 0 ? currentIndex - 1 : count - 1
        }
        let generator = UIImpactFeedbackGenerator(style: .light)
        generator.impactOccurred()
    }

    // MARK: - Hero image

    @ViewBuilder
    private func heroImage(_ beach: Beach) -> some View {
        Color(.secondarySystemBackground)
            .frame(height: 300)
            .overlay {
                AsyncImage(url: beach.imageUrl.flatMap(URL.init)) { phase in
                    switch phase {
                    case .success(let image):
                        image.resizable().aspectRatio(contentMode: .fill)
                    case .empty:
                        ProgressView()
                    default:
                        Image(systemName: "water.waves").font(.largeTitle).foregroundStyle(Theme.textFaint)
                    }
                }
                .allowsHitTesting(false)
            }
            .clipped()
            .overlay(alignment: .topTrailing) {
                if !store.isFavorite(beach.id) {
                    Button { beachToRemove = beach } label: {
                        Image(systemName: "xmark")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundStyle(.white)
                            .frame(width: 36, height: 36)
                            .background(Color.black.opacity(0.45), in: Circle())
                    }
                    .padding(12)
                }
            }
            .overlay(alignment: .bottom) {
                if store.homeBeaches.count > 1 {
                    navigationRow
                        .padding(16)
                        .background(
                            LinearGradient(colors: [.clear, .black.opacity(0.25)], startPoint: .top, endPoint: .bottom)
                        )
                }
            }
    }

    private var navigationRow: some View {
        HStack {
            Button { changeBeach(next: false) } label: {
                Image(systemName: "chevron.left")
                    .font(.system(size: 22, weight: .semibold))
                    .foregroundStyle(.white)
                    .frame(width: 48, height: 48)
                    .background(Color.black.opacity(0.3), in: Circle())
            }
            Spacer()
            HStack(spacing: 8) {
                ForEach(Array(store.homeBeaches.enumerated()), id: \.element.id) { index, _ in
                    Capsule()
                        .fill(index == currentIndex ? Color.white : Color.white.opacity(0.5))
                        .frame(width: index == currentIndex ? 24 : 8, height: 8)
                        .animation(.spring(response: 0.3), value: currentIndex)
                }
            }
            Spacer()
            Button { changeBeach(next: true) } label: {
                Image(systemName: "chevron.right")
                    .font(.system(size: 22, weight: .semibold))
                    .foregroundStyle(.white)
                    .frame(width: 48, height: 48)
                    .background(Color.black.opacity(0.3), in: Circle())
            }
        }
    }

    // MARK: - Conditions body

    @ViewBuilder
    private func conditionsBody(_ c: BeachConditions, beach: Beach) -> some View {
        VStack(spacing: 24) {
            if c.flagWarning != .none {
                Button { showAlerts = true } label: {
                    HStack(spacing: 12) {
                        Image(systemName: "exclamationmark.triangle.fill").foregroundStyle(.white)
                        Text(c.warningMessage ?? "")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity, alignment: .leading)
                        Image(systemName: "chevron.right").foregroundStyle(.white)
                    }
                    .padding(16)
                    .background(Theme.flagColor(c.flagWarning), in: RoundedRectangle(cornerRadius: 12))
                }
            }

            currentConditionsSection(c)
            waterTempSection(c)
            uvSection(c)
            sunTimesSection(c)
            tidesSection(c)

            if let cameraUrl = beach.cameraUrl, let url = URL(string: cameraUrl) {
                cameraButton(beach: beach, url: url)
            }

            Text("Last updated: \(BeachAPIService.formatTime(c.lastUpdated))")
                .font(.system(size: 12))
                .foregroundStyle(Theme.textFaint)
        }
        .padding(16)
    }

    // MARK: - Sections

    @ViewBuilder
    private func currentConditionsSection(_ c: BeachConditions) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            sectionTitle("Current Conditions")

            HStack(spacing: 14) {
                Image(systemName: "thermometer.medium")
                    .font(.system(size: 26))
                    .foregroundStyle(.white)
                    .frame(width: 48, height: 48)
                    .background(Color.white.opacity(0.2), in: Circle())
                VStack(alignment: .leading, spacing: 2) {
                    Text("Real Feel").font(.system(size: 18, weight: .bold)).foregroundStyle(.white)
                    Text("Feels like with humidity").font(.system(size: 13)).foregroundStyle(.white.opacity(0.85))
                }
                Spacer()
                Text("\(realFeel(c.weather.temperature, c.weather.humidity))°F")
                    .font(.system(size: 38, weight: .heavy)).foregroundStyle(.white)
            }
            .padding(16)
            .background(Theme.primary, in: RoundedRectangle(cornerRadius: 16))
            .shadow(color: Theme.primary.opacity(0.3), radius: 8, y: 4)

            let columns = [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)]
            LazyVGrid(columns: columns, spacing: 12) {
                conditionCard("thermometer.medium", "\(c.weather.temperature)°F", "Air Temperature")
                conditionCard("wind", "\(c.weather.windSpeed) mph", "Wind \(c.weather.windDirection)")
                conditionCard("drop.fill", "\(c.weather.humidity)%", "Humidity")
                conditionCard("water.waves", String(format: "%.1f ft", c.surf.height), "Surf Height")
            }
        }
    }

    private func conditionCard(_ icon: String, _ value: String, _ label: String) -> some View {
        VStack(spacing: 8) {
            Image(systemName: icon).font(.system(size: 22)).foregroundStyle(Theme.primary)
            Text(value).font(.system(size: 24, weight: .bold)).foregroundStyle(Theme.textDark)
            Text(label).font(.system(size: 14)).foregroundStyle(Theme.textMuted)
        }
        .frame(maxWidth: .infinity)
        .padding(16)
        .background(Theme.card, in: RoundedRectangle(cornerRadius: 12))
        .cardShadow()
    }

    @ViewBuilder
    private func waterTempSection(_ c: BeachConditions) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            sectionTitle("Water Temperature")
            HStack(spacing: 12) {
                Image(systemName: "drop.fill").foregroundStyle(Theme.primary)
                Text(String(format: "%.1f°F", c.waterQuality.temperature))
                    .font(.system(size: 18, weight: .semibold)).foregroundStyle(Theme.textDark)
                Spacer()
                if let source = c.waterQuality.source {
                    Text(source).font(.system(size: 11, weight: .medium)).foregroundStyle(Theme.textFaint)
                }
            }
            .padding(16)
            .background(Theme.card, in: RoundedRectangle(cornerRadius: 12))
            .cardShadow()
        }
    }

    @ViewBuilder
    private func uvSection(_ c: BeachConditions) -> some View {
        let uv = c.weather.uvIndex
        VStack(alignment: .leading, spacing: 16) {
            HStack(spacing: 8) {
                Image(systemName: "sun.max.fill").foregroundStyle(Color(hex: "B45309"))
                Text("UV Protection Guide").font(.system(size: 18, weight: .bold)).foregroundStyle(Color(hex: "92400E"))
            }
            HStack(spacing: 12) {
                Text("UV \(uv)")
                    .font(.system(size: 16, weight: .bold)).foregroundStyle(.white)
                    .padding(.horizontal, 16).padding(.vertical, 8)
                    .background(Theme.uvColor(uv), in: Capsule())
                Text(BeachAPIService.uvGuidance(uv)).font(.system(size: 16, weight: .semibold)).foregroundStyle(Color(hex: "92400E"))
            }
            VStack(alignment: .leading, spacing: 12) {
                uvRow("sun.max.fill", "Sunscreen", sunscreenRec(uv))
                uvRow("tshirt.fill", "Clothing", clothingRec(uv))
                uvRow("clock.fill", "Timing", "Seek shade during midday hours")
                uvRow("umbrella.fill", "Shade", shadeRec(uv))
            }
        }
        .padding(16)
        .background(Color(hex: "FEF3E2"), in: RoundedRectangle(cornerRadius: 12))
        .cardShadow()
    }

    private func uvRow(_ icon: String, _ title: String, _ detail: String) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon).font(.system(size: 16)).foregroundStyle(Color(hex: "B45309")).frame(width: 20)
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.system(size: 15, weight: .semibold)).foregroundStyle(Theme.textDark)
                Text(detail).font(.system(size: 14)).foregroundStyle(Theme.textMuted)
            }
            Spacer()
        }
    }

    @ViewBuilder
    private func sunTimesSection(_ c: BeachConditions) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            sectionTitle("Sun Times")
            HStack(spacing: 12) {
                sunCard("sunrise.fill", Color(hex: "F59E0B"), "Sunrise", c.sunData.sunrise)
                sunCard("sunset.fill", Color(hex: "F97316"), "Sunset", c.sunData.sunset)
            }
            HStack(spacing: 12) {
                Image(systemName: "sun.max.fill").font(.system(size: 22)).foregroundStyle(Color(hex: "D97706"))
                VStack(spacing: 4) {
                    Text("Golden Hour").font(.system(size: 14)).foregroundStyle(Theme.textMuted)
                    Text(c.sunData.goldenHour).font(.system(size: 18, weight: .bold)).foregroundStyle(Theme.textDark)
                }
            }
            .frame(maxWidth: .infinity)
            .padding(16)
            .background(Theme.card, in: RoundedRectangle(cornerRadius: 12))
            .cardShadow()
        }
    }

    private func sunCard(_ icon: String, _ color: Color, _ label: String, _ value: String) -> some View {
        VStack(spacing: 8) {
            Image(systemName: icon).font(.system(size: 22)).foregroundStyle(color)
            Text(label).font(.system(size: 14)).foregroundStyle(Theme.textMuted)
            Text(value).font(.system(size: 18, weight: .bold)).foregroundStyle(Theme.textDark)
        }
        .frame(maxWidth: .infinity)
        .padding(16)
        .background(Theme.card, in: RoundedRectangle(cornerRadius: 12))
        .cardShadow()
    }

    @ViewBuilder
    private func tidesSection(_ c: BeachConditions) -> some View {
        let info = tideInfo(c.tides)
        VStack(alignment: .leading, spacing: 12) {
            sectionTitle("Tide Information")

            VStack(spacing: 16) {
                HStack(spacing: 12) {
                    Image(systemName: "water.waves").font(.system(size: 26)).foregroundStyle(Theme.primary)
                    Text("Current Tide").font(.system(size: 18, weight: .bold)).foregroundStyle(Theme.textDark)
                    Spacer()
                }
                HStack {
                    Text(String(format: "%.1f ft", info.height))
                        .font(.system(size: 48, weight: .bold)).foregroundStyle(Theme.primary)
                    Spacer()
                    HStack(spacing: 8) {
                        Image(systemName: info.rising ? "arrow.up" : "arrow.down")
                            .foregroundStyle(info.rising ? Theme.primary : Color(hex: "F59E0B"))
                        Text(info.rising ? "Rising" : "Falling")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundStyle(info.rising ? Theme.primary : Color(hex: "F59E0B"))
                    }
                    .padding(.horizontal, 16).padding(.vertical, 10)
                    .background(info.rising ? Color(hex: "DBEAFE") : Color(hex: "FEF3C7"), in: Capsule())
                }
            }
            .padding(20)
            .background(Theme.card, in: RoundedRectangle(cornerRadius: 16))
            .cardShadow(strong: true)

            ForEach(c.tides) { tide in
                HStack {
                    Text(tide.time).font(.system(size: 16, weight: .semibold)).foregroundStyle(Theme.textDark)
                    Spacer()
                    Text(tide.type == .high ? "High Tide" : "Low Tide")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(tide.type == .high ? Color(hex: "1E40AF") : Color(hex: "92400E"))
                        .padding(.horizontal, 12).padding(.vertical, 4)
                        .background(tide.type == .high ? Color(hex: "DBEAFE") : Color(hex: "FEF3C7"), in: Capsule())
                    Spacer()
                    Text(String(format: "%.1f ft", tide.height)).font(.system(size: 16, weight: .semibold)).foregroundStyle(Theme.textDark)
                }
                .padding(16)
                .background(Theme.card, in: RoundedRectangle(cornerRadius: 12))
                .cardShadow()
            }
        }
    }

    @ViewBuilder
    private func cameraButton(beach: Beach, url: URL) -> some View {
        VStack(spacing: 6) {
            Link(destination: url) {
                HStack(spacing: 8) {
                    Image(systemName: "camera.fill").foregroundStyle(.white)
                    Text("View Live Camera").font(.system(size: 16, weight: .semibold)).foregroundStyle(.white)
                    if beach.cameraType == .nearby {
                        Text("Nearby")
                            .font(.system(size: 11, weight: .bold)).foregroundStyle(.white)
                            .padding(.horizontal, 8).padding(.vertical, 3)
                            .background(Color.white.opacity(0.25), in: Capsule())
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(16)
                .background(Theme.primary, in: RoundedRectangle(cornerRadius: 12))
            }
            if beach.cameraType == .nearby {
                Text("Nearby camera — shows the closest live view, not this exact beach.")
                    .font(.system(size: 12)).foregroundStyle(Theme.textMuted).multilineTextAlignment(.center)
                    .padding(.horizontal, 12)
            }
        }
    }

    // MARK: - Misc views

    private func sectionTitle(_ text: String) -> some View {
        Text(text).font(.system(size: 20, weight: .bold)).foregroundStyle(Theme.textDark)
            .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var loadingSection: some View {
        VStack(spacing: 12) {
            ProgressView().tint(Theme.primary)
            Text("Loading conditions...").font(.system(size: 16)).foregroundStyle(Theme.textMuted)
        }
        .padding(32)
    }

    private var emptyState: some View {
        VStack(spacing: 8) {
            Spacer()
            Image(systemName: "water.waves").font(.system(size: 56)).foregroundStyle(Theme.textFaint)
            Text("No beaches added yet").font(.system(size: 20, weight: .semibold)).foregroundStyle(Theme.textDark).padding(.top, 8)
            Text("Search for beaches to get started").font(.system(size: 16)).foregroundStyle(Theme.textMuted)
            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Theme.background)
    }

    // MARK: - Data loading

    private func loadConditions() async {
        guard let beach = currentBeach else { return }
        isLoadingConditions = true
        conditions = nil
        do {
            let result = try await BeachAPIService.shared.fetchConditions(for: beach)
            if currentBeach?.id == beach.id {
                conditions = result
            }
        } catch {
            print("[HomeView] Failed to load conditions: \(error.localizedDescription)")
        }
        isLoadingConditions = false
    }

    // MARK: - Calculations

    private func realFeel(_ temperatureF: Int, _ humidity: Int) -> Int {
        let t = Double(temperatureF)
        let r = Double(humidity)
        if t < 80 { return Int(t.rounded()) }
        var hi = -42.379 + 2.04901523 * t + 10.14333127 * r - 0.22475541 * t * r
            - 0.00683783 * t * t - 0.05481717 * r * r + 0.00122874 * t * t * r
            + 0.00085282 * t * r * r - 0.00000199 * t * t * r * r
        if r < 13 && t >= 80 && t <= 112 {
            hi -= ((13 - r) / 4) * (((17 - abs(t - 95)) / 17).squareRoot())
        } else if r > 85 && t >= 80 && t <= 87 {
            hi += ((r - 85) / 10) * ((87 - t) / 5)
        }
        return Int(hi.rounded())
    }

    private func tideInfo(_ tides: [TideData]) -> (height: Double, rising: Bool) {
        let now = Calendar.current
        let comps = now.dateComponents([.hour, .minute], from: Date())
        let currentMinutes = (comps.hour ?? 0) * 60 + (comps.minute ?? 0)

        struct T { let minutes: Int; let height: Double; let type: TideData.TideType }
        let withMinutes: [T] = tides.map { tide in
            let parts = tide.time.split(separator: " ")
            let hm = parts.first.map { String($0) } ?? "0:00"
            let period = parts.count > 1 ? String(parts[1]) : "AM"
            let hmParts = hm.split(separator: ":")
            let hours = Int(hmParts.first ?? "0") ?? 0
            let mins = hmParts.count > 1 ? (Int(hmParts[1]) ?? 0) : 0
            var total = hours * 60 + mins
            if period == "PM" && hours != 12 { total += 12 * 60 }
            if period == "AM" && hours == 12 { total = mins }
            return T(minutes: total, height: tide.height, type: tide.type)
        }

        var previous: T?
        var next: T?
        for t in withMinutes {
            if t.minutes <= currentMinutes { previous = t }
            if t.minutes > currentMinutes && next == nil { next = t; break }
        }
        if previous == nil { previous = withMinutes.last }
        if next == nil { next = withMinutes.first }

        let rising = previous?.type == .low && next?.type == .high
        let height: Double
        if let p = previous, let n = next {
            height = p.height + (n.height - p.height) * 0.5
        } else {
            height = previous?.height ?? 0
        }
        return (height, rising)
    }

    private func sunscreenRec(_ uv: Int) -> String {
        if uv <= 2 { return "SPF 15+" }
        if uv <= 5 { return "SPF 30+" }
        if uv <= 7 { return "SPF 30+, reapply every 2 hours" }
        return "SPF 50+, reapply frequently"
    }

    private func clothingRec(_ uv: Int) -> String {
        if uv <= 2 { return "No special precautions needed" }
        if uv <= 5 { return "Shirt, hat recommended" }
        if uv <= 7 { return "Long sleeves, hat, sunglasses" }
        return "Full coverage clothing required"
    }

    private func shadeRec(_ uv: Int) -> String {
        if uv <= 2 { return "Shade not essential" }
        if uv <= 7 { return "Shade recommended 10am-4pm" }
        return "Shade essential 10am-4pm"
    }
}
