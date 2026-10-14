import React, { useState } from 'react';
import { db } from '../../db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import type { TripGroceryItem, Expense } from '../../types';
import { aggregateGroceryListFromMealPlans } from '../../utils/recipeUtils';
import { X, Check, ShoppingCart, DollarSign, Plus } from 'lucide-react';

interface GroceryTrackerModalProps {
  tripId: string;
  defaultCurrency?: string;
  onClose: () => void;
  onExpenseLogged?: () => void;
}

export const GroceryTrackerModal: React.FC<GroceryTrackerModalProps> = ({
  tripId,
  defaultCurrency = 'INR',
  onClose,
  onExpenseLogged,
}) => {
  const mealPlans = useLiveQuery(() => db.tripMealPlans.where('tripId').equals(tripId).toArray(), [tripId]);
  const recipes = useLiveQuery(() => db.recipes.toArray(), []);
  const basePrices = useLiveQuery(() => db.baseIngredientPrices.toArray(), []);
  const tripOverrides = useLiveQuery(
    () => db.tripIngredientOverrides.where('tripId').equals(tripId).toArray(),
    [tripId]
  );
  const savedGroceryItems = useLiveQuery(
    () => db.tripGroceryItems.where('tripId').equals(tripId).toArray(),
    [tripId]
  );

  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Compute aggregated list if not manually generated yet
  const computedList = React.useMemo(() => {
    if (savedGroceryItems && savedGroceryItems.length > 0) {
      return savedGroceryItems;
    }
    if (mealPlans && recipes && basePrices) {
      return aggregateGroceryListFromMealPlans(
        tripId,
        mealPlans,
        recipes,
        basePrices,
        tripOverrides,
        defaultCurrency
      );
    }
    return [];
  }, [savedGroceryItems, mealPlans, recipes, basePrices, tripOverrides, tripId, defaultCurrency]);

  const toggleBought = async (item: TripGroceryItem) => {
    const updated = { ...item, bought: !item.bought };
    await db.tripGroceryItems.put(updated);
  };

  const totalEstimated = computedList.reduce((acc, item) => acc + (item.estimatedCost || 0), 0);
  const totalBought = computedList
    .filter((item) => item.bought)
    .reduce((acc, item) => acc + (item.actualCost || item.estimatedCost || 0), 0);

  const categories = Array.from(new Set(computedList.map((i) => i.category || 'pantry')));
  const filteredItems = computedList.filter((item) => {
    if (filterCategory === 'all') return true;
    return item.category === filterCategory;
  });

  const handleLogAsExpense = async () => {
    if (totalBought <= 0) return;

    const boughtItemNames = computedList
      .filter((i) => i.bought)
      .map((i) => `${i.name} (${i.totalQuantity} ${i.unit})`)
      .slice(0, 5)
      .join(', ');

    const newExpense: Expense = {
      id: `exp-groc-${Date.now()}`,
      tripId,
      title: 'Camp / Vacation Groceries',
      amount: Math.round(totalBought),
      currency: defaultCurrency,
      category: 'groceries',
      paidBy: 'Me',
      date: new Date().toISOString().split('T')[0],
      splitMode: 'none',
      splitWith: [],
      notes: `Groceries tracking ledger: ${boughtItemNames}${computedList.filter((i) => i.bought).length > 5 ? '...' : ''}`,
      createdAt: new Date().toISOString(),
    };

    await db.expenses.add(newExpense);
    if (onExpenseLogged) onExpenseLogged();
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
          maxWidth: '560px',
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <span className="label-micro">MEAL PLANNER & COOKING</span>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '2px 0 0 0' }}>
              Trip Grocery Checklist
            </h3>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ width: '32px', height: '32px' }} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Cost Summary Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            backgroundColor: '#F5F5F7',
            padding: '12px 14px',
            borderRadius: '16px',
            marginBottom: '12px',
          }}
        >
          <div>
            <div style={{ fontSize: '10px', color: 'var(--secondary)', fontWeight: 600 }}>TOTAL ESTIMATE</div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#111111' }}>
              {defaultCurrency} {Math.round(totalEstimated).toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--secondary)', fontWeight: 600 }}>BOUGHT SO FAR</div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: totalBought > 0 ? '#15803d' : '#111111' }}>
              {defaultCurrency} {Math.round(totalBought).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Category Pills */}
        {categories.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '8px' }}>
            <button
              type="button"
              onClick={() => setFilterCategory('all')}
              style={{
                padding: '4px 10px',
                borderRadius: '9999px',
                fontSize: '0.78rem',
                fontWeight: 600,
                border: filterCategory === 'all' ? '1.5px solid #111111' : '1px solid var(--border-subtle)',
                backgroundColor: filterCategory === 'all' ? '#111111' : '#F5F5F7',
                color: filterCategory === 'all' ? '#FFFFFF' : '#333333',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              All ({computedList.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCategory(cat)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  border: filterCategory === cat ? '1.5px solid #111111' : '1px solid var(--border-subtle)',
                  backgroundColor: filterCategory === cat ? '#111111' : '#F5F5F7',
                  color: filterCategory === cat ? '#FFFFFF' : '#333333',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Grocery Items List */}
        <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
          {filteredItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--secondary)', fontSize: '0.86rem' }}>
              No groceries found. Plan a meal in your Daily Companion to automatically aggregate ingredients here.
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleBought(item)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: item.bought ? '#F8F9FA' : '#FFFFFF',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '6px',
                      border: item.bought ? 'none' : '1.5px solid #BBBBBB',
                      backgroundColor: item.bought ? '#111111' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                    }}
                  >
                    {item.bought && <Check size={14} strokeWidth={3} />}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        textDecoration: item.bought ? 'line-through' : 'none',
                        color: item.bought ? 'var(--secondary)' : '#111111',
                      }}
                    >
                      {item.name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--secondary)', textTransform: 'capitalize' }}>
                      {item.category || 'Pantry'}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: item.bought ? 'var(--secondary)' : '#111111' }}>
                    {item.totalQuantity} {item.unit}
                  </div>
                  {item.estimatedCost > 0 && (
                    <div style={{ fontSize: '0.76rem', color: 'var(--secondary)' }}>
                      ~{item.currency} {item.estimatedCost}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>
            Close
          </button>
          {totalBought > 0 && (
            <button
              type="button"
              onClick={handleLogAsExpense}
              className="btn btn-primary"
              style={{ flex: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <ShoppingCart size={16} />
              <span>Log Bought Items ({defaultCurrency} {Math.round(totalBought)})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
