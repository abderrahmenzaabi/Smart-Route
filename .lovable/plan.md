
# Transport Routing Web App - MVP Plan

A smart urban mobility platform with multi-modal route planning and peer-to-peer carpooling, built mobile-first with mock data for hackathon demo.

## Pages & Navigation

**Bottom nav (mobile) / Sidebar (desktop)** with 4 sections: Home, Carpools, Rides, Profile.

1. **Home** — Route planning form
   - From / To inputs (with GPS button on "From")
   - Budget slider ($0–$50)
   - Time urgency selector (Don't Care / Soon / Urgent)
   - Max walking distance slider (100m–5km)
   - "Find Routes" primary CTA + "Browse Carpools" secondary

2. **Route Results** — 3 mock route cards
   - Fastest (blue accent), Cheapest (green), Balanced (gray)
   - Each shows time, cost, walking distance, segment breakdown (walk → bus → walk), badges (eco-friendly, within-budget)
   - Staggered slide-up animation on load
   - "Select Route" → navigates to Ride Details

3. **Carpool Marketplace** — 4–5 driver listings
   - Driver avatar, name, star rating, vehicle, route, schedule, price/seat
   - Review snippet
   - "Request to Join" (with loading → success state) + "View Profile"

4. **Ride Details** — Active journey tracking
   - Vertical timeline: Picked Up ✓ → In Route (pulsing) → Arrive
   - Status banner ("Driver is 5 min away")
   - Map placeholder, cost summary, Cancel/Share buttons

5. **Profile** — User info, saved routes (with usage stats), recent journeys list

6. **Rating Modal** — Triggered after carpool request demo
   - Overall 5-star rating + category sub-ratings (friendliness, cleanliness, safety, on-time)
   - Comment textarea, Submit/Skip buttons

## Design System

- **Colors**: Primary blue `#0066CC`, secondary green `#10B981`, amber `#F59E0B`, red `#EF4444`, neutral grays — wired into `index.css` as HSL tokens and Tailwind theme
- **Typography**: Poppins (headings), Inter (body), JetBrains Mono (prices/times) loaded from Google Fonts
- **Tokens**: spacing scale, border radii, elevation shadows, slide-up/pop-in/pulse keyframes

## Reusable Components

Built on top of existing shadcn primitives where possible, plus custom: `RouteCard`, `CarpoolCard`, `JourneyTimeline`, `RatingStars` (interactive), `BottomNav` / `Sidebar` shell, `MapPlaceholder`.

## Data & State

- All data hardcoded in `src/data/mockData.ts` (routes, carpools, user, journeys)
- TypeScript interfaces in `src/types/index.ts`
- Form state via `useState`; selected route passed via React Router state
- React Router for page transitions

## Out of Scope (for MVP)

- Real backend / authentication
- Real map integration (placeholder card)
- Dark mode toggle (can add in polish phase if time allows)
- Settings page (defer)
