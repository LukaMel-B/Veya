import React, { useState } from 'react';
import { db } from '../../db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Trip, Expense, ExpenseType, DebtDirection } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatDateDDmmmYY } from '../../utils/dateUtils';
import {
  Plus,
  Trash2,
  Check,
  CreditCard,
  Users,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  SlidersHorizontal,
  AlertTriangle,
} from 'lucide-react';
import { FloatingActionButton } from '../common/FloatingActionButton';

interface BudgetViewProps {
  trip: Trip;
}

interface ExpenseCategoryMeta {
  id: string;
  label: string;
  icon: string;
}

const DEFAULT_EXPENSE_CATEGORIES: ExpenseCategoryMeta[] = [
  { id: 'flights', label: 'Flights', icon: '✈️' },
  { id: 'lodging', label: 'Lodging / Stays', icon: '🏨' },
  { id: 'food', label: 'Food & Dining', icon: '🍽️' },
  { id: 'transport', label: 'Transport & Transit', icon: '🚆' },
  { id: 'activities', label: 'Activities & Tours', icon: '🎟️' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️' },
  { id: 'insurance', label: 'Insurance & Visa', icon: '📄' },
  { id: 'other', label: 'Other', icon: '✨' },
];

export const BudgetView: React.FC<BudgetViewProps> = ({ trip }) => {
  const { showToast, showConfirm } = useApp();
  const [activeTab, setActiveTab] = useState<'expenses' | 'debts'>('expenses');
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isBudgetSplitModalOpen, setIsBudgetSplitModalOpen] = useState(false);

  // Form states for new entry
  const [entryType, setEntryType] = useState<ExpenseType>('purchase');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>('food');
  const [paidBy, setPaidBy] = useState(trip.travelers[0] || 'Me');
  const [linkedBookingId, setLinkedBookingId] = useState<string>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Category creation in Add Expense
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🏷️');

  // Category Budgets Draft
  const [categoryBudgetsDraft, setCategoryBudgetsDraft] = useState<Record<string, number>>(
    trip.categoryBudgets || {}
  );

  // Personal Debt fields
  const defaultDebtTraveler =
    trip.travelers.find((t) => t.toLowerCase() !== 'me' && !t.toLowerCase().includes('(me)')) ||
    trip.travelers[0] ||
    'Traveler';
  const [debtTraveler, setDebtTraveler] = useState(defaultDebtTraveler);
  const [debtDirection, setDebtDirection] = useState<DebtDirection>('i_owe');

  const expenses = useLiveQuery(
    () => db.expenses.where('tripId').equals(trip.id).reverse().sortBy('date'),
    [trip.id]
  );

  const bookings = useLiveQuery(
    () => db.bookings.where('tripId').equals(trip.id).toArray(),
    [trip.id]
  );

  const customExpenseCategories = useLiveQuery(
    () => db.categories.where('scope').equals('expense').toArray(),
    []
  );

  // Merge default and custom expense categories
  const allExpenseCategories: ExpenseCategoryMeta[] = [
    ...DEFAULT_EXPENSE_CATEGORIES,
    ...(customExpenseCategories || [])
      .filter((c) => !DEFAULT_EXPENSE_CATEGORIES.some((d) => d.id === c.id || d.label.toLowerCase() === c.label.toLowerCase()))
      .map((c) => ({ id: c.id, label: c.label, icon: c.icon })),
  ];

  const getCategoryMeta = (catId?: string) => {
    if (!catId) return { id: 'other', label: 'Other', icon: '✨' };
    const clean = catId.trim().toLowerCase();
    const found = allExpenseCategories.find((c) => c.id.toLowerCase() === clean || c.label.toLowerCase() === clean);
    if (found) return found;
    return { id: catId, label: catId.charAt(0).toUpperCase() + catId.slice(1), icon: '🏷️' };
  };

  // Filter purchases vs personal debts
  const purchasesList = (expenses || []).filter((e) => e.expenseType !== 'debt');
  const debtsList = (expenses || []).filter((e) => e.expenseType === 'debt');

  // Personal Debts Totals (unsettled)
  const totalIOwe = debtsList
    .filter((d) => !d.debtSettled && (d.debtDirection === 'i_owe' || !d.debtDirection))
    .reduce((sum, d) => sum + (d.amount || 0), 0);

  const totalOwedToMe = debtsList
    .filter((d) => !d.debtSettled && d.debtDirection === 'they_owe')
    .reduce((sum, d) => sum + (d.amount || 0), 0);

  // Double-counting rule: Total Cost = Independent Purchases + Bookings
  const bookingsTotal = (bookings || []).reduce((acc, b) => acc + (b.cost || 0), 0);
  const independentPurchases = purchasesList.filter((e) => !e.bookingId);
  const linkedPurchases = purchasesList.filter((e) => !!e.bookingId);

  const independentPurchasesTotal = independentPurchases.reduce((acc, e) => acc + (e.amount || 0), 0);

  const totalCost = independentPurchasesTotal + bookingsTotal;
  const plannedBudget = trip.plannedBudget || 0;
  const remainingBudget = plannedBudget - totalCost;
  const isOverBudget = totalCost > plannedBudget;
  const exceededAmount = isOverBudget ? totalCost - plannedBudget : 0;
  const budgetPercent = plannedBudget > 0 ? Math.min(100, Math.round((totalCost / plannedBudget) * 100)) : 0;

  // Category Budgets Draft allocation validation
  const draftTotalAllocated = Object.values(categoryBudgetsDraft).reduce((sum, n) => sum + (n || 0), 0);
  const isAllocationOverBudget = plannedBudget > 0 && draftTotalAllocated > plannedBudget;
  const allocationExceededAmount = isAllocationOverBudget ? draftTotalAllocated - plannedBudget : 0;

  // Category Spending breakdown for tracking against categoryBudgets
  const categorySpending: Record<string, number> = {};
  for (const exp of purchasesList) {
    const key = exp.category.trim().toLowerCase();
    categorySpending[key] = (categorySpending[key] || 0) + exp.amount;
  }
  // Add bookings into categories (e.g. flights, lodging)
  for (const bk of bookings || []) {
    const key = bk.type === 'flight' ? 'flights' : bk.type === 'hotel' ? 'lodging' : 'activities';
    categorySpending[key] = (categorySpending[key] || 0) + (bk.cost || 0);
  }

  // Check which categories have exceeded their limit
  const activeCategoryBudgets = trip.categoryBudgets || {};
  const exceededCategories = Object.keys(activeCategoryBudgets).filter((catKey) => {
    const limit = activeCategoryBudgets[catKey] || 0;
    const spent = categorySpending[catKey.toLowerCase()] || 0;
    return limit > 0 && spent > limit;
  });

  const handleOpenAddModal = (type: ExpenseType = 'purchase') => {
    setEntryType(type);
    setTitle('');
    setAmount('');
    setNotes('');
    setLinkedBookingId('');
    setDate(new Date().toISOString().split('T')[0]);
    setIsCreatingCategory(false);
    setIsAddExpenseModalOpen(true);
  };

  const handleSaveNewExpenseCategory = async () => {
    const trimmed = newCatLabel.trim();
    if (!trimmed) {
      showToast('Please enter category name', 'error');
      return;
    }
    try {
      const saved = await db.saveCategory(trimmed, newCatIcon || '🏷️', 'expense');
      setCategory(saved.id);
      setIsCreatingCategory(false);
      setNewCatLabel('');
      showToast(`Category "${saved.label}" added!`, 'success');
    } catch (err: any) {
      showToast('Error saving category: ' + err.message, 'error');
    }
  };

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!title.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      showToast('Please enter a description and valid amount.', 'error');
      return;
    }

    try {
      const isDebt = entryType === 'debt';
      const newExp: Expense = {
        id: 'exp-' + Date.now(),
        tripId: trip.id,
        bookingId: !isDebt && linkedBookingId ? linkedBookingId : undefined,
        title: title.trim(),
        amount: parsedAmount,
        currency: 'INR',
        category: isDebt ? 'other' : category,
        paidBy: isDebt ? (debtDirection === 'i_owe' ? debtTraveler : 'Me') : paidBy,
        date,
        splitMode: 'none',
        splitWith: isDebt ? [debtTraveler] : [paidBy],
        expenseType: entryType,
        debtTraveler: isDebt ? debtTraveler : undefined,
        debtDirection: isDebt ? debtDirection : undefined,
        debtSettled: isDebt ? false : undefined,
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      await db.expenses.add(newExp);
      showToast(isDebt ? `Personal debt recorded with ${debtTraveler}` : `Expense "${newExp.title}" added!`, 'success');
      setIsAddExpenseModalOpen(false);
    } catch (err: any) {
      showToast('Error saving: ' + err.message, 'error');
    }
  };

  const handleToggleDebtSettled = async (debt: Expense) => {
    try {
      const updatedStatus = !debt.debtSettled;
      await db.expenses.update(debt.id, { debtSettled: updatedStatus });
      showToast(updatedStatus ? 'Marked as settled!' : 'Marked as pending', 'info');
    } catch (err: any) {
      showToast('Error updating status: ' + err.message, 'error');
    }
  };

  const handleDeleteExpense = async (id: string, itemTitle?: string) => {
    const confirmed = await showConfirm({
      title: itemTitle ? `Delete "${itemTitle}"?` : 'Delete this entry?',
      kicker: 'IRREVERSIBLE',
      message: 'This expense entry will be removed and deducted from your financial summary.',
      confirmText: 'Delete Entry',
      cancelText: 'Keep Entry',
      variant: 'destructive',
      icon: 'trash',
    });

    if (confirmed) {
      try {
        await db.expenses.delete(id);
        showToast('Entry removed.', 'info');
      } catch (err: any) {
        showToast('Error deleting expense: ' + err.message, 'error');
      }
    }
  };

  const handleSaveCategoryBudgets = async () => {
    if (isAllocationOverBudget) {
      showToast(
        `Total category allocations (₹${draftTotalAllocated.toLocaleString()}) exceed trip budget (₹${plannedBudget.toLocaleString()}) by ₹${allocationExceededAmount.toLocaleString()}. Please reduce allocations to save.`,
        'error'
      );
      return;
    }
    try {
      await db.trips.update(trip.id, {
        categoryBudgets: categoryBudgetsDraft,
        updatedAt: new Date().toISOString(),
      });
      showToast('Category budget limits saved!', 'success');
      setIsBudgetSplitModalOpen(false);
    } catch (err: any) {
      showToast('Failed to save category budgets: ' + err.message, 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Title Header */}
      <div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--primary)', margin: 0 }}>
          Budget & Ledger
        </h3>
      </div>

      {/* Financial Health Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
        <div className="travelnest-card" style={{ padding: '14px 16px', margin: 0, backgroundColor: '#ffffff' }}>
          <span className="label-micro" style={{ marginBottom: '4px' }}>
            Total Spent
          </span>
          <div
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: isOverBudget ? 'var(--error)' : 'var(--primary)',
            }}
          >
            ₹{totalCost.toLocaleString()}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--secondary)', marginTop: '2px', display: 'block' }}>
            Planned: ₹{plannedBudget.toLocaleString()}
          </span>
        </div>

        <div className="travelnest-card" style={{ padding: '14px 16px', margin: 0, backgroundColor: '#ffffff' }}>
          <span className="label-micro" style={{ marginBottom: '4px' }}>
            {isOverBudget ? 'Budget Exceeded' : 'Remaining Buffer'}
          </span>
          <div
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: isOverBudget ? 'var(--error)' : 'var(--primary)',
            }}
          >
            ₹{isOverBudget ? exceededAmount.toLocaleString() : remainingBudget.toLocaleString()}
          </div>
          <span style={{ fontSize: '0.72rem', color: isOverBudget ? 'var(--error)' : 'var(--secondary)', marginTop: '2px', display: 'block', fontWeight: isOverBudget ? 600 : 400 }}>
            {isOverBudget ? 'Over Planned Budget' : 'Within Allocation'}
          </span>
        </div>
      </div>

      {/* Progress Bar Card with Category Limit Exceeded Alerts */}
      <div className="travelnest-card" style={{ padding: '16px', margin: 0, backgroundColor: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span className="label-micro" style={{ margin: 0 }}>Allocation Utilised</span>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)' }}>
            {budgetPercent}%
          </span>
        </div>
        <div className="minimal-progress-track">
          <div
            className="minimal-progress-bar"
            style={{
              width: `${budgetPercent}%`,
              backgroundColor: isOverBudget ? 'var(--error)' : 'var(--primary)',
            }}
          />
        </div>

        {/* Highlight which categories have exceeded their spending limit */}
        {exceededCategories.length > 0 && (
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#DC2626', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <AlertTriangle size={12} strokeWidth={2.5} />
              <span>Exceeded Category Spending Limits</span>
            </div>
            {exceededCategories.map((catKey) => {
              const limit = activeCategoryBudgets[catKey] || 0;
              const spent = categorySpending[catKey.toLowerCase()] || 0;
              const over = spent - limit;
              const meta = getCategoryMeta(catKey);
              return (
                <div
                  key={catKey}
                  style={{
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.78rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{meta.icon}</span>
                    <span style={{ fontWeight: 600, color: '#991B1B' }}>{meta.label}:</span>
                    <span style={{ color: '#4B5563', fontSize: '0.74rem' }}>
                      ₹{spent.toLocaleString()} / ₹{limit.toLocaleString()}
                    </span>
                  </div>
                  <span style={{ fontWeight: 700, color: '#DC2626', fontSize: '0.76rem' }}>
                    +₹{over.toLocaleString()} exceeded
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Category Budget Allocation action card - Monochrome Voyage Design System */}
        <button
          type="button"
          onClick={() => {
            setCategoryBudgetsDraft(trip.categoryBudgets || {});
            setIsBudgetSplitModalOpen(true);
          }}
          style={{
            marginTop: '12px',
            width: '100%',
            padding: '10px 14px',
            backgroundColor: 'var(--surface-neutral-1)',
            border: '1px solid var(--stroke)',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'background-color 140ms ease, border-color 140ms ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '9999px',
                backgroundColor: '#111111',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <SlidersHorizontal size={14} strokeWidth={2.2} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--primary)' }}>
                Category Budget Limits
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--secondary)' }}>
                {Object.keys(activeCategoryBudgets).length > 0
                  ? `${Object.keys(activeCategoryBudgets).length} categories assigned spending limits`
                  : 'Distribute total budget across categories'}
              </div>
            </div>
          </div>
          <span
            className="btn btn-secondary btn-sm"
            style={{
              height: '30px',
              minHeight: '30px',
              padding: '0 12px',
              borderRadius: '9999px',
              fontSize: '0.74rem',
              fontWeight: 600,
              flexShrink: 0,
              pointerEvents: 'none',
            }}
          >
            {Object.keys(activeCategoryBudgets).length > 0 ? 'Edit Limits' : 'Set Budgets'}
          </span>
        </button>
      </div>

      {/* Segmented Sub Tabs */}
      <div className="cupertino-segmented">
        <button
          onClick={() => setActiveTab('expenses')}
          className={`cupertino-segment-item ${activeTab === 'expenses' ? 'active' : ''}`}
        >
          <CreditCard size={14} strokeWidth={2} />
          <span>Purchases</span>
          <span className="chip-count-bubble">{purchasesList.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('debts')}
          className={`cupertino-segment-item ${activeTab === 'debts' ? 'active' : ''}`}
        >
          <Users size={14} strokeWidth={2} />
          <span>Personal Debts</span>
          <span className="chip-count-bubble">{debtsList.length}</span>
        </button>
      </div>

      {/* View 1: Purchases Ledger */}
      {activeTab === 'expenses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {purchasesList.length > 0 ? (
            purchasesList.map((exp) => {
              const meta = getCategoryMeta(exp.category);
              return (
                <div
                  key={exp.id}
                  className="travelnest-card"
                  style={{
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    margin: 0,
                    backgroundColor: '#ffffff',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '9999px',
                        backgroundColor: 'var(--surface-neutral-1)',
                        border: '1px solid var(--stroke)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.9rem',
                        flexShrink: 0,
                      }}
                    >
                      {meta.icon}
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: '0.88rem',
                          color: 'var(--primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {exp.title}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--secondary)', marginTop: '2px' }}>
                        {formatDateDDmmmYY(exp.date)} • {meta.label} • Paid by {exp.paidBy}
                        {exp.bookingId && (
                          <span style={{ color: 'var(--primary)', fontWeight: 600, marginLeft: '6px' }}>• Linked Booking</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary)' }}>
                      ₹{exp.amount.toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleDeleteExpense(exp.id, exp.title)}
                      className="btn btn-ghost"
                      style={{ color: 'var(--secondary)', padding: '2px' }}
                      title="Delete"
                    >
                      <Trash2 size={13} strokeWidth={1.8} />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="travelnest-card" style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--secondary)', fontSize: '0.84rem', backgroundColor: 'var(--surface-neutral-1)' }}>
              No purchases logged yet. Tap <strong>+</strong> to record an expense.
            </div>
          )}
        </div>
      )}

      {/* View 2: Personal Debts & IOUs */}
      {activeTab === 'debts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Unsettled Debts Summary Bar */}
          <div
            className="travelnest-card"
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--surface-neutral-1)',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              margin: 0,
            }}
          >
            <div>
              <span className="label-micro" style={{ marginBottom: '2px' }}>I Owe (Borrowings)</span>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary)' }}>
                ₹{totalIOwe.toFixed(2)}
              </div>
            </div>
            <div>
              <span className="label-micro" style={{ marginBottom: '2px' }}>Owed to Me (Lendings)</span>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary)' }}>
                ₹{totalOwedToMe.toFixed(2)}
              </div>
            </div>
          </div>

          {debtsList.length > 0 ? (
            debtsList.map((debt) => {
              const isSettled = debt.debtSettled;
              const isIOwe = debt.debtDirection === 'i_owe' || !debt.debtDirection;

              return (
                <div
                  key={debt.id}
                  className="travelnest-card"
                  style={{
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    margin: 0,
                    backgroundColor: '#ffffff',
                    opacity: isSettled ? 0.6 : 1,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          backgroundColor: isIOwe ? 'var(--primary)' : 'var(--surface-neutral-2)',
                          color: isIOwe ? '#ffffff' : 'var(--primary)',
                          border: '1px solid var(--stroke)',
                          borderRadius: '9999px',
                          padding: '3px 8px',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        {isIOwe ? <ArrowDownLeft size={10} strokeWidth={2} /> : <ArrowUpRight size={10} strokeWidth={2} />}
                        <span>{isIOwe ? 'I Borrowed' : 'I Lent'}</span>
                      </span>

                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)' }}>
                        {debt.debtTraveler || debt.paidBy}
                      </span>
                    </div>

                    <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary)' }}>
                      ₹{debt.amount.toFixed(2)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                    <span style={{ color: 'var(--secondary)' }}>
                      {debt.title} • {formatDateDDmmmYY(debt.date)}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        onClick={() => handleToggleDebtSettled(debt)}
                        className={`btn btn-sm ${isSettled ? 'btn-secondary' : 'btn-primary'}`}
                        style={{ minHeight: '30px', padding: '3px 12px', fontSize: '0.72rem' }}
                      >
                        {isSettled ? <Clock size={11} strokeWidth={2} /> : <Check size={11} strokeWidth={2} />}
                        <span>{isSettled ? 'Reopen' : 'Settle'}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteExpense(debt.id, debt.title)}
                        className="btn btn-ghost"
                        style={{ color: 'var(--secondary)', padding: '2px' }}
                        title="Delete"
                      >
                        <Trash2 size={13} strokeWidth={1.8} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="travelnest-card" style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--secondary)', fontSize: '0.84rem', backgroundColor: 'var(--surface-neutral-1)' }}>
              No personal debts logged. Tap <strong>+</strong> to record an IOU with a traveler.
            </div>
          )}
        </div>
      )}

      {/* Category Budget Allocation Modal */}
      {isBudgetSplitModalOpen && (
        <div className="modal-overlay" onClick={() => setIsBudgetSplitModalOpen(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="sheet-drag-handle" />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 20px 14px',
                borderBottom: '1px solid var(--stroke)',
              }}
            >
              <button
                type="button"
                onClick={() => setIsBudgetSplitModalOpen(false)}
                className="btn btn-ghost"
                style={{ fontSize: '0.88rem', padding: '0 4px', color: 'var(--secondary)' }}
              >
                Cancel
              </button>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Category Spending Limits</h3>
              <button
                type="button"
                onClick={handleSaveCategoryBudgets}
                disabled={isAllocationOverBudget}
                className="btn btn-ghost"
                style={{
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  padding: '0 4px',
                  color: isAllocationOverBudget ? 'var(--neutral-carbon)' : 'var(--primary)',
                  opacity: isAllocationOverBudget ? 0.45 : 1,
                  cursor: isAllocationOverBudget ? 'not-allowed' : 'pointer',
                }}
              >
                Save
              </button>
            </div>

            <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  backgroundColor: 'var(--surface-neutral-1)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <span className="label-micro" style={{ margin: 0 }}>Total Trip Budget</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>
                    ₹{plannedBudget.toLocaleString()}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="label-micro" style={{ margin: 0 }}>Allocated Total</span>
                  <div
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      color: isAllocationOverBudget ? '#DC2626' : 'var(--primary)',
                    }}
                  >
                    ₹{draftTotalAllocated.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Warning when allocations exceed trip planned budget */}
              {isAllocationOverBudget && (
                <div
                  style={{
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    fontSize: '0.78rem',
                    color: '#991B1B',
                  }}
                >
                  <AlertTriangle size={16} strokeWidth={2.4} style={{ color: '#DC2626', flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.82rem' }}>
                      Allocations Exceed Planned Budget
                    </span>
                    <span>
                      Allocated sum of ₹{draftTotalAllocated.toLocaleString()} exceeds your trip budget of ₹{plannedBudget.toLocaleString()} by ₹{allocationExceededAmount.toLocaleString()}. You cannot save until allocations are within or equal to the total budget.
                    </span>
                  </div>
                </div>
              )}

              <span className="label-micro" style={{ margin: 0 }}>
                Set max spending allowance per category:
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {allExpenseCategories.map((cat) => {
                  const key = cat.id.toLowerCase();
                  const currentLimit = categoryBudgetsDraft[key] ?? '';
                  const spent = categorySpending[key] || 0;

                  return (
                    <div
                      key={cat.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        padding: '8px 12px',
                        border: '1px solid var(--stroke)',
                        borderRadius: '12px',
                        backgroundColor: '#ffffff',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: '1.2rem' }}>{cat.icon}</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.86rem' }}>{cat.label}</div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--secondary)' }}>
                            Current Spent: ₹{spent.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--secondary)', fontWeight: 600 }}>₹</span>
                        <input
                          type="number"
                          placeholder="0"
                          value={currentLimit}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                            setCategoryBudgetsDraft({
                              ...categoryBudgetsDraft,
                              [key]: val,
                            });
                          }}
                          className="input"
                          style={{
                            width: '110px',
                            height: '36px',
                            minHeight: '36px',
                            fontSize: '0.84rem',
                            textAlign: 'right',
                            fontWeight: 600,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleSaveCategoryBudgets}
                disabled={isAllocationOverBudget}
                className="btn btn-primary"
                style={{
                  marginTop: '10px',
                  opacity: isAllocationOverBudget ? 0.45 : 1,
                  cursor: isAllocationOverBudget ? 'not-allowed' : 'pointer',
                }}
              >
                {isAllocationOverBudget ? 'Exceeds Budget (Cannot Save)' : 'Save Category Limits'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Entry Modal Sheet */}
      {isAddExpenseModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddExpenseModalOpen(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="sheet-drag-handle" />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 18px 12px',
                borderBottom: '1px solid var(--stroke)',
              }}
            >
              <button
                type="button"
                onClick={() => setIsAddExpenseModalOpen(false)}
                className="btn btn-ghost"
                style={{ fontSize: '0.88rem', padding: '0 4px', color: 'var(--secondary)' }}
              >
                Cancel
              </button>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, letterSpacing: '-0.01em', margin: 0 }}>
                {entryType === 'debt' ? 'Log Personal Debt' : 'Log Expense'}
              </h3>
              <button
                type="button"
                onClick={handleCreateEntry}
                className="btn btn-ghost"
                style={{ fontSize: '0.88rem', fontWeight: 700, padding: '0 4px', color: 'var(--primary)' }}
              >
                Save
              </button>
            </div>

            {/* Segmented Entry Type Choice: Purchase vs Personal Debt */}
            <div style={{ padding: '14px 18px 0' }}>
              <div className="cupertino-segmented">
                <button
                  type="button"
                  onClick={() => setEntryType('purchase')}
                  className={`cupertino-segment-item ${entryType === 'purchase' ? 'active' : ''}`}
                >
                  <CreditCard size={13} strokeWidth={2} />
                  <span>Expense</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEntryType('debt')}
                  className={`cupertino-segment-item ${entryType === 'debt' ? 'active' : ''}`}
                >
                  <Users size={13} strokeWidth={2} />
                  <span>Personal Debt</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateEntry} style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {entryType === 'debt' ? (
                <>
                  <div>
                    <label className="label-micro">Traveler (From Trip Members)</label>
                    <select
                      value={debtTraveler}
                      onChange={(e) => setDebtTraveler(e.target.value)}
                      className="select"
                    >
                      {trip.travelers.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label-micro">Debt Relationship</label>
                    <div className="cupertino-segmented">
                      <button
                        type="button"
                        onClick={() => setDebtDirection('i_owe')}
                        className={`cupertino-segment-item ${debtDirection === 'i_owe' ? 'active' : ''}`}
                      >
                        <ArrowDownLeft size={13} strokeWidth={2} />
                        <span>I Borrowed (I Owe)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDebtDirection('they_owe')}
                        className={`cupertino-segment-item ${debtDirection === 'they_owe' ? 'active' : ''}`}
                      >
                        <ArrowUpRight size={13} strokeWidth={2} />
                        <span>I Lent (They Owe Me)</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="label-micro">Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Dinner bill, taxi fare, shared grocery"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="input"
                      required
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="label-micro">Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Omakase Dinner or Metro Card"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="input"
                      required
                    />
                  </div>

                  <div>
                    <label className="label-micro">Link to Booking? (Optional)</label>
                    <select
                      value={linkedBookingId}
                      onChange={(e) => setLinkedBookingId(e.target.value)}
                      className="select"
                    >
                      <option value="">None (Standalone Expense)</option>
                      {bookings?.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.title} (₹{b.cost.toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label className="label-micro">Category</label>
                        <button
                          type="button"
                          onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--primary)',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            padding: 0,
                            textDecoration: 'underline',
                          }}
                        >
                          {isCreatingCategory ? 'Use Existing' : '+ New'}
                        </button>
                      </div>

                      {!isCreatingCategory ? (
                        <select
                          value={category}
                          onChange={(e) => {
                            if (e.target.value === '__NEW__') {
                              setIsCreatingCategory(true);
                            } else {
                              setCategory(e.target.value);
                            }
                          }}
                          className="select"
                        >
                          {allExpenseCategories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.icon} {c.label}
                            </option>
                          ))}
                          <option value="__NEW__">+ Add New Category...</option>
                        </select>
                      ) : null}
                    </div>

                    <div>
                      <label className="label-micro">Paid By</label>
                      <select
                        value={paidBy}
                        onChange={(e) => setPaidBy(e.target.value)}
                        className="select"
                      >
                        {trip.travelers.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Inline Category Creator in Log Expense */}
                  {isCreatingCategory && (
                    <div
                      style={{
                        backgroundColor: 'var(--surface-neutral-1)',
                        border: '1px solid var(--stroke)',
                        borderRadius: '12px',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                      }}
                    >
                      <span className="label-micro" style={{ margin: 0 }}>Create New Expense Category</span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          placeholder="Icon / Emoji"
                          value={newCatIcon}
                          onChange={(e) => setNewCatIcon(e.target.value)}
                          className="input"
                          style={{ width: '80px', textAlign: 'center', fontSize: '1.1rem' }}
                        />
                        <input
                          type="text"
                          placeholder="Category Name (e.g. Souvenirs)"
                          value={newCatLabel}
                          onChange={(e) => setNewCatLabel(e.target.value)}
                          className="input"
                          style={{ flex: 1 }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveNewExpenseCategory();
                            }
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => setIsCreatingCategory(false)}
                          className="btn btn-secondary btn-sm"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveNewExpenseCategory()}
                          className="btn btn-primary btn-sm"
                        >
                          Save Category
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Amount and Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                <div>
                  <label className="label-micro">Amount (₹ INR)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label-micro">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label-micro">Notes (Optional)</label>
                <textarea
                  placeholder="Details, receipt reference..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="textarea"
                  rows={2}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '6px' }}>
                <span>{entryType === 'debt' ? 'Save Personal Debt' : 'Save Expense'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      <FloatingActionButton
        onClick={() => handleOpenAddModal(activeTab === 'debts' ? 'debt' : 'purchase')}
        icon={<Plus size={24} strokeWidth={2.4} />}
        label={activeTab === 'debts' ? 'Add Personal Debt' : 'Add Expense'}
      />
    </div>
  );
};
