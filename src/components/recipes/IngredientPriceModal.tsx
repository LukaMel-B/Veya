import React, { useState } from 'react';
import { db } from '../../db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import type { BaseIngredientPrice, TripIngredientPriceOverride } from '../../types';
import { normalizeIngredientName } from '../../utils/recipeUtils';
import { X, Plus, Trash2, Search, DollarSign } from 'lucide-react';

interface IngredientPriceModalProps {
  tripId?: string;
  defaultCurrency?: string;
  onClose: () => void;
}

export const IngredientPriceModal: React.FC<IngredientPriceModalProps> = ({
  tripId,
  defaultCurrency = 'INR',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'base' | 'trip'>(tripId ? 'trip' : 'base');
  const [search, setSearch] = useState('');

  // New price form state
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('g');
  const [unitQuantity, setUnitQuantity] = useState(100);
  const [price, setPrice] = useState(50);
  const [currency, setCurrency] = useState(defaultCurrency);

  const basePrices = useLiveQuery(() => db.baseIngredientPrices.toArray(), []);
  const tripOverrides = useLiveQuery(
    () => (tripId ? db.tripIngredientOverrides.where('tripId').equals(tripId).toArray() : []),
    [tripId]
  );

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const normName = normalizeIngredientName(name);

    if (activeTab === 'trip' && tripId) {
      const override: TripIngredientPriceOverride = {
        id: `${tripId}_${normName}`,
        tripId,
        ingredientName: name.trim(),
        unit,
        unitQuantity: Number(unitQuantity) || 1,
        price: Number(price) || 0,
        currency,
        updatedAt: new Date().toISOString(),
      };
      await db.tripIngredientOverrides.put(override);
    } else {
      const base: BaseIngredientPrice = {
        id: normName,
        name: name.trim(),
        unit,
        unitQuantity: Number(unitQuantity) || 1,
        price: Number(price) || 0,
        currency,
        updatedAt: new Date().toISOString(),
      };
      await db.baseIngredientPrices.put(base);
    }

    setName('');
  };

  const handleDeleteBasePrice = async (id: string) => {
    await db.baseIngredientPrices.delete(id);
  };

  const handleDeleteOverride = async (id: string) => {
    await db.tripIngredientOverrides.delete(id);
  };

  const filteredBase = (basePrices || []).filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredOverrides = (tripOverrides || []).filter((o) =>
    o.ingredientName.toLowerCase().includes(search.toLowerCase())
  );

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
          maxWidth: '540px',
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
            <span className="label-micro">GROCERY & INGREDIENT PRICING</span>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '2px 0 0 0' }}>
              Ingredient Price Catalog
            </h3>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ width: '32px', height: '32px' }} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher if in a Trip */}
        {tripId && (
          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('trip')}
              className="btn"
              style={{
                flex: 1,
                fontSize: '0.82rem',
                padding: '8px',
                backgroundColor: activeTab === 'trip' ? '#111111' : '#F5F5F7',
                color: activeTab === 'trip' ? '#FFFFFF' : '#333333',
                border: 'none',
              }}
            >
              Trip Price Overrides ({tripOverrides?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('base')}
              className="btn"
              style={{
                flex: 1,
                fontSize: '0.82rem',
                padding: '8px',
                backgroundColor: activeTab === 'base' ? '#111111' : '#F5F5F7',
                color: activeTab === 'base' ? '#FFFFFF' : '#333333',
                border: 'none',
              }}
            >
              Reusable Global Catalog ({basePrices?.length || 0})
            </button>
          </div>
        )}

        {/* Add Price Form */}
        <form
          onSubmit={handleSavePrice}
          style={{
            backgroundColor: '#F9F9FA',
            padding: '12px',
            borderRadius: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginBottom: '14px',
          }}
        >
          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
            {activeTab === 'trip' ? '+ Add Local Trip Price Override' : '+ Add Global Ingredient Price'}
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              required
              placeholder="Ingredient name (e.g. Rice)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              style={{ flex: 2 }}
            />
            <input
              type="number"
              min={1}
              placeholder="Unit Qty"
              value={unitQuantity}
              onChange={(e) => setUnitQuantity(parseFloat(e.target.value) || 1)}
              className="input-field"
              style={{ width: '65px' }}
            />
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="input-field"
              style={{ width: '65px' }}
            >
              <option value="g">g</option>
              <option value="kg">kg</option>
              <option value="ml">ml</option>
              <option value="l">l</option>
              <option value="pcs">pcs</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              type="number"
              min={0}
              step="any"
              placeholder="Price"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              className="input-field"
              style={{ flex: 1 }}
            />
            <input
              type="text"
              placeholder="Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              className="input-field"
              style={{ width: '70px' }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0 16px', fontSize: '0.82rem' }}>
              Save Price
            </button>
          </div>
        </form>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '10px' }}>
          <Search size={15} color="var(--secondary)" style={{ position: 'absolute', left: '12px', top: '11px' }} />
          <input
            type="text"
            placeholder="Search ingredient prices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ width: '100%', paddingLeft: '34px' }}
          />
        </div>

        {/* List */}
        <div style={{ maxHeight: '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {activeTab === 'trip' ? (
            filteredOverrides.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--secondary)', fontSize: '0.82rem' }}>
                No local trip price overrides yet. Ingredients will use global base prices.
              </div>
            ) : (
              filteredOverrides.map((ovr) => (
                <div
                  key={ovr.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    backgroundColor: '#F5F5F7',
                    fontSize: '0.86rem',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{ovr.ingredientName}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, color: '#111111' }}>
                      {ovr.currency} {ovr.price} / {ovr.unitQuantity} {ovr.unit}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteOverride(ovr.id)}
                      className="btn-icon"
                      style={{ width: '24px', height: '24px', color: '#dc2626' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )
          ) : (
            filteredBase.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--secondary)', fontSize: '0.82rem' }}>
                No base ingredient prices recorded.
              </div>
            ) : (
              filteredBase.map((base) => (
                <div
                  key={base.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    backgroundColor: '#F5F5F7',
                    fontSize: '0.86rem',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{base.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, color: '#111111' }}>
                      {base.currency} {base.price} / {base.unitQuantity} {base.unit}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteBasePrice(base.id)}
                      className="btn-icon"
                      style={{ width: '24px', height: '24px', color: '#dc2626' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
};
