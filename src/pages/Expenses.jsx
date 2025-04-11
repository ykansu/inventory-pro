import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { useDatabase } from '../context/DatabaseContext';
import { useSettings } from '../context/SettingsContext';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear,
  startOfWeek,
  format,
  subDays 
} from 'date-fns';
import '../styles/pages/expenses.css';

const Expenses = () => {
  const { t } = useTranslation('expenses');
  const { expenses, expenseCategories } = useDatabase();
  const { getCurrency, getDateFormat } = useSettings();
  
  const [expensesList, setExpensesList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Set default date filter to current month using date-fns
  const today = new Date();
  const monthStartDate = format(startOfMonth(today), 'yyyy-MM-dd');
  const monthEndDate = format(endOfMonth(today), 'yyyy-MM-dd');
  
  const [filters, setFilters] = useState({
    startDate: monthStartDate,
    endDate: monthEndDate,
    categoryId: '',
    paymentMethod: '',
    search: ''
  });
  
  const [categoryTotals, setCategoryTotals] = useState({});

  // Function to get a deterministic color based on category name
  const getCategoryColor = (categoryName) => {
    if (!categoryName) return '#00aaff';
    
    // Simple hash function to convert category name to a predictable number
    const hash = categoryName.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    // Convert the hash to a hex color
    let color = '#';
    for (let i = 0; i < 3; i++) {
      // Get a value between 0-255 for each RGB component
      // Adjust to make colors more vibrant (avoid too dark or too light)
      const value = ((hash >> (i * 8)) & 0xFF);
      const adjustedValue = Math.max(50, Math.min(200, value)); // Keep between 50-200 for better visibility
      color += ('00' + adjustedValue.toString(16)).substr(-2);
    }
    return color;
  };
  
  useEffect(() => {
    loadCategories();
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const result = await expenses.getAllExpenses(filters);
      
      if (result.success) {
        setExpensesList(result.data || []);
        calculateCategoryTotals(result.data);
      } else {
        toast.error(result.error || t('loadError'));
      }
    } catch (error) {
      console.error('Error loading expenses:', error);
      toast.error(t('loadError'));
    } finally {
      setLoading(false);
    }
  };

  const calculateCategoryTotals = (data) => {
    const totals = {};
    data.forEach(expense => {
      const catName = expense.category_name || t('other');
      totals[catName] = (totals[catName] || 0) + parseFloat(expense.amount || 0);
    });
    setCategoryTotals(totals);
  };

  const loadCategories = async () => {
    try {
      const result = await expenseCategories.getAllCategories();
      if (result.success) {
        setCategoriesList(result.data || []);
        
        // Check if "Other" category exists
        const otherCategoryName = t('other');
        const otherCategoryExists = result.data.some(
          cat => cat.name.toLowerCase() === otherCategoryName.toLowerCase()
        );
        
        // If "Other" category doesn't exist, create it
        if (!otherCategoryExists) {
          await createOtherCategory();
          // After creating, reload the categories
          const updatedResult = await expenseCategories.getAllCategories();
          if (updatedResult.success) {
            setCategoriesList(updatedResult.data || []);
          }
        }
      } else {
        toast.error(result.error || t('loadCategoriesError'));
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error(t('loadCategoriesError'));
    }
  };

  const createOtherCategory = async () => {
    try {
      const otherCategoryData = {
        name: t('other'),
        description: t('defaultCategoryDescription')
      };
      
      await expenseCategories.createCategory(otherCategoryData);
    } catch (error) {
      console.error('Error creating Other category:', error);
      // Don't show toast for this, as it's a background operation
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    loadExpenses();
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    // Find the "Other" category from the list, if it exists
    const otherCategory = categoriesList.find(
      cat => cat.name.toLowerCase() === t('other').toLowerCase()
    );
    
    const data = {
      reference_number: formData.get('reference'),
      description: formData.get('description'),
      amount: parseFloat(formData.get('amount')),
      category_id: formData.get('category_id') || (otherCategory ? otherCategory.id : null),
      expense_date: formData.get('date'),
      payment_method: formData.get('payment_method'),
      recipient: formData.get('recipient'),
      notes: formData.get('notes')
    };

    try {
      let result;
      
      if (selectedExpense) {
        result = await expenses.updateExpense(selectedExpense.id, data);
        if (result.success) {
          toast.success(t('updateSuccess'));
        } else {
          toast.error(result.error || t('updateError'));
        }
      } else {
        result = await expenses.createExpense(data);
        if (result.success) {
          toast.success(t('createSuccess'));
        } else {
          toast.error(result.error || t('createError'));
        }
      }
      
      setShowExpenseModal(false);
      setSelectedExpense(null);
      loadExpenses();
    } catch (error) {
      console.error('Error saving expense:', error);
      toast.error(t('saveError'));
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      description: formData.get('description')
    };

    try {
      let result;
      
      if (selectedCategory) {
        result = await expenseCategories.updateCategory(selectedCategory.id, data);
        if (result.success) {
          toast.success(t('categoryUpdateSuccess'));
        } else {
          toast.error(result.error || t('categoryUpdateError'));
        }
      } else {
        result = await expenseCategories.createCategory(data);
        if (result.success) {
          toast.success(t('categoryCreateSuccess'));
        } else {
          toast.error(result.error || t('categoryCreateError'));
        }
      }
      
      setShowCategoryModal(false);
      setSelectedCategory(null);
      loadCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error(t('categorySaveError'));
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm(t('confirmDelete'))) return;

    try {
      const result = await expenses.deleteExpense(id);
      if (result.success) {
        toast.success(t('deleteSuccess'));
        loadExpenses();
      } else {
        toast.error(result.error || t('deleteError'));
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error(t('deleteError'));
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm(t('confirmDeleteCategory'))) return;

    try {
      const result = await expenseCategories.deleteCategory(id);
      if (result.success) {
        toast.success(t('categoryDeleteSuccess'));
        loadCategories();
      } else {
        toast.error(result.error || t('categoryDeleteError'));
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error(t('categoryDeleteError'));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy');
  };

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '';
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: getCurrency() || 'USD'
    }).format(amount);
  };

  const handleEditExpense = (expense) => {
    setSelectedExpense(expense);
    setShowExpenseModal(true);
  };

  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setShowCategoryModal(true);
  };

  const resetFilters = () => {
    // Use date-fns to get the first and last day of the current month
    const monthStartDate = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    const monthEndDate = format(endOfMonth(new Date()), 'yyyy-MM-dd');
    
    setFilters({
      startDate: monthStartDate,
      endDate: monthEndDate,
      categoryId: '',
      paymentMethod: '',
      search: ''
    });
    
    // After resetting the filters, apply them
    setTimeout(() => loadExpenses(), 0);
  };
  
  // Set predefined date ranges using date-fns
  const setDateRange = (range) => {
    const today = new Date();
    let startDate, endDate;
    
    switch(range) {
      case 'today':
        startDate = format(today, 'yyyy-MM-dd');
        endDate = format(today, 'yyyy-MM-dd');
        break;
      case 'week':
        startDate = format(startOfWeek(today), 'yyyy-MM-dd');
        endDate = format(today, 'yyyy-MM-dd');
        break;
      case 'month':
        startDate = format(startOfMonth(today), 'yyyy-MM-dd');
        endDate = format(endOfMonth(today), 'yyyy-MM-dd');
        break;
      case 'year':
        startDate = format(startOfYear(today), 'yyyy-MM-dd');
        endDate = format(endOfYear(today), 'yyyy-MM-dd');
        break;
      default:
        return;
    }
    
    setFilters(prev => ({
      ...prev,
      startDate,
      endDate
    }));
    
    // Apply the new filters
    setTimeout(() => loadExpenses(), 0);
  };

  return (
    <div className="expenses-page">
      <div className="page-header">
        <h1>{t('title')}</h1>
        <div className="actions">
          <button 
            onClick={() => {
              setSelectedCategory(null);
              setShowCategoryModal(true);
            }} 
            className="btn btn-secondary"
          >
            {t('addCategory')}
          </button>
          <button 
            onClick={() => {
              setSelectedExpense(null);
              setShowExpenseModal(true);
            }} 
            className="btn btn-primary"
          >
            {t('addExpense')}
          </button>
        </div>
      </div>

      <form onSubmit={handleFilterSubmit} className="filters-container">
        <div className="filter-date-section">
          <div className="date-quick-filters">
            <button type="button" onClick={() => setDateRange('today')} className="btn btn-sm">
              {t('today')}
            </button>
            <button type="button" onClick={() => setDateRange('week')} className="btn btn-sm">
              {t('thisWeek')}
            </button>
            <button type="button" onClick={() => setDateRange('month')} className="btn btn-sm">
              {t('thisMonth')}
            </button>
            <button type="button" onClick={() => setDateRange('year')} className="btn btn-sm">
              {t('thisYear')}
            </button>
          </div>
          
          <div className="filter-group">
            <label>{t('dateRange')}</label>
            <div className="date-range">
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
              />
              <span className="date-separator">-</span>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
              />
            </div>
          </div>
        </div>

        <div className="filters-row">
          <div className="filter-group">
            <label>{t('category')}</label>
            <select
              name="categoryId"
              value={filters.categoryId}
              onChange={handleFilterChange}
            >
              <option value="">{t('all')}</option>
              {categoriesList.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>{t('paymentMethod')}</label>
            <select
              name="paymentMethod"
              value={filters.paymentMethod}
              onChange={handleFilterChange}
            >
              <option value="">{t('all')}</option>
              <option value="cash">{t('cash')}</option>
              <option value="card">{t('card')}</option>
              <option value="bankTransfer">{t('bankTransfer')}</option>
              <option value="check">{t('check')}</option>
              <option value="other">{t('other')}</option>
            </select>
          </div>

          <div className="filter-group">
            <label>{t('search')}</label>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder={t('searchPlaceholder')}
            />
          </div>
        </div>

        <div className="filter-actions">
          <button type="submit" className="btn btn-primary">
            {t('applyFilters')}
          </button>
          <button type="button" onClick={resetFilters} className="btn btn-secondary">
            {t('resetFilters')}
          </button>
        </div>
      </form>

      <div className="summary-cards">
        <div className="summary-card total">
          <h3>{t('totalExpenses')}</h3>
          <p>{formatCurrency(expensesList.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0))}</p>
        </div>
        {Object.entries(categoryTotals).map(([category, total]) => (
          <div key={category} className="summary-card">
            <h3>
              <span 
                className="category-indicator" 
                style={{ backgroundColor: getCategoryColor(category) }}
              ></span> 
              {category}
            </h3>
            <p>{formatCurrency(total)}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="loading-spinner"></div>
      ) : expensesList.length === 0 ? (
        <div className="no-data">
          <p>{t('noExpenses')}</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>{t('date')}</th>
                <th>{t('description')}</th>
                <th>{t('reference')}</th>
                <th>{t('recipient')}</th>
                <th>{t('category')}</th>
                <th>{t('paymentMethod')}</th>
                <th className="amount-column">{t('amount')}</th>
                <th className="actions-column">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {expensesList.map(expense => (
                <tr key={expense.id}>
                  <td>{formatDate(expense.expense_date)}</td>
                  <td className="description-cell">{expense.description}</td>
                  <td>{expense.reference_number}</td>
                  <td>{expense.recipient}</td>
                  <td>
                    {expense.category_name ? (
                      <span
                        className="category-badge"
                        style={{ backgroundColor: getCategoryColor(expense.category_name) }}
                      >
                        {expense.category_name}
                      </span>
                    ) : (
                      <span
                        className="category-badge"
                        style={{ backgroundColor: getCategoryColor(t('other')) }}
                      >
                        {t('other')}
                      </span>
                    )}
                  </td>
                  <td>{t(expense.payment_method)}</td>
                  <td className="amount-cell">{formatCurrency(expense.amount)}</td>
                  <td className="actions-cell">
                    <button
                      onClick={() => handleEditExpense(expense)}
                      className="btn-icon"
                      title={t('edit')}
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      onClick={() => handleDeleteExpense(expense.id)}
                      className="btn-icon delete"
                      title={t('delete')}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{selectedExpense ? t('editExpense') : t('addExpense')}</h2>
              <button
                onClick={() => {
                  setShowExpenseModal(false);
                  setSelectedExpense(null);
                }}
                className="modal-close"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleExpenseSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="date">{t('date')}</label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    defaultValue={selectedExpense?.expense_date?.slice(0, 10) || format(new Date(), 'yyyy-MM-dd')}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="amount">{t('amount')}</label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    step="0.01"
                    defaultValue={selectedExpense?.amount || ''}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">{t('description')}</label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  defaultValue={selectedExpense?.description || ''}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="category_id">{t('category')}</label>
                  <select
                    id="category_id"
                    name="category_id"
                    defaultValue={selectedExpense?.category_id || 
                      (categoriesList.find(cat => cat.name.toLowerCase() === t('other').toLowerCase())?.id || '')}
                  >
                    <option value="">{t('selectCategory')}</option>
                    {categoriesList.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="payment_method">{t('paymentMethod')}</label>
                  <select
                    id="payment_method"
                    name="payment_method"
                    defaultValue={selectedExpense?.payment_method || 'cash'}
                    required
                  >
                    <option value="cash">{t('cash')}</option>
                    <option value="card">{t('card')}</option>
                    <option value="bankTransfer">{t('bankTransfer')}</option>
                    <option value="check">{t('check')}</option>
                    <option value="other">{t('other')}</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="recipient">{t('recipient')}</label>
                <input
                  type="text"
                  id="recipient"
                  name="recipient"
                  defaultValue={selectedExpense?.recipient || ''}
                />
              </div>

              <div className="form-group">
                <label htmlFor="reference">{t('reference')}</label>
                <input
                  type="text"
                  id="reference"
                  name="reference"
                  defaultValue={selectedExpense?.reference_number || ''}
                />
              </div>

              <div className="form-group">
                <label htmlFor="notes">{t('notes')}</label>
                <textarea
                  id="notes"
                  name="notes"
                  defaultValue={selectedExpense?.notes || ''}
                ></textarea>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {selectedExpense ? t('update') : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="modal-overlay">
          <div className="modal category-modal">
            <div className="modal-header">
              <h2>{selectedCategory ? t('editCategory') : t('addCategory')}</h2>
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setSelectedCategory(null);
                }}
                className="modal-close"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleCategorySubmit}>
              <div className="form-group">
                <label htmlFor="name">{t('name')}</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  defaultValue={selectedCategory?.name || ''}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">{t('description')}</label>
                <textarea
                  id="description"
                  name="description"
                  defaultValue={selectedCategory?.description || ''}
                ></textarea>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {selectedCategory ? t('update') : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses; 