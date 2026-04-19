import { Carpool, Journey, Route, SavedRoute } from "@/types";

export const mockRoutes: Route[] = [
  {
    id: "r1",
    type: "fastest",
    totalTime: 28,
    totalCost: 2.5,
    walkingDistance: 600,
    segments: [
      { mode: "walk", duration: 8, distance: 500, details: "Walk to Bus Stop A" },
      { mode: "bus", duration: 17, distance: 4200, details: "Bus #5 → City Center" },
      { mode: "walk", duration: 3, distance: 100, details: "Walk to destination" },
    ],
    badges: ["within-budget", "eco-friendly"],
  },
  {
    id: "r2",
    type: "cheapest",
    totalTime: 42,
    totalCost: 1.25,
    walkingDistance: 1400,
    segments: [
      { mode: "walk", duration: 18, distance: 1200, details: "Walk to Train Station" },
      { mode: "train", duration: 20, distance: 6800, details: "Line 2 → Central" },
      { mode: "walk", duration: 4, distance: 200, details: "Walk to destination" },
    ],
    badges: ["within-budget", "eco-friendly", "lowest-price"],
  },
  {
    id: "r3",
    type: "balanced",
    totalTime: 33,
    totalCost: 1.85,
    walkingDistance: 900,
    segments: [
      { mode: "walk", duration: 6, distance: 400, details: "Walk to Bus Stop B" },
      { mode: "bus", duration: 14, distance: 3500, details: "Bus #12 → Midtown" },
      { mode: "walk", duration: 7, distance: 500, details: "Walk to destination" },
    ],
    badges: ["within-budget", "eco-friendly"],
  },
];

export const mockCarpools: Carpool[] = [
  {
    id: "c1",
    driver: {
      id: "d1",
      name: "Lisa Chen",
      rating: 4.8,
      reviews: 47,
      initials: "LC",
      verified: true,
      bio: "Marketing professional",
    },
    route: { from: "Riverside Apts", to: "Downtown Office" },
    schedule: "8:00 AM",
    recurrence: "Mon–Fri",
    vehicle: "Blue Sedan",
    seatsAvailable: 3,
    pricePerSeat: 1.5,
    reviewSnippet: "Great driver, always on time!",
  },
  {
    id: "c2",
    driver: {
      id: "d2",
      name: "Marcus Webb",
      rating: 4.9,
      reviews: 132,
      initials: "MW",
      verified: true,
      bio: "Software engineer",
    },
    route: { from: "Northgate", to: "Tech Park" },
    schedule: "9:15 AM",
    recurrence: "Daily",
    vehicle: "White Hatchback",
    seatsAvailable: 2,
    pricePerSeat: 2.0,
    reviewSnippet: "Super clean car, friendly chats.",
  },
  {
    id: "c3",
    driver: {
      id: "d3",
      name: "Priya Sharma",
      rating: 4.7,
      reviews: 28,
      initials: "PS",
      verified: false,
      bio: "Grad student",
    },
    route: { from: "University Heights", to: "Library District" },
    schedule: "7:45 AM",
    recurrence: "Mon, Wed, Fri",
    vehicle: "Red Compact",
    seatsAvailable: 1,
    pricePerSeat: 1.25,
    reviewSnippet: "Quiet ride, perfect for morning study.",
  },
  {
    id: "c4",
    driver: {
      id: "d4",
      name: "Diego Alvarez",
      rating: 5.0,
      reviews: 89,
      initials: "DA",
      verified: true,
      bio: "Architect",
    },
    route: { from: "Westside", to: "Convention Center" },
    schedule: "8:30 AM",
    recurrence: "Tue–Thu",
    vehicle: "Silver SUV",
    seatsAvailable: 4,
    pricePerSeat: 1.75,
    reviewSnippet: "Best carpool I've ever joined.",
  },
];

export const mockSavedRoutes: SavedRoute[] = [
  { id: "s1", label: "Home → Office", from: "Riverside Apts", to: "Downtown Office", usedCount: 47, monthlySavings: 35 },
  { id: "s2", label: "Home → Gym", from: "Riverside Apts", to: "Iron Fitness", usedCount: 22, monthlySavings: 14 },
  { id: "s3", label: "Office → Coffee", from: "Downtown Office", to: "Bean Bar", usedCount: 31, monthlySavings: 9 },
];

export const mockJourneys: Journey[] = [
  { id: "j1", date: "Apr 16", routeLabel: "Home → Office", cost: 1.5, durationMin: 28, rating: 5 },
  { id: "j2", date: "Apr 15", routeLabel: "Office → Home", cost: 2.5, durationMin: 32, rating: 4 },
  { id: "j3", date: "Apr 14", routeLabel: "Home → Library", cost: 1.25, durationMin: 24, rating: 5 },
  { id: "j4", date: "Apr 12", routeLabel: "Office → Gym", cost: 1.75, durationMin: 18, rating: 5 },
];

export const mockUser = {
  name: "Alex Morgan",
  email: "alex.morgan@email.com",
  phone: "+1 (555) 123-4567",
  memberSince: "January 2024",
  rating: 4.9,
  initials: "AM",
};
