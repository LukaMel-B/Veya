import React, { useState } from 'react';
import { db } from '../../db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Recipe, RecipeCategory } from '../../types';
import { validateAndParseRecipeFile, calculateRecipeCost } from '../../utils/recipeUtils';
import { RecipeDetailModal } from './RecipeDetailModal';
import { EditRecipeModal } from './EditRecipeModal';
import { IngredientPriceModal } from './IngredientPriceModal';
import { GroceryTrackerModal } from './GroceryTrackerModal';
import {
  X,
  Plus,
  Search,
  Upload,
  Clock,
  Users,
  DollarSign,
  Utensils,
  BookOpen,
  Filter,
} from 'lucide-react';

interface RecipeLibraryModalProps {
  tripId?: string;
  defaultCurrency?: string;
  onClose: () => void;
  onSelectRecipeForTrip?: (recipe: Recipe, servings: number) => void;
}

const CATEGORIES: { id: RecipeCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Recipes' },
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'snack', label: 'Snacks' },
  { id: 'dessert', label: 'Dessert' },
  { id: 'beverage', label: 'Drinks' },
];

export const RecipeLibraryModal: React.FC<RecipeLibraryModalProps> = ({
  tripId,
  defaultCurrency = 'INR',
  onClose,
  onSelectRecipeForTrip,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<RecipeCategory | 'all'>('all');

  // Sub-modal states
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  const [isEditingRecipe, setIsEditingRecipe] = useState(false);
  const [editingRecipeData, setEditingRecipeData] = useState<Recipe | null>(null);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [isGroceryModalOpen, setIsGroceryModalOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const recipes = useLiveQuery(() => db.recipes.toArray(), []);
  const basePrices = useLiveQuery(() => db.baseIngredientPrices.toArray(), []);
  const tripOverrides = useLiveQuery(
    () => (tripId ? db.tripIngredientOverrides.where('tripId').equals(tripId).toArray() : []),
    [tripId]
  );

  const handleImportRecipeFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = validateAndParseRecipeFile(text);
      if (!result.valid || result.recipes.length === 0) {
        setImportStatus(result.error || 'Failed to validate recipe file.');
        return;
      }

      await db.recipes.bulkPut(result.recipes);
      setImportStatus(`Successfully imported ${result.recipes.length} recipe(s)!`);
      setTimeout(() => setImportStatus(null), 3000);
    } catch (err: any) {
      setImportStatus('Error importing recipe: ' + err?.message);
    }
  };

  const filteredRecipes = (recipes || []).filter((r) => {
    const matchesCategory = selectedCategory === 'all' || r.category === selectedCategory;
    const q = search.toLowerCase();
    const matchesSearch =
      r.title.toLowerCase().includes(q) ||
      (r.description && r.description.toLowerCase().includes(q)) ||
      r.tags.some((t) => t.toLowerCase().includes(q)) ||
      r.ingredients.some((ing) => ing.name.toLowerCase().includes(q));

    return matchesCategory && matchesSearch;
  });

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 9998,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
        }}
      >
        <div
          className="travelnest-card animate-slide-up"
          style={{
            width: '100%',
            maxWidth: '580px',
            maxHeight: '92vh',
            overflowY: 'auto',
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            padding: '20px',
            margin: 0,
            boxShadow: '0 -10px 40px rgba(0,0,0,0.2)',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <span className="label-micro">REUSABLE COOKBOOK & MEALS</span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '2px 0 0 0' }}>
                Recipe Library
              </h3>
            </div>
            <button onClick={onClose} className="btn-icon" style={{ width: '32px', height: '32px' }} aria-label="Close modal">
              <X size={18} />
            </button>
          </div>

          {/* Quick Actions Row */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '12px' }}>
            <button
              type="button"
              onClick={() => {
                setEditingRecipeData(null);
                setIsEditingRecipe(true);
              }}
              className="btn btn-primary"
              style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}
            >
              <Plus size={15} />
              <span>New Recipe</span>
            </button>

            <label
              className="btn btn-secondary"
              style={{
                padding: '6px 12px',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                margin: 0,
              }}
            >
              <Upload size={14} />
              <span>Import Recipe</span>
              <input type="file" accept=".json" onChange={handleImportRecipeFile} style={{ display: 'none' }} />
            </label>

            <button
              type="button"
              onClick={() => setIsPriceModalOpen(true)}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}
            >
              <DollarSign size={14} />
              <span>Price Catalog</span>
            </button>

            {tripId && (
              <button
                type="button"
                onClick={() => setIsGroceryModalOpen(true)}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}
              >
                <Utensils size={14} />
                <span>Trip Groceries</span>
              </button>
            )}
          </div>

          {importStatus && (
            <div
              style={{
                padding: '8px 12px',
                borderRadius: '10px',
                backgroundColor: importStatus.includes('Error') ? '#fee2e2' : '#dcfce7',
                color: importStatus.includes('Error') ? '#b91c1c' : '#15803d',
                fontSize: '0.82rem',
                marginBottom: '10px',
              }}
            >
              {importStatus}
            </div>
          )}

          {/* Search Bar */}
          <div style={{ position: 'relative', marginBottom: '10px' }}>
            <Search size={15} color="var(--secondary)" style={{ position: 'absolute', left: '12px', top: '11px' }} />
            <input
              type="text"
              placeholder="Search recipes by title, ingredient, tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field"
              style={{ width: '100%', paddingLeft: '34px' }}
            />
          </div>

          {/* Category Chips */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '14px' }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  border: selectedCategory === cat.id ? '1.5px solid #111111' : '1px solid var(--border-subtle)',
                  backgroundColor: selectedCategory === cat.id ? '#111111' : '#F5F5F7',
                  color: selectedCategory === cat.id ? '#FFFFFF' : '#333333',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Recipe Cards Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
            {filteredRecipes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--secondary)' }}>
                <BookOpen size={36} strokeWidth={1.5} style={{ margin: '0 auto 8px auto', opacity: 0.6 }} />
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>No recipes found</div>
                <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                  Create your first recipe or import a recipe file to start meal planning.
                </div>
              </div>
            ) : (
              filteredRecipes.map((r) => {
                const cost = basePrices
                  ? calculateRecipeCost(r, basePrices, tripOverrides)
                  : { totalCost: 0, costPerServing: 0, currency: defaultCurrency };

                return (
                  <div
                    key={r.id}
                    onClick={() => setViewingRecipe(r)}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '10px',
                      borderRadius: '16px',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: '#FFFFFF',
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    }}
                  >
                    {r.imageUrl ? (
                      <div
                        style={{
                          width: '84px',
                          height: '84px',
                          borderRadius: '12px',
                          backgroundImage: `url(${r.imageUrl})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '84px',
                          height: '84px',
                          borderRadius: '12px',
                          backgroundColor: '#F5F5F7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          fontSize: '1.8rem',
                        }}
                      >
                        🍳
                      </div>
                    )}

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              color: 'var(--secondary)',
                            }}
                          >
                            {r.category}
                          </span>
                          {cost.totalCost > 0 && (
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#111111' }}>
                              {cost.currency} {cost.totalCost}
                            </span>
                          )}
                        </div>
                        <h4 style={{ margin: '2px 0 4px 0', fontSize: '0.98rem', fontWeight: 700 }}>{r.title}</h4>
                        {r.description && (
                          <p
                            style={{
                              margin: 0,
                              fontSize: '0.78rem',
                              color: 'var(--secondary)',
                              lineHeight: 1.3,
                              overflow: 'hidden',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            {r.description}
                          </p>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.74rem', color: 'var(--secondary)', marginTop: '4px' }}>
                        <span>⏱️ {(r.prepTimeMinutes || 0) + (r.cookTimeMinutes || 0)}m</span>
                        <span>👥 {r.servings} servings</span>
                        <span>🥗 {r.ingredients.length} items</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Viewing Detail Modal */}
      {viewingRecipe && (
        <RecipeDetailModal
          recipe={viewingRecipe}
          tripId={tripId}
          onClose={() => setViewingRecipe(null)}
          onEdit={() => {
            setEditingRecipeData(viewingRecipe);
            setIsEditingRecipe(true);
          }}
          onAddToMealPlan={onSelectRecipeForTrip}
        />
      )}

      {/* Edit / Create Recipe Modal */}
      {isEditingRecipe && (
        <EditRecipeModal
          initialRecipe={editingRecipeData}
          onClose={() => {
            setIsEditingRecipe(false);
            setEditingRecipeData(null);
          }}
          onSave={(saved) => {
            if (viewingRecipe && viewingRecipe.id === saved.id) {
              setViewingRecipe(saved);
            }
          }}
        />
      )}

      {/* Ingredient Price Catalog Modal */}
      {isPriceModalOpen && (
        <IngredientPriceModal
          tripId={tripId}
          defaultCurrency={defaultCurrency}
          onClose={() => setIsPriceModalOpen(false)}
        />
      )}

      {/* Trip Grocery Tracker Modal */}
      {isGroceryModalOpen && tripId && (
        <GroceryTrackerModal
          tripId={tripId}
          defaultCurrency={defaultCurrency}
          onClose={() => setIsGroceryModalOpen(false)}
        />
      )}
    </>
  );
};
