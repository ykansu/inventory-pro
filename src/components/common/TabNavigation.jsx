import React from 'react';
import styles from './TabNavigation.module.css';

const TabNavigation = ({
  tabs,
  activeTab,
  onTabChange,
  className = '',
  orientation = 'vertical'
}) => {
  const containerClasses = [
    styles.tabsContainer,
    styles[orientation],
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      <ul className={styles.tabs}>
        {tabs.map((tab) => (
          <li key={tab.id} className={styles.tabItem}>
            <button
              className={`${styles.tabButton} ${activeTab === tab.id ? styles.activeTab : ''}`}
              onClick={() => onTabChange(tab.id)}
              aria-selected={activeTab === tab.id}
              role="tab"
            >
              {tab.icon && <span className={styles.tabIcon}>{tab.icon}</span>}
              <span>{tab.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TabNavigation; 