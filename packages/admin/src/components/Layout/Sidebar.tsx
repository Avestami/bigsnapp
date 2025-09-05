import React from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  UserOutlined,
  CarOutlined,
  ToolOutlined,
  RocketOutlined,
  SendOutlined,
  WalletOutlined,
  StarOutlined,
  SettingOutlined,
} from '@ant-design/icons';

const { Sider } = Layout;

interface SidebarProps {
  collapsed: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/users',
      icon: <UserOutlined />,
      label: 'Users',
    },
    {
      key: '/drivers',
      icon: <CarOutlined />,
      label: 'Drivers',
    },
    {
      key: '/vehicles',
      icon: <ToolOutlined />,
      label: 'Vehicles',
    },
    {
      key: '/rides',
      icon: <RocketOutlined />,
      label: 'Rides',
    },
    {
      key: '/deliveries',
      icon: <SendOutlined />,
      label: 'Deliveries',
    },
    {
      key: '/wallet',
      icon: <WalletOutlined />,
      label: 'Wallet & Payments',
    },
    {
      key: '/reviews',
      icon: <StarOutlined />,
      label: 'Reviews',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
      }}
    >
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.1)',
          margin: '16px',
          borderRadius: '8px',
        }}
      >
        <h2
          style={{
            color: 'white',
            margin: 0,
            fontSize: collapsed ? '16px' : '20px',
            fontWeight: 'bold',
          }}
        >
          {collapsed ? 'SC' : 'SnappClone'}
        </h2>
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{
          border: 'none',
        }}
      />
    </Sider>
  );
};

export default Sidebar;