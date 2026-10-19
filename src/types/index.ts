export type TripStatus = 'researching' | 'planning' | 'upcoming' | 'ongoing' | 'completed' | 'archived';

export interface Trip {
  id: string;
  name: string;
  destination: string;
  country?: string; // e.g. "Japan", "Switzerland"
  startDate: string; // ISO date YYYY-MM-DD
  endDate: string; // ISO date YYYY-MM-DD
  status: TripStatus;
  coverImage?: string;
  defaultCurrency: string;
  plannedBudget: number;
  categoryBudgets?: Record<string, number>; // Spending allocations per category e.g. { flights: 20000, shopping: 10000 }
  travelers: string[]; // traveler names or IDs
  notes?: string;
  isSample?: boolean; // Provenance: created by Add Dummy Data
  isEdited?: boolean; // Provenance: modified by user
  isTourPreview?: boolean; // Ephemeral: loaded for interactive tour demonstration
  createdAt: string;
  updatedAt: string;
}

export interface CountryDossier {
  id: string;
  name: string;
  code?: string;
  flag?: string;
  coverImage?: string;
  notes?: string;
  isSample?: boolean;
  isEdited?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type CategoryScope = 'collection' | 'expense' | 'essential';

export interface CustomCategory {
  id: string;
  label: string;
  icon: string;
  scope: CategoryScope;
  createdAt: string;
}

export type PlaceCategory = 'attraction' | 'food' | 'stay' | 'transport' | 'nature' | 'shopping' | 'other';

export interface Place {
  id: string;
  name: string;
  address?: string;
  lat?: number;
  lng?: number;
  category: PlaceCategory;
  sourceUrl?: string;
  notes?: string;
  directionsNotes?: string; // Offline directions / navigation cues
  openingHours?: string;
  contactInfo?: string;
  tripId?: string; // null if global
  isSample?: boolean;
  isEdited?: boolean;
  createdAt: string;
}

export type CollectionItemType = 'link' | 'place' | 'note' | 'activity';
export type CollectionItemStatus = 'inbox' | 'assigned' | 'archived';

export interface CollectionItem {
  id: string;
  title: string;
  type: CollectionItemType;
  status: CollectionItemStatus;
  country: string; // Country collection name e.g. "Japan", "Switzerland"
  category: string; // 'food' | 'place' | 'stay' | 'activity' | 'shopping' | 'transport' | custom
  url?: string;
  notes?: string;
  placeId?: string;
  tripId?: string; // optional linked trip
  tags: string[];
  imageUrl?: string;
  isPlanned?: boolean;
  isSample?: boolean;
  isEdited?: boolean;
  isTourPreview?: boolean;
  createdAt: string;
}

export type EventCategory = 'activity' | 'travel' | 'food' | 'lodging' | 'sightseeing' | 'nature' | 'meeting' | 'other';

export interface ItineraryEvent {
  id: string;
  tripId: string;
  dayNumber: number; // Day 1, Day 2 etc
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  title: string;
  location?: string;
  placeId?: string;
  category: EventCategory;
  notes?: string;
  orderIndex: number;
  cost?: number;
  currency?: string;
  isSample?: boolean;
  isEdited?: boolean;
  isTourPreview?: boolean;
  createdAt: string;
}

export type BookingType = 'flight' | 'hotel' | 'train' | 'car_rental' | 'activity' | 'ferry' | 'other';
export type BookingStatus = 'confirmed' | 'pending' | 'cancelled';

export interface Booking {
  id: string;
  tripId: string;
  type: BookingType;
  title: string;
  provider: string;
  refNumber: string;
  cost: number;
  currency: string;
  status: BookingStatus;
  startDate?: string;
  endDate?: string;
  notes?: string;
  documentIds?: string[];
  isSample?: boolean;
  isEdited?: boolean;
  isTourPreview?: boolean;
  createdAt: string;
}

export interface SplitMember {
  name: string;
  share: number;
  hasPaid: boolean;
}

export type ExpenseType = 'purchase' | 'debt';
export type DebtDirection = 'i_owe' | 'they_owe';

export interface Expense {
  id: string;
  tripId: string;
  bookingId?: string; // If linked, this is a payment toward the booking (Double counting rule!)
  title: string;
  amount: number;
  currency: string;
  category: string; // 'flights' | 'lodging' | 'food' | 'transport' | 'activities' | 'shopping' | 'groceries' | custom
  paidBy: string; // name of person who paid
  date: string; // YYYY-MM-DD
  splitMode: 'none' | 'equal' | 'custom';
  splitWith: string[]; // list of traveler names sharing this expense
  customShares?: Record<string, number>; // name -> amount
  expenseType?: ExpenseType; // 'purchase' (default) or 'debt'
  debtTraveler?: string; // traveler name from the trip's travelers list
  debtDirection?: DebtDirection; // 'i_owe' (I borrowed / I owe) or 'they_owe' (I lent / they owe me)
  debtSettled?: boolean; // whether the debt is cleared/settled
  notes?: string;
  isSample?: boolean;
  isEdited?: boolean;
  isTourPreview?: boolean;
  createdAt: string;
}

export interface EssentialItem {
  id: string;
  tripId?: string; // null = template/global
  type: 'packing' | 'document';
  category: string;
  item: string;
  packed: boolean;
  assignedTo?: string;
  notes?: string;
  isSample?: boolean;
  isEdited?: boolean;
  isTourPreview?: boolean;
}

export interface VaultDocument {
  id: string;
  tripId?: string;
  bookingId?: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  dataUrl: string; // base64 data for local offline storage
  tags: string[];
  isSample?: boolean;
  isEdited?: boolean;
  createdAt: string;
}

export interface SettlementDebt {
  from: string;
  to: string;
  amount: number;
  currency: string;
}

export interface JournalEntry {
  id: string;
  title: string;
  content: string; // Written memory / story / reflection
  date: string; // YYYY-MM-DD (can predate trips by years!)
  time?: string; // Optional HH:mm
  tripId?: string; // Optional link to a trip
  itineraryEventId?: string; // Optional link to an itinerary activity
  placeId?: string; // Optional link to a saved place
  locationName?: string; // Freeform location name or address
  photos?: string[]; // Array of Base64 DataURLs or URLs
  tags?: string[]; // Memory tags
  isFavorite?: boolean; // Starred / favourite status
  mood?: string; // Optional mood / memory category
  isSample?: boolean;
  isEdited?: boolean;
  isTourPreview?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  displayName: string;
  avatar: string; // 'compass' | 'mountain' | 'plane' | 'camera' | 'palmtree' | 'sparkles'
  homeCountry: string;
  dreamCountry?: string;
  preferredCurrency: string;
  travelStyles: string[];
  onboardingCompleted: boolean;
  tourCompleted: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ==========================================
// TRAVEL COMPANION: Multi-leg Transport & Timetables
// ==========================================

export type TransportMode =
  | 'flight'
  | 'train'
  | 'bus'
  | 'subway'
  | 'ferry'
  | 'tram'
  | 'car'
  | 'taxi'
  | 'walk'
  | 'bicycle'
  | 'other';

export interface TransportLeg {
  id: string;
  tripId: string;
  dayNumber?: number; // Day 1, Day 2 etc
  date?: string; // YYYY-MM-DD
  mode: TransportMode;
  carrier?: string; // e.g. "JR West", "Lufthansa", "Tokyo Metro"
  lineOrFlightNumber?: string; // e.g. "Haruka 19", "NH105", "Ginza Line"
  departureLocation: string; // Station, airport, stop name
  departureCoordinates?: { lat: number; lng: number };
  departureTime?: string; // HH:mm or ISO
  arrivalLocation: string;
  arrivalCoordinates?: { lat: number; lng: number };
  arrivalTime?: string; // HH:mm or ISO
  bookingId?: string; // Optional link to existing Booking
  bookingRef?: string;
  seatOrCabin?: string;
  platformOrGate?: string;
  orderIndex: number;
  notes?: string;
  cost?: number;
  currency?: string;
  isSample?: boolean;
  isEdited?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface TransitStop {
  id: string;
  name: string;
  lat?: number;
  lng?: number;
  code?: string;
}

export interface TransitRoute {
  id: string;
  shortName: string;
  longName: string;
  type: string; // rail, bus, subway, etc.
  color?: string;
  agencyName?: string;
}

export interface TransitScheduleEntry {
  tripId: string;
  routeId: string;
  headsign?: string;
  departureTime: string;
  arrivalTime: string;
  fromStopId: string;
  toStopId: string;
  fromStopName: string;
  toStopName: string;
}

export interface ParsedTimetableFeed {
  feedName: string;
  importedAt: string;
  routes: TransitRoute[];
  stops: TransitStop[];
  entries: TransitScheduleEntry[];
}

// ==========================================
// TRAVEL COMPANION: Reusable Recipes, Grocery & Meals
// ==========================================

export type RecipeCategory = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert' | 'beverage' | 'other';

export interface RecipeIngredient {
  id: string;
  name: string; // e.g. "Arborio Rice", "Parmesan Cheese"
  quantity: number; // e.g. 200
  unit: string; // 'g' | 'kg' | 'ml' | 'l' | 'pcs' | 'tbsp' | 'tsp' | 'cup' | 'clove' | 'can' etc.
  category?: string; // 'produce' | 'dairy' | 'meat' | 'bakery' | 'pantry' | 'spices' | 'other'
  notes?: string;
}

export interface Recipe {
  id: string;
  title: string;
  description?: string;
  servings: number;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  category: RecipeCategory;
  ingredients: RecipeIngredient[];
  instructions: string[]; // Step-by-step
  tags: string[]; // e.g. ['quick', 'budget', 'camp-friendly', 'pasta']
  imageUrl?: string;
  sourceUrl?: string;
  notes?: string;
  isSample?: boolean;
  isEdited?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BaseIngredientPrice {
  id: string; // Normalized ingredient name (e.g. "arborio-rice")
  name: string; // Display name
  unit: string; // 'kg', 'g', 'l', 'ml', 'pcs', etc.
  unitQuantity: number; // e.g. 1 (per 1 kg) or 500 (per 500g)
  price: number; // Unit price
  currency: string;
  country?: string; // e.g. "General", "Switzerland"
  isSample?: boolean;
  isEdited?: boolean;
  updatedAt: string;
}

export interface TripIngredientPriceOverride {
  id: string; // `${tripId}_${normalizedIngredientName}`
  tripId: string;
  ingredientName: string;
  unit: string;
  unitQuantity: number;
  price: number;
  currency: string;
  updatedAt: string;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface TripMealPlan {
  id: string;
  tripId: string;
  dayNumber: number; // e.g. Day 1, Day 2
  date: string; // YYYY-MM-DD
  mealType: MealType;
  recipeId?: string; // Link to reusable Recipe if home-cooking
  customMealName?: string; // Name if eating out or custom meal
  servings: number;
  estimatedCost?: number;
  currency?: string;
  notes?: string;
  cooked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TripGroceryItem {
  id: string;
  tripId: string;
  name: string; // Normalized name
  totalQuantity: number;
  unit: string;
  category: string;
  bought: boolean;
  estimatedCost: number;
  actualCost?: number;
  currency: string;
  recipeIds?: string[];
  notes?: string;
}

// ==========================================
// TRAVEL COMPANION: Record Exchange & Packs
// ==========================================

export type ConflictStrategy = 'skip' | 'overwrite' | 'copy';

export interface RecordPackPayload {
  format: 'travelnest-pack' | 'travelnest-recipe-pack';
  version: number;
  exportedAt: string;
  generator: string;
  manifest: {
    title: string;
    description?: string;
    tripsCount?: number;
    recipesCount?: number;
    placesCount?: number;
    transportLegsCount?: number;
    mealPlansCount?: number;
  };
  data: {
    trips?: Trip[];
    places?: Place[];
    collectionItems?: CollectionItem[];
    itineraryEvents?: ItineraryEvent[];
    bookings?: Booking[];
    expenses?: Expense[];
    essentials?: EssentialItem[];
    documents?: VaultDocument[];
    recipes?: Recipe[];
    baseIngredientPrices?: BaseIngredientPrice[];
    transportLegs?: TransportLeg[];
    tripMealPlans?: TripMealPlan[];
    tripGroceryItems?: TripGroceryItem[];
    tripIngredientOverrides?: TripIngredientPriceOverride[];
  };
}
