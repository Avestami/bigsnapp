import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Typography,
  Space,
  Spin,
  Progress,
  List,
  Avatar,
  Tag,
  Button,
} from 'antd';
import {
  UserOutlined,
  CarOutlined,
  RocketOutlined,
  SendOutlined,
  WalletOutlined,
  TrophyOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { adminApi } from '../services/api';

const { Title, Text } = Typography;

interface DashboardStats {
  totalUsers: number;
  totalDrivers: number;
  totalRides: number;
  totalDeliveries: number;
  totalRevenue: number;
  activeRides: number;
  activeDeliveries: number;
  pendingDriverApprovals: number;
  userGrowth: number;
  revenueGrowth: number;
}

interface RecentActivity {
  id: string;
  type: 'ride' | 'delivery' | 'user' | 'driver';
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'pending' | 'error';
}

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsResponse, activityResponse] = await Promise.all([
        adminApi.getDashboardStats(),
        adminApi.getRecentActivity(),
      ]);
      setStats(statsResponse.data);
      setRecentActivity(activityResponse.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'ride':
        return <RocketOutlined style={{ color: '#007AFF' }} />;
      case 'delivery':
        return <SendOutlined style={{ color: '#FF9500' }} />;
      case 'user':
        return <UserOutlined style={{ color: '#34C759' }} />;
      case 'driver':
        return <CarOutlined style={{ color: '#FF3B30' }} />;
      default:
        return <UserOutlined />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'pending':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Dashboard
          </Title>
          <Text type="secondary">Welcome to SnappClone Admin Panel</Text>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={fetchDashboardData}
          loading={loading}
        >
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={stats?.totalUsers || 0}
              prefix={<UserOutlined />}
              suffix={
                <span style={{ fontSize: '12px', color: '#52c41a' }}>
                  <ArrowUpOutlined /> {stats?.userGrowth || 0}%
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Drivers"
              value={stats?.totalDrivers || 0}
              prefix={<CarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Rides"
              value={stats?.totalRides || 0}
              prefix={<RocketOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={stats?.totalRevenue || 0}
              prefix={<WalletOutlined />}
              precision={2}
              suffix={
                <span style={{ fontSize: '12px', color: '#52c41a' }}>
                  <ArrowUpOutlined /> {stats?.revenueGrowth || 0}%
                </span>
              }
            />
          </Card>
        </Col>
      </Row>

      {/* Active Services */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={12}>
          <Card title="Active Services" extra={<TrophyOutlined />}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                  }}
                >
                  <Text>Active Rides</Text>
                  <Text strong>{stats?.activeRides || 0}</Text>
                </div>
                <Progress
                  percent={((stats?.activeRides || 0) / 100) * 100}
                  strokeColor="#007AFF"
                  showInfo={false}
                />
              </div>
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                  }}
                >
                  <Text>Active Deliveries</Text>
                  <Text strong>{stats?.activeDeliveries || 0}</Text>
                </div>
                <Progress
                  percent={((stats?.activeDeliveries || 0) / 100) * 100}
                  strokeColor="#FF9500"
                  showInfo={false}
                />
              </div>
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                  }}
                >
                  <Text>Pending Approvals</Text>
                  <Text strong>{stats?.pendingDriverApprovals || 0}</Text>
                </div>
                <Progress
                  percent={((stats?.pendingDriverApprovals || 0) / 50) * 100}
                  strokeColor="#FF3B30"
                  showInfo={false}
                />
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Recent Activity">
            <List
              dataSource={recentActivity}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={getActivityIcon(item.type)} />}
                    title={
                      <Space>
                        <Text strong>{item.title}</Text>
                        <Tag color={getStatusColor(item.status)}>
                          {item.status}
                        </Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <Text type="secondary">{item.description}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {new Date(item.timestamp).toLocaleString()}
                        </Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;