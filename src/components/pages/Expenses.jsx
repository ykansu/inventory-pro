import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { useDatabase } from '../../context/DatabaseContext';
import { useSettings } from '../../context/SettingsContext';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear,
  startOfWeek,
  format,
  subDays 
} from 'date-fns';
import styles from './Expenses.module.css';
import Button from '../common/Button';
import FormGroup from '../common/FormGroup';
import Modal from '../common/Modal';
import Table from '../common/Table';

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
      } else {
        toast.error(result.error || t('loadCategoriesError'));
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error(t('loadCategoriesError'));
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
    
    const data = {
      reference_number: formData.get('reference'),
      description: formData.get('description'),
      amount: parseFloat(formData.get('amount')),
      category_id: formData.get('category_id') || null,
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

  // Define table columns for expenses
  const tableColumns = [
    { key: 'expense_date', title: t('date'), render: (row) => formatDate(row.expense_date) },
    { key: 'description', title: t('description'), cellClassName: styles.descriptionCell },
    { key: 'reference_number', title: t('reference') },
    { key: 'recipient', title: t('recipient') },
    { 
      key: 'category_name', 
      title: t('category'),
      render: (row) => (
        <span
          className={styles.categoryBadge}
          style={{ backgroundColor: getCategoryColor(row.category_name || t('other')) }}
        >
          {row.category_name || t('other')}
        </span>
      )
    },
    { key: 'payment_method', title: t('paymentMethod'), render: (row) => t(row.payment_method) },
    { 
      key: 'amount', 
      title: t('amount'), 
      cellClassName: styles.amountCell,
      className: styles.amountColumn,
      render: (row) => formatCurrency(row.amount)
    },
    {
      key: 'actions',
      title: t('actions'),
      className: styles.actionsColumn,
      cellClassName: styles.actionsCell,
      render: (row) => (
        <div className={styles.actionButtons}>
          <button 
            className={`${styles.actionButton} ${styles.editButton}`}
            onClick={() => handleEditExpense(row)}
            title={t('edit')}
          >
            ✏️
          </button>
          <button 
            className={`${styles.actionButton} ${styles.deleteButton}`}
            onClick={() => handleDeleteExpense(row.id)}
            title={t('delete')}
          >
            🗑️
          </button>
        </div>
      )
    }
  ];

  return (
    <div className={styles.expensesPage}>
      <div className={styles.pageHeader}>
        <h1>{t('title')}</h1>
        <div className={styles.actions}>
          <Button 
            variant="secondary"
            onClick={() => {
              setSelectedCategory(null);
              setShowCategoryModal(true);
            }}
          >
            {t('addCategory')}
          </Button>
          <Button
            onClick={() => {
              setSelectedExpense(null);
              setShowExpenseModal(true);
            }}
          >
            {t('addExpense')}
          </Button>
        </div>
      </div>

      <form onSubmit={handleFilterSubmit} className={styles.filtersContainer}>
        <div className={styles.filtersTop}>
          <div className={styles.dateQuickFilters}>
            <Button size="small" onClick={() => setDateRange('today')}>
              {t('today')}
            </Button>
            <Button size="small" onClick={() => setDateRange('week')}>
              {t('thisWeek')}
            </Button>
            <Button size="small" onClick={() => setDateRange('month')}>
              {t('thisMonth')}
            </Button>
            <Button size="small" onClick={() => setDateRange('year')}>
              {t('thisYear')}
            </Button>
          </div>
        </div>
        
        <div className={styles.filtersGrid}>
          <FormGroup label={t('dateRange')} compact>
            <div className={styles.dateRange}>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="form-control"
              />
              <span className={styles.dateSeparator}>-</span>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="form-control"
              />
            </div>
          </FormGroup>

          <FormGroup label={t('category')} htmlFor="categoryId" compact>
            <select
              id="categoryId"
              name="categoryId"
              value={filters.categoryId}
              onChange={handleFilterChange}
              className="form-control"
            >
              <option value="">{t('all')}</option>
              {categoriesList.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </FormGroup>

          <FormGroup label={t('paymentMethod')} htmlFor="paymentMethod" compact>
            <select
              id="paymentMethod"
              name="paymentMethod"
              value={filters.paymentMethod}
              onChange={handleFilterChange}
              className="form-control"
            >
              <option value="">{t('all')}</option>
              <option value="cash">{t('cash')}</option>
              <option value="card">{t('card')}</option>
              <option value="bankTransfer">{t('bankTransfer')}</option>
              <option value="check">{t('check')}</option>
              <option value="other">{t('other')}</option>
            </select>
          </FormGroup>

          <FormGroup label={t('search')} htmlFor="search" compact>
            <input
              type="text"
              id="search"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder={t('searchPlaceholder')}
              className="form-control"
            />
          </FormGroup>
        </div>

        <div className={styles.filterActions}>
          <Button type="submit" variant="primary" size="small">
            {t('applyFilters')}
          </Button>
          <Button variant="secondary" size="small" onClick={resetFilters}>
            {t('resetFilters')}
          </Button>
        </div>
      </form>

      <div className={styles.summaryCards}>
        <div className={`${styles.summaryCard} ${styles.summaryCardTotal}`}>
          <h3>{t('totalExpenses')}</h3>
          <p>{formatCurrency(expensesList.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0))}</p>
        </div>
        {Object.entries(categoryTotals).map(([category, total]) => (
          <div key={category} className={styles.summaryCard}>
            <h3>
              <span 
                className={styles.categoryIndicator} 
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
        <div className={styles.noData}>
          <p>{t('noExpenses')}</p>
        </div>
      ) : (
        <Table 
          columns={tableColumns}
          data={expensesList}
          emptyMessage={t('noExpenses')}
          isLoading={loading}
        />
      )}

      {/* Expense Modal */}
      <Modal
        isOpen={showExpenseModal}
        onClose={() => {
          setShowExpenseModal(false);
          setSelectedExpense(null);
        }}
        title={selectedExpense ? t('editExpense') : t('addExpense')}
        size="medium"
      >
        <form onSubmit={handleExpenseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', boxSizing: 'border-box' }}>
          <div className={styles.formRow}>
            <FormGroup label={t('date')} htmlFor="date" required>
              <input
                type="date"
                id="date"
                name="date"
                defaultValue={selectedExpense?.expense_date?.slice(0, 10) || format(new Date(), 'yyyy-MM-dd')}
                required
                className={`form-control ${styles.modalFormControl}`}
              />
            </FormGroup>

            <FormGroup label={t('amount')} htmlFor="amount" required>
              <input
                type="number"
                id="amount"
                name="amount"
                step="0.01"
                defaultValue={selectedExpense?.amount || ''}
                required
                className={`form-control ${styles.modalFormControl}`}
              />
            </FormGroup>
          </div>

          <FormGroup label={t('description')} htmlFor="description" required>
            <input
              type="text"
              id="description"
              name="description"
              defaultValue={selectedExpense?.description || ''}
              required
              className={`form-control ${styles.modalFormControl}`}
            />
          </FormGroup>

          <div className={styles.formRow}>
            <FormGroup label={t('category')} htmlFor="category_id">
              <select
                id="category_id"
                name="category_id"
                defaultValue={selectedExpense?.category_id || ''}
                className={`form-control ${styles.modalFormControl}`}
              >
                <option value="">{t('selectCategory')}</option>
                {categoriesList.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </FormGroup>

            <FormGroup label={t('paymentMethod')} htmlFor="payment_method" required>
              <select
                id="payment_method"
                name="payment_method"
                defaultValue={selectedExpense?.payment_method || 'cash'}
                required
                className={`form-control ${styles.modalFormControl}`}
              >
                <option value="cash">{t('cash')}</option>
                <option value="card">{t('card')}</option>
                <option value="bankTransfer">{t('bankTransfer')}</option>
                <option value="check">{t('check')}</option>
                <option value="other">{t('other')}</option>
              </select>
            </FormGroup>
          </div>

          <FormGroup label={t('recipient')} htmlFor="recipient">
            <input
              type="text"
              id="recipient"
              name="recipient"
              defaultValue={selectedExpense?.recipient || ''}
              className={`form-control ${styles.modalFormControl}`}
            />
          </FormGroup>

          <FormGroup label={t('reference')} htmlFor="reference">
            <input
              type="text"
              id="reference"
              name="reference"
              defaultValue={selectedExpense?.reference_number || ''}
              className={`form-control ${styles.modalFormControl}`}
            />
          </FormGroup>

          <FormGroup label={t('notes')} htmlFor="notes">
            <textarea
              id="notes"
              name="notes"
              defaultValue={selectedExpense?.notes || ''}
              className={`form-control ${styles.modalFormControl} ${styles.modalTextarea}`}
              rows="3"
            ></textarea>
          </FormGroup>

          <div className={styles.formActions}>
            <Button type="submit" variant="primary" size="medium">
              {selectedExpense ? t('update') : t('save')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Category Modal */}
      <Modal
        isOpen={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false);
          setSelectedCategory(null);
        }}
        title={selectedCategory ? t('editCategory') : t('addCategory')}
        size="small"
      >
        <form onSubmit={handleCategorySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', boxSizing: 'border-box' }}>
          <FormGroup label={t('name')} htmlFor="name" required>
            <input
              type="text"
              id="name"
              name="name"
              defaultValue={selectedCategory?.name || ''}
              required
              className={`form-control ${styles.modalFormControl}`}
            />
          </FormGroup>

          <FormGroup label={t('description')} htmlFor="description">
            <textarea
              id="description"
              name="description"
              defaultValue={selectedCategory?.description || ''}
              className={`form-control ${styles.modalFormControl} ${styles.modalTextarea}`}
            ></textarea>
          </FormGroup>

          <div className={styles.formActions}>
            <Button type="submit" variant="primary">
              {selectedCategory ? t('update') : t('save')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Expenses; 