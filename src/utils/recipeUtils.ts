import type {
  Recipe,
  RecipeIngredient,
  BaseIngredientPrice,
  TripIngredientPriceOverride,
  TripMealPlan,
  TripGroceryItem,
} from '../types';

/**
 * Normalizes an ingredient name for consistent pricing and grocery aggregation
 * (e.g. " Fresh Garlic Cloves " -> "garlic")
 */
export function normalizeIngredientName(raw: string): string {
  if (!raw) return '';
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/gi, '')
    .replace(/\s+/g, ' ');
}

/**
 * Normalizes units to a standard scale (e.g. g <-> kg, ml <-> l)
 */
export function convertUnitQuantity(qty: number, fromUnit: string, toUnit: string): number {
  const from = fromUnit.toLowerCase().trim();
  const to = toUnit.toLowerCase().trim();

  if (from === to) return qty;

  // Mass
  if (from === 'g' && to === 'kg') return qty / 1000;
  if (from === 'kg' && to === 'g') return qty * 1000;

  // Volume
  if (from === 'ml' && to === 'l') return qty / 1000;
  if (from === 'l' && to === 'ml') return qty * 1000;

  // Spoons / cups rough conversions
  if (from === 'tsp' && to === 'tbsp') return qty / 3;
  if (from === 'tbsp' && to === 'tsp') return qty * 3;
  if (from === 'tbsp' && to === 'cup') return qty / 16;
  if (from === 'cup' && to === 'tbsp') return qty * 16;
  if (from === 'tbsp' && to === 'ml') return qty * 15;
  if (from === 'tsp' && to === 'ml') return qty * 5;
  if (from === 'cup' && to === 'ml') return qty * 240;

  return qty; // Return unscaled if units are discrete (e.g. 'pcs', 'clove', 'can')
}

/**
 * Looks up unit price for an ingredient considering trip overrides first, then base prices
 */
export function getIngredientUnitPrice(
  ingredientName: string,
  basePrices: BaseIngredientPrice[],
  tripOverrides?: TripIngredientPriceOverride[]
): { price: number; unitQuantity: number; unit: string; currency: string } | null {
  const normalized = normalizeIngredientName(ingredientName);
  if (!normalized) return null;

  // 1. Check trip override first
  if (tripOverrides && tripOverrides.length > 0) {
    const override = tripOverrides.find(
      (o) =>
        normalizeIngredientName(o.ingredientName) === normalized ||
        o.id === normalized ||
        o.id.endsWith(`_${normalized}`)
    );
    if (override && override.price > 0) {
      return {
        price: override.price,
        unitQuantity: override.unitQuantity || 1,
        unit: override.unit || 'pcs',
        currency: override.currency || 'USD',
      };
    }
  }

  // 2. Check base price catalog
  const base = basePrices.find(
    (b) =>
      normalizeIngredientName(b.name) === normalized ||
      normalizeIngredientName(b.id) === normalized ||
      ((b as any).ingredientName && normalizeIngredientName((b as any).ingredientName) === normalized)
  );
  if (base && base.price > 0) {
    return {
      price: base.price,
      unitQuantity: base.unitQuantity || 1,
      unit: base.unit || 'pcs',
      currency: base.currency || 'USD',
    };
  }

  return null;
}

/**
 * Calculates estimated cost of a single recipe
 */
export function calculateRecipeCost(
  recipe: Recipe,
  basePrices: BaseIngredientPrice[],
  tripOverrides?: TripIngredientPriceOverride[],
  scaleServings?: number
): { totalCost: number; costPerServing: number; currency: string; coveredCount: number } {
  let totalCost = 0;
  let currency = 'INR';
  let coveredCount = 0;

  const targetServings = scaleServings && scaleServings > 0 ? scaleServings : recipe.servings || 1;
  const ratio = targetServings / (recipe.servings || 1);

  for (const ing of recipe.ingredients) {
    const unitPrice = getIngredientUnitPrice(ing.name, basePrices, tripOverrides);
    if (unitPrice) {
      currency = unitPrice.currency;
      coveredCount++;

      const scaledQty = ing.quantity * ratio;
      // Convert to price unit
      const convertedQty = convertUnitQuantity(scaledQty, ing.unit, unitPrice.unit);
      const ingredientCost = (convertedQty / unitPrice.unitQuantity) * unitPrice.price;
      totalCost += Math.max(0, ingredientCost);
    }
  }

  return {
    totalCost: Math.round(totalCost * 100) / 100,
    costPerServing: Math.round((totalCost / Math.max(1, targetServings)) * 100) / 100,
    currency,
    coveredCount,
  };
}

/**
 * Aggregates multiple planned meals into an organized grocery shopping list
 */
export function aggregateGroceryListFromMealPlans(
  tripId: string,
  mealPlans: TripMealPlan[],
  recipes: Recipe[],
  basePrices: BaseIngredientPrice[],
  tripOverrides?: TripIngredientPriceOverride[],
  defaultCurrency: string = 'INR'
): TripGroceryItem[] {
  const recipeMap = new Map<string, Recipe>(recipes.map((r) => [r.id, r]));
  const itemMap = new Map<
    string,
    {
      name: string;
      totalQuantity: number;
      unit: string;
      category: string;
      recipeIds: Set<string>;
    }
  >();

  for (const plan of mealPlans) {
    if (!plan.recipeId) continue;
    const recipe = recipeMap.get(plan.recipeId);
    if (!recipe) continue;

    const scale = (plan.servings || 1) / (recipe.servings || 1);

    for (const ing of recipe.ingredients) {
      const normName = normalizeIngredientName(ing.name);
      const unit = ing.unit.toLowerCase().trim();
      const key = `${normName}__${unit}`;

      const scaledQty = ing.quantity * scale;

      if (!itemMap.has(key)) {
        itemMap.set(key, {
          name: ing.name.trim(),
          totalQuantity: scaledQty,
          unit: ing.unit,
          category: ing.category || 'pantry',
          recipeIds: new Set([recipe.id]),
        });
      } else {
        const existing = itemMap.get(key)!;
        existing.totalQuantity += scaledQty;
        existing.recipeIds.add(recipe.id);
      }
    }
  }

  // Convert map to TripGroceryItem records with estimated costs
  const results: TripGroceryItem[] = [];

  for (const [key, item] of itemMap.entries()) {
    const unitPrice = getIngredientUnitPrice(item.name, basePrices, tripOverrides);
    let estimatedCost = 0;
    let currency = defaultCurrency;

    if (unitPrice) {
      currency = unitPrice.currency;
      const convertedQty = convertUnitQuantity(item.totalQuantity, item.unit, unitPrice.unit);
      estimatedCost = Math.round(((convertedQty / unitPrice.unitQuantity) * unitPrice.price) * 100) / 100;
    }

    results.push({
      id: `groc-${tripId}-${key.replace(/[^a-z0-9]/gi, '_')}`,
      tripId,
      name: item.name,
      totalQuantity: Math.round(item.totalQuantity * 10) / 10,
      unit: item.unit,
      category: item.category,
      bought: false,
      estimatedCost,
      currency,
      recipeIds: Array.from(item.recipeIds),
    });
  }

  // Sort by category then name
  return results.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
}

/**
 * Validates a recipe file JSON payload (supports single recipe or recipe packs)
 */
export function validateAndParseRecipeFile(jsonContent: string): {
  valid: boolean;
  recipes: Recipe[];
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonContent);

    // Case A: TravelNest Recipe Pack format
    if (parsed.format === 'travelnest-recipe-pack' && Array.isArray(parsed.data?.recipes)) {
      return {
        valid: true,
        recipes: parsed.data.recipes.map(normalizeRecipeRecord),
      };
    }

    // Case B: Array of recipes
    if (Array.isArray(parsed)) {
      const recipes = parsed.map(normalizeRecipeRecord);
      return { valid: true, recipes };
    }

    // Case C: Single recipe object (Schema.org or TravelNest)
    if (typeof parsed === 'object' && parsed !== null) {
      const hasTitle = Boolean(parsed.title || parsed.name);
      const hasIngredients = Array.isArray(parsed.ingredients) || Array.isArray(parsed.recipeIngredient);
      if (!hasTitle || !hasIngredients) {
        return {
          valid: false,
          recipes: [],
          error: 'Recipe requires at least a title/name and an ingredients list.',
        };
      }
      const normalized = normalizeRecipeRecord(parsed);
      return { valid: true, recipes: [normalized] };
    }

    return { valid: false, recipes: [], error: 'Unsupported recipe format.' };
  } catch (err: any) {
    return { valid: false, recipes: [], error: err?.message || 'Invalid JSON syntax.' };
  }
}

function normalizeRecipeRecord(raw: any): Recipe {
  const now = new Date().toISOString();

  // Handle Schema.org Recipe (recipeIngredient as string array)
  let ingredients: RecipeIngredient[] = [];
  if (Array.isArray(raw.ingredients)) {
    ingredients = raw.ingredients.map((ing: any, idx: number) => ({
      id: ing.id || `ing-${idx}`,
      name: String(ing.name || 'Ingredient').trim(),
      quantity: typeof ing.quantity === 'number' ? ing.quantity : parseFloat(ing.quantity) || 1,
      unit: String(ing.unit || 'pcs').trim(),
      category: ing.category || 'pantry',
      notes: ing.notes,
    }));
  } else if (Array.isArray(raw.recipeIngredient)) {
    // Parse strings like "200g Arborio rice" or "2 tbsp olive oil"
    ingredients = raw.recipeIngredient.map((str: string, idx: number) => {
      const match = str.match(/^([\d\.\/]+)\s*([a-zA-Z]+)?\s+(.+)$/);
      if (match) {
        return {
          id: `ing-${idx}`,
          quantity: parseFloat(match[1]) || 1,
          unit: match[2] || 'pcs',
          name: match[3].trim(),
          category: 'pantry',
        };
      }
      return {
        id: `ing-${idx}`,
        quantity: 1,
        unit: 'pcs',
        name: str.trim(),
        category: 'pantry',
      };
    });
  }

  // Instructions
  let instructions: string[] = [];
  if (Array.isArray(raw.instructions)) {
    instructions = raw.instructions.map((i: any) => (typeof i === 'string' ? i : i.text || String(i)));
  } else if (Array.isArray(raw.recipeInstructions)) {
    instructions = raw.recipeInstructions.map((i: any) => (typeof i === 'string' ? i : i.text || String(i)));
  } else if (typeof raw.instructions === 'string') {
    instructions = raw.instructions.split(/\r?\n/).filter((s: string) => s.trim().length > 0);
  }

  return {
    id: raw.id || `recipe-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: String(raw.title || raw.name || 'Untitled Recipe').trim(),
    description: raw.description,
    servings: typeof raw.servings === 'number' ? raw.servings : parseInt(raw.servings || raw.recipeYield || '2', 10) || 2,
    prepTimeMinutes: typeof raw.prepTimeMinutes === 'number' ? raw.prepTimeMinutes : 15,
    cookTimeMinutes: typeof raw.cookTimeMinutes === 'number' ? raw.cookTimeMinutes : 20,
    category: raw.category || 'dinner',
    ingredients,
    instructions,
    tags: Array.isArray(raw.tags) ? raw.tags : ['quick'],
    imageUrl: raw.imageUrl || raw.image,
    sourceUrl: raw.sourceUrl || raw.url,
    notes: raw.notes,
    isSample: Boolean(raw.isSample),
    isEdited: false,
    createdAt: raw.createdAt || now,
    updatedAt: now,
  };
}
