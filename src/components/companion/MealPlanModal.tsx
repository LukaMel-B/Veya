import React, { useState } from 'react';
import { db } from '../../db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import type { TripMealPlan, MealType, Recipe } from '../../types';
import { calculateRecipeCost } from '../../utils/recipeUtils';
import { X, Utensils, Coffee, Sun, Moon, Plus } from 'lucide-react';

interface MealPlanModalProps {
  tripId: string;
  dayNumber: number;
  date: string;
  initialPlan?: Partial<TripMealPlan> | null;
  onClose: () => void;
  onOpenRecipeLibrary?: () => void;
}

export const MealPlanModal: React.FC<MealPlanModalProps> = ({
  tripId,
  dayNumber,
  date,
  initialPlan,
  onClose,
  onOpenRecipeLibrary,
}) => {
  const [mealType, setMealType] = useState<MealType>(initialPlan?.mealType || 'dinner');
  const [recipeId, setRecipeId] = useState<string>(initialPlan?.recipeId || '');
  const [customMealName, setCustomMealName] = useState(initialPlan?.customMealName || '');
  const [servings, setServings] = useState(initialPlan?.servings || 2);
  const [notes, setNotes] = useState(initialPlan?.notes || '');

  const recipes = useLiveQuery(() => db.recipes.toArray(), []);
  const basePrices = useLiveQuery(() => db.baseIngredientPrices.toArray(), []);
  const tripOverrides = useLiveQuery(
    () => db.tripIngredientOverrides.where('tripId').equals(tripId).toArray(),
    [tripId]
  );

  const selectedRecipe = (recipes || []).find((r) => r.id === recipeId);

  // Compute live estimated cost
  let estimatedCost = 0;
  let currency = 'INR';

  if (selectedRecipe && basePrices) {
    const costCalc = calculateRecipeCost(selectedRecipe, basePrices, tripOverrides, servings);
    estimatedCost = costCalc.totalCost;
    currency = costCalc.currency;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipeId && !customMealName.trim()) return;

    const planData: TripMealPlan = {
      id: initialPlan?.id || `meal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      tripId,
      dayNumber,
      date,
      mealType,
      recipeId: recipeId || undefined,
      customMealName: customMealName.trim() || undefined,
      servings,
      estimatedCost: estimatedCost > 0 ? estimatedCost : undefined,
      currency,
      notes: notes.trim() || undefined,
      cooked: initialPlan?.cooked || false,
      createdAt: initialPlan?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.tripMealPlans.put(planData);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        className="travelnest-card animate-slide-up"
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <span className="label-micro">DAY {dayNumber} · MEAL PLANNING</span>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '2px 0 0 0' }}>
              {initialPlan?.id ? 'Edit Planned Meal' : 'Plan Daily Meal'}
            </h3>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ width: '32px', height: '32px' }} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Meal Type */}
          <div>
            <label className="label-micro" style={{ marginBottom: '6px', display: 'block' }}>
              MEAL SLOT
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              {(
                [
                  { type: 'breakfast', label: 'Breakfast', icon: <Coffee size={14} /> },
                  { type: 'lunch', label: 'Lunch', icon: <Sun size={14} /> },
                  { type: 'dinner', label: 'Dinner', icon: <Moon size={14} /> },
                  { type: 'snack', label: 'Snack', icon: <Utensils size={14} /> },
                ] as const
              ).map((m) => (
                <button
                  key={m.type}
                  type="button"
                  onClick={() => setMealType(m.type)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '8px 4px',
                    borderRadius: '12px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: mealType === m.type ? '1.5px solid #111111' : '1px solid var(--border-subtle)',
                    backgroundColor: mealType === m.type ? '#111111' : '#F7F7F7',
                    color: mealType === m.type ? '#FFFFFF' : '#333333',
                  }}
                >
                  {m.icon}
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Select from Reusable Recipe Library */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label className="label-micro">CHOOSE FROM RECIPE LIBRARY</label>
              {onOpenRecipeLibrary && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenRecipeLibrary();
                  }}
                  className="btn btn-ghost"
                  style={{ padding: 0, fontSize: '0.78rem', color: '#111111', fontWeight: 600 }}
                >
                  + Open Recipe Library
                </button>
              )}
            </div>
            <select
              value={recipeId}
              onChange={(e) => {
                setRecipeId(e.target.value);
                if (e.target.value) setCustomMealName('');
              }}
              className="input-field"
              style={{ width: '100%' }}
            >
              <option value="">None (Custom or Dining Out)</option>
              {(recipes || []).map((r) => (
                <option key={r.id} value={r.id}>
                  🍳 {r.title} ({r.servings} servings, ~{(r.prepTimeMinutes || 0) + (r.cookTimeMinutes || 0)}m)
                </option>
              ))}
            </select>
          </div>

          {/* Or Custom Meal Name */}
          <div>
            <label className="label-micro" style={{ marginBottom: '4px', display: 'block' }}>
              OR CUSTOM MEAL / RESTAURANT NAME
            </label>
            <input
              type="text"
              value={customMealName}
              onChange={(e) => {
                setCustomMealName(e.target.value);
                if (e.target.value) setRecipeId('');
              }}
              placeholder="e.g. Soba Noodles at Omoide Yokocho"
              className="input-field"
              style={{ width: '100%' }}
            />
          </div>

          {/* Servings */}
          <div>
            <label className="label-micro" style={{ marginBottom: '4px', display: 'block' }}>
              SERVINGS (NUMBER OF TRAVELERS)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setServings(Math.max(1, servings - 1))}
                className="btn btn-secondary"
                style={{ width: '38px', height: '38px', padding: 0, fontSize: '1.1rem' }}
              >
                -
              </button>
              <span style={{ fontWeight: 700, fontSize: '1rem', minWidth: '40px', textAlign: 'center' }}>
                {servings} {servings === 1 ? 'person' : 'people'}
              </span>
              <button
                type="button"
                onClick={() => setServings(servings + 1)}
                className="btn btn-secondary"
                style={{ width: '38px', height: '38px', padding: 0, fontSize: '1.1rem' }}
              >
                +
              </button>
            </div>
          </div>

          {/* Cost Estimate Preview */}
          {estimatedCost > 0 && (
            <div
              style={{
                padding: '10px 14px',
                backgroundColor: '#F5F5F7',
                borderRadius: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.85rem',
              }}
            >
              <span style={{ color: 'var(--secondary)' }}>Estimated Cooking Cost:</span>
              <span style={{ fontWeight: 700, color: '#111111' }}>
                {currency} {estimatedCost.toLocaleString()}
              </span>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="label-micro" style={{ marginBottom: '4px', display: 'block' }}>
              NOTES / INGREDIENT REMINDERS
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Buy fresh eggs in morning market. Bring skillet."
              className="input-field"
              style={{ width: '100%', resize: 'none' }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={!recipeId && !customMealName.trim()}
              className="btn btn-primary"
              style={{ flex: 1 }}
            >
              Save Meal Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
