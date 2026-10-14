import React, { useState } from 'react';
import { db } from '../../db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Recipe } from '../../types';
import { calculateRecipeCost } from '../../utils/recipeUtils';
import { X, Clock, Users, Pencil, Download, Plus, Check } from 'lucide-react';

interface RecipeDetailModalProps {
  recipe: Recipe;
  tripId?: string;
  onClose: () => void;
  onEdit: () => void;
  onAddToMealPlan?: (recipe: Recipe, servings: number) => void;
}

export const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({
  recipe,
  tripId,
  onClose,
  onEdit,
  onAddToMealPlan,
}) => {
  const [servings, setServings] = useState(recipe.servings || 2);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());

  const basePrices = useLiveQuery(() => db.baseIngredientPrices.toArray(), []);
  const tripOverrides = useLiveQuery(
    () => (tripId ? db.tripIngredientOverrides.where('tripId').equals(tripId).toArray() : []),
    [tripId]
  );

  const costCalc = basePrices
    ? calculateRecipeCost(recipe, basePrices, tripOverrides, servings)
    : { totalCost: 0, costPerServing: 0, currency: 'INR', coveredCount: 0 };

  const scaleRatio = servings / (recipe.servings || 1);

  const toggleCheck = (id: string) => {
    const next = new Set(checkedIngredients);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCheckedIngredients(next);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(recipe, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${recipe.title.toLowerCase().replace(/\s+/g, '-')}.recipe.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
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
          maxWidth: '560px',
          maxHeight: '92vh',
          overflowY: 'auto',
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          padding: 0,
          margin: 0,
          boxShadow: '0 -10px 40px rgba(0,0,0,0.2)',
          overflow: 'hidden',
        }}
      >
        {/* Header Cover / Title */}
        <div style={{ position: 'relative' }}>
          {recipe.imageUrl ? (
            <div
              style={{
                height: '180px',
                backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.7)), url(${recipe.imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                color: '#FFFFFF',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    color: '#FFFFFF',
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                >
                  {recipe.category}
                </span>
                <button
                  onClick={onClose}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    color: '#FFFFFF',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <X size={18} />
                </button>
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
                {recipe.title}
              </h2>
            </div>
          ) : (
            <div style={{ padding: '20px 20px 10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="label-micro">{recipe.category.toUpperCase()} RECIPE</span>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '2px 0 0 0' }}>{recipe.title}</h2>
              </div>
              <button onClick={onClose} className="btn-icon" style={{ width: '32px', height: '32px' }}>
                <X size={18} />
              </button>
            </div>
          )}
        </div>

        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {recipe.description && (
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--secondary)', lineHeight: 1.5 }}>
              {recipe.description}
            </p>
          )}

          {/* Quick Stats Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              backgroundColor: '#F5F5F7',
              padding: '12px',
              borderRadius: '16px',
              textAlign: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '10px', color: 'var(--secondary)', fontWeight: 600 }}>PREP TIME</div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{recipe.prepTimeMinutes}m</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--secondary)', fontWeight: 600 }}>COOK TIME</div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{recipe.cookTimeMinutes}m</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--secondary)', fontWeight: 600 }}>EST. COST</div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                {costCalc.totalCost > 0 ? `${costCalc.currency} ${costCalc.totalCost.toLocaleString()}` : 'Free / Pantry'}
              </div>
            </div>
          </div>

          {/* Servings Scaler */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              border: '1px solid var(--border-subtle)',
              borderRadius: '14px',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Scale Servings</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--secondary)' }}>
                {costCalc.costPerServing > 0 ? `~${costCalc.currency} ${costCalc.costPerServing}/serving` : 'Adjust ingredient amounts'}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setServings(Math.max(1, servings - 1))}
                className="btn btn-secondary"
                style={{ width: '32px', height: '32px', padding: 0 }}
              >
                -
              </button>
              <span style={{ fontWeight: 700, fontSize: '1rem', minWidth: '32px', textAlign: 'center' }}>
                {servings}
              </span>
              <button
                type="button"
                onClick={() => setServings(servings + 1)}
                className="btn btn-secondary"
                style={{ width: '32px', height: '32px', padding: 0 }}
              >
                +
              </button>
            </div>
          </div>

          {/* Ingredients Checklist */}
          <div>
            <div className="label-micro" style={{ marginBottom: '8px' }}>
              INGREDIENTS ({recipe.ingredients.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {recipe.ingredients.map((ing) => {
                const isChecked = checkedIngredients.has(ing.id);
                const scaledQty = Math.round(ing.quantity * scaleRatio * 10) / 10;

                return (
                  <div
                    key={ing.id}
                    onClick={() => toggleCheck(ing.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '10px',
                      backgroundColor: isChecked ? '#F5F5F7' : '#FFFFFF',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '5px',
                          border: isChecked ? 'none' : '1.5px solid #BBBBBB',
                          backgroundColor: isChecked ? '#111111' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFFFFF',
                        }}
                      >
                        {isChecked && <Check size={12} strokeWidth={3} />}
                      </div>
                      <span
                        style={{
                          fontSize: '0.88rem',
                          fontWeight: 500,
                          textDecoration: isChecked ? 'line-through' : 'none',
                          color: isChecked ? 'var(--secondary)' : '#111111',
                        }}
                      >
                        {ing.name}
                      </span>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: isChecked ? 'var(--secondary)' : '#111111' }}>
                      {scaledQty} {ing.unit}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Instructions */}
          <div>
            <div className="label-micro" style={{ marginBottom: '8px' }}>
              PREPARATION STEPS ({recipe.instructions.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recipe.instructions.map((step, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: '#111111',
                      color: '#FFFFFF',
                      fontSize: '11px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.5, color: '#333333' }}>
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Actions */}
          <div style={{ display: 'flex', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              onClick={handleExportJson}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem' }}
              title="Export Recipe JSON"
            >
              <Download size={15} />
              <span>Export</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit();
              }}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem' }}
            >
              <Pencil size={15} />
              <span>Edit</span>
            </button>
            {onAddToMealPlan && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onAddToMealPlan(recipe, servings);
                }}
                className="btn btn-primary"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Plus size={16} />
                <span>Add to Meal Plan</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
