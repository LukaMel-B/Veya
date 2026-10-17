import React, { useState } from 'react';
import { db } from '../../db/database';
import { useApp } from '../../context/AppContext';
import type { Recipe, RecipeCategory, RecipeIngredient } from '../../types';
import { X, Plus, Trash2, Clock, Users, Tag } from 'lucide-react';
import { ModalPortal } from '../common/ModalPortal';

interface EditRecipeModalProps {
  initialRecipe?: Partial<Recipe> | null;
  onClose: () => void;
  onSave?: (recipe: Recipe) => void;
}

const RECIPE_CATEGORIES: { category: RecipeCategory; label: string }[] = [
  { category: 'breakfast', label: 'Breakfast' },
  { category: 'lunch', label: 'Lunch' },
  { category: 'dinner', label: 'Dinner' },
  { category: 'snack', label: 'Snack' },
  { category: 'dessert', label: 'Dessert' },
  { category: 'beverage', label: 'Drink' },
  { category: 'other', label: 'Other' },
];

const COMMON_UNITS = ['g', 'kg', 'ml', 'l', 'pcs', 'tbsp', 'tsp', 'cup', 'clove', 'can'];

export const EditRecipeModal: React.FC<EditRecipeModalProps> = ({
  initialRecipe,
  onClose,
  onSave,
}) => {
  const { showConfirm, showToast } = useApp();
  const [title, setTitle] = useState(initialRecipe?.title || '');
  const [description, setDescription] = useState(initialRecipe?.description || '');
  const [category, setCategory] = useState<RecipeCategory>(initialRecipe?.category || 'dinner');
  const [servings, setServings] = useState(initialRecipe?.servings || 2);
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(initialRecipe?.prepTimeMinutes || 10);
  const [cookTimeMinutes, setCookTimeMinutes] = useState(initialRecipe?.cookTimeMinutes || 15);
  const [imageUrl, setImageUrl] = useState(initialRecipe?.imageUrl || '');
  const [tagsString, setTagsString] = useState((initialRecipe?.tags || ['quick']).join(', '));

  const isDirty = initialRecipe
    ? title !== (initialRecipe.title || '') ||
      description !== (initialRecipe.description || '') ||
      category !== (initialRecipe.category || 'dinner') ||
      servings !== (initialRecipe.servings || 2) ||
      prepTimeMinutes !== (initialRecipe.prepTimeMinutes || 10) ||
      cookTimeMinutes !== (initialRecipe.cookTimeMinutes || 15) ||
      imageUrl !== (initialRecipe.imageUrl || '') ||
      tagsString !== ((initialRecipe.tags || ['quick']).join(', '))
    : Boolean(title.trim() || description.trim() || imageUrl.trim());

  const handleRequestClose = async () => {
    if (isDirty) {
      const confirmed = await showConfirm({
        title: initialRecipe?.id ? 'Discard Recipe Edits?' : 'Discard New Recipe?',
        categoryKicker: 'GUARD SHEET',
        description: 'You have unsaved changes to this recipe. Are you sure you want to discard them?',
        warningMessage: 'Changes will not be saved to your cookbook.',
        confirmText: 'Discard Changes',
        cancelText: 'Keep Editing',
        variant: 'destructive',
        iconName: 'edit',
      });
      if (!confirmed) return;
    }
    onClose();
  };

  const handleDeleteRecipe = async () => {
    if (!initialRecipe?.id) return;
    const confirmed = await showConfirm({
      title: `Delete "${title || 'this recipe'}"?`,
      categoryKicker: 'REUSABLE RECIPE',
      description: `This will remove "${title || 'this recipe'}" from your reusable recipe cookbook. Existing trips and meal plans referencing it will remain safely in place.`,
      confirmText: 'Delete Recipe',
      cancelText: 'Keep Recipe',
      variant: 'destructive',
      iconName: 'trash',
    });
    if (confirmed) {
      try {
        await db.recipes.delete(initialRecipe.id);
        showToast('Recipe deleted.', 'info');
        onClose();
      } catch (err: any) {
        showToast('Failed to delete recipe: ' + err.message, 'error');
      }
    }
  };

  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(
    initialRecipe?.ingredients && initialRecipe.ingredients.length > 0
      ? initialRecipe.ingredients
      : [
          { id: 'ing-1', name: '', quantity: 1, unit: 'pcs', category: 'pantry' },
        ]
  );

  const [instructions, setInstructions] = useState<string[]>(
    initialRecipe?.instructions && initialRecipe.instructions.length > 0
      ? initialRecipe.instructions
      : ['']
  );

  const handleAddIngredient = () => {
    setIngredients([
      ...ingredients,
      {
        id: `ing-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        name: '',
        quantity: 1,
        unit: 'pcs',
        category: 'pantry',
      },
    ]);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index: number, field: keyof RecipeIngredient, value: any) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const handleAddInstruction = () => {
    setInstructions([...instructions, '']);
  };

  const handleRemoveInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index));
  };

  const handleInstructionChange = (index: number, value: string) => {
    const updated = [...instructions];
    updated[index] = value;
    setInstructions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const cleanIngredients = ingredients.filter((ing) => ing.name.trim().length > 0);
    const cleanInstructions = instructions.filter((inst) => inst.trim().length > 0);
    const tags = tagsString
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const recipeData: Recipe = {
      id: initialRecipe?.id || `recipe-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      servings: Number(servings) || 2,
      prepTimeMinutes: Number(prepTimeMinutes) || 10,
      cookTimeMinutes: Number(cookTimeMinutes) || 15,
      imageUrl: imageUrl.trim() || undefined,
      tags,
      ingredients: cleanIngredients,
      instructions: cleanInstructions,
      isEdited: true,
      createdAt: initialRecipe?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.recipes.put(recipeData);
    if (onSave) onSave(recipeData);
    onClose();
  };

  return (
    <ModalPortal isOpen={true}>
      <div
        className="modal-overlay"
        onClick={handleRequestClose}
      >
        <div
          className="modal-sheet"
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: '560px',
            backgroundColor: '#FFFFFF',
            padding: '20px',
          }}
        >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <span className="label-micro">REUSABLE RECIPE LIBRARY</span>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '2px 0 0 0' }}>
              {initialRecipe?.id ? 'Edit Recipe' : 'New Reusable Recipe'}
            </h3>
          </div>
          <button
            type="button"
            onClick={handleRequestClose}
            className="btn-icon"
            style={{ width: '32px', height: '32px' }}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Title */}
          <div>
            <label className="label-micro" style={{ marginBottom: '4px', display: 'block' }}>
              RECIPE TITLE *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Campfire Shakshuka, Pesto Pasta"
              className="input-field"
              style={{ width: '100%' }}
            />
          </div>

          {/* Description */}
          <div>
            <label className="label-micro" style={{ marginBottom: '4px', display: 'block' }}>
              BRIEF DESCRIPTION / FLAVOR PROFILE
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Quick 15-minute one-pan tomato and egg skillet"
              className="input-field"
              style={{ width: '100%' }}
            />
          </div>

          {/* Category & Servings */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label className="label-micro" style={{ marginBottom: '4px', display: 'block' }}>
                CATEGORY
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as RecipeCategory)}
                className="input-field"
                style={{ width: '100%' }}
              >
                {RECIPE_CATEGORIES.map((c) => (
                  <option key={c.category} value={c.category}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-micro" style={{ marginBottom: '4px', display: 'block' }}>
                BASE SERVINGS
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={servings}
                onChange={(e) => setServings(parseInt(e.target.value, 10) || 1)}
                className="input-field"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Times */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label className="label-micro" style={{ marginBottom: '4px', display: 'block' }}>
                PREP TIME (MINUTES)
              </label>
              <input
                type="number"
                min={0}
                value={prepTimeMinutes}
                onChange={(e) => setPrepTimeMinutes(parseInt(e.target.value, 10) || 0)}
                className="input-field"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label className="label-micro" style={{ marginBottom: '4px', display: 'block' }}>
                COOK TIME (MINUTES)
              </label>
              <input
                type="number"
                min={0}
                value={cookTimeMinutes}
                onChange={(e) => setCookTimeMinutes(parseInt(e.target.value, 10) || 0)}
                className="input-field"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Ingredients Section */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="label-micro">INGREDIENTS LIST</label>
              <button
                type="button"
                onClick={handleAddIngredient}
                className="btn btn-ghost"
                style={{ padding: '2px 6px', fontSize: '0.78rem', color: '#111111', fontWeight: 600 }}
              >
                + Add Ingredient
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {ingredients.map((ing, idx) => (
                <div key={ing.id || idx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Ingredient (e.g. Eggs, Garlic)"
                    value={ing.name}
                    onChange={(e) => handleIngredientChange(idx, 'name', e.target.value)}
                    className="input-field"
                    style={{ flex: 2 }}
                  />
                  <input
                    type="number"
                    step="any"
                    min={0.1}
                    placeholder="Qty"
                    value={ing.quantity}
                    onChange={(e) => handleIngredientChange(idx, 'quantity', parseFloat(e.target.value) || 1)}
                    className="input-field"
                    style={{ width: '65px' }}
                  />
                  <select
                    value={ing.unit}
                    onChange={(e) => handleIngredientChange(idx, 'unit', e.target.value)}
                    className="input-field"
                    style={{ width: '70px', padding: '6px 4px' }}
                  >
                    {COMMON_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                  {ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(idx)}
                      className="btn-icon"
                      style={{ width: '28px', height: '28px', color: '#dc2626' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Instructions Section */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="label-micro">PREPARATION STEPS</label>
              <button
                type="button"
                onClick={handleAddInstruction}
                className="btn btn-ghost"
                style={{ padding: '2px 6px', fontSize: '0.78rem', color: '#111111', fontWeight: 600 }}
              >
                + Add Step
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {instructions.map((inst, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <span
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      backgroundColor: '#111111',
                      color: '#FFFFFF',
                      fontSize: '11px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: '8px',
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <textarea
                    rows={2}
                    placeholder={`Step ${idx + 1} instructions...`}
                    value={inst}
                    onChange={(e) => handleInstructionChange(idx, e.target.value)}
                    className="input-field"
                    style={{ flex: 1, resize: 'none' }}
                  />
                  {instructions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveInstruction(idx)}
                      className="btn-icon"
                      style={{ width: '28px', height: '28px', color: '#dc2626', marginTop: '6px' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tags & Cover Image */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label className="label-micro" style={{ marginBottom: '4px', display: 'block' }}>
                TAGS (COMMA SEPARATED)
              </label>
              <input
                type="text"
                value={tagsString}
                onChange={(e) => setTagsString(e.target.value)}
                placeholder="quick, vegan, budget"
                className="input-field"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label className="label-micro" style={{ marginBottom: '4px', display: 'block' }}>
                COVER IMAGE URL (OPTIONAL)
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="input-field"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            {initialRecipe?.id && (
              <button
                type="button"
                onClick={handleDeleteRecipe}
                className="btn btn-secondary"
                style={{ color: '#dc2626', borderColor: '#fee2e2', padding: '0 14px' }}
                title="Delete Recipe"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button type="button" onClick={handleRequestClose} className="btn btn-secondary" style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              Save Recipe
            </button>
          </div>
        </form>
      </div>
    </div>
  </ModalPortal>
  );
};
