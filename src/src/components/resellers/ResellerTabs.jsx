import React from 'react';
import { Tabs, Tab } from '@mui/material';

const ResellerTabs = ({ currentTab, handleTabChange, resellers, activeCount, disabledCount, deactivatedCount }) => {
  return (
    <Tabs value={currentTab} onChange={handleTabChange} indicatorColor="primary" textColor="primary">
      <Tab
        label={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            All
            <span
              style={{
                color: 'white',
                backgroundColor: 'black',
                padding: '2px 5px',
                borderRadius: '3px',
                marginLeft: '5px',
              }}
            >
              {resellers.length}
            </span>
          </div>
        }
        value="All"
      />
      <Tab
        label={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            Active
            <span
              style={{
                color: 'green',
                backgroundColor: '#e8f5e9',
                padding: '2px 5px',
                borderRadius: '3px',
                marginLeft: '5px',
              }}
            >
              {activeCount}
            </span>
          </div>
        }
        value="Active"
      />
      <Tab
        label={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            Disabled
            <span
              style={{
                color: 'darkorange',
                backgroundColor: '#fff8e1',
                padding: '2px 5px',
                borderRadius: '3px',
                marginLeft: '5px',
              }}
            >
              {disabledCount}
            </span>
          </div>
        }
        value="Disabled"
      />
      <Tab
        label={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            Deactivated
            <span
              style={{
                color: 'red',
                backgroundColor: '#ffebee',
                padding: '2px 5px',
                borderRadius: '3px',
                marginLeft: '5px',
              }}
            >
              {deactivatedCount}
            </span>
          </div>
        }
        value="Deactivated"
      />
    </Tabs>
  );
};

export default ResellerTabs;
