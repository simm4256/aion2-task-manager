import React, { useState } from 'react';

interface TabsProps {
  children: React.ReactNode;
}

interface TabProps {
  label: string;
  children: React.ReactNode;
}

export const Tab: React.FC<TabProps> = ({ children }) => {
  return <div className="tab-content">{children}</div>;
};

const Tabs: React.FC<TabsProps> = ({ children }) => {
  // Use React.Children.toArray to ensure children is an array
  const childrenArray = React.Children.toArray(children) as React.ReactElement<TabProps>[];
  const [activeTab, setActiveTab] = useState(childrenArray[0]?.props.label);

  const handleClick = (label: string) => {
    setActiveTab(label);
  };

  return (
    <div className="tabs">
      <div className="tab-list">
        {childrenArray.map((child) => {
          const { label } = child.props;
          return (
            <button
              key={label}
              className={activeTab === label ? 'tab-list-item active' : 'tab-list-item'}
              onClick={() => handleClick(label)}
            >
              {label}
            </button>
          );
        })}
      </div>
      <div className="tab-panels">
        {childrenArray.map((child) => {
          if (child.props.label !== activeTab) return undefined;
          return child;
        })}
      </div>
    </div>
  );
};

export default Tabs;
