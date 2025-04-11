import React from 'react';
import styles from './CategoryFilter.module.css';
import { useTranslation } from '../../hooks/useTranslation';

const CategoryFilter = ({ 
  categories, 
  selectedCategory, 
  onSelectCategory,
  isCollapsed,
  onToggleCollapse
}) => {
  const { t } = useTranslation(['pos', 'common']);

  return (
    <div className={styles.categoryFilterContainer}>
      <div className={styles.categoryFilterHeader} onClick={onToggleCollapse}>
        <span>{t('pos:categories.title')}</span>
        <button className={styles.toggleFilterButton}>
          {isCollapsed ? '▼' : '▲'}
        </button>
      </div>
      {!isCollapsed && (
        <div className={styles.productCategories}>
          <button 
            className={`${styles.categoryButton} ${selectedCategory === null ? styles.active : ''}`}
            onClick={() => onSelectCategory(null)}
          >
            {t('pos:categories.all')}
          </button>
          {categories.map(category => (
            <button 
              key={category.id}
              className={`${styles.categoryButton} ${selectedCategory === category.id ? styles.active : ''}`}
              onClick={() => onSelectCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryFilter; 