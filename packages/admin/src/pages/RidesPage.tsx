import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Modal,
  message,
  Typography,
  Descriptions,
  Timeline,
  Avatar,
  Statistic,
  Row,
  Col,
} from 'antd';
import {
  RocketOutlined,
  SearchOutlined,
  EyeOutlined,
  ReloadOutlined,
  UserOutlined,
  CarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { adminApi } from '../services/api';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
import { DatePicker } from 'antd';

interface Ride {
  id: string;
  userId: string;
  driverId?: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  driver?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  pickupLocation: {
    address: string;
    latitude: number;
    longitude: number;
  };
  dropoffLocation: {
    address: string;
    latitude: number;
    longitude: number;
  };
  status: 'REQUESTED' | 'ACCEPTED' | 'DRIVER_ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  rideType: 'ECONOMY' | 'COMFORT' | 'PREMIUM';
  fare: number;
  distance: number;
  duration: number;
  paymentMethod: 'CASH' | 'CARD' | 'WALLET';
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  acceptedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

interface RideFilters {
  search?: string;
  status?: string;
  rideType?: string;
  paymentStatus?: string;
  dateRange?: [string, string];
}

const RidesPage: React.FC = () => {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [filters, setFilters] = useState<RideFilters>({});
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    cancelled: 0,
    inProgress: 0,
  });

  const fetchRides = async () => {
    setLoading(true);
    try {
      const [ridesResponse, statsResponse] = await Promise.all([
        adminApi.getRides(filters),
        adminApi.getRideStats(),
      ]);
      setRides(ridesResponse.data);
      setStats(statsResponse.data);
    } catch (error) {
      message.error('Failed to fetch rides');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRides();
  }, [filters]);

  const openRideModal = (ride: Ride) => {
    setSelectedRide(ride);
    setIsModalVisible(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'IN_PROGRESS':
      case 'DRIVER_ARRIVED':
      case 'ACCEPTED':
        return 'processing';
      case 'REQUESTED':
        return 'warning';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getRideTypeColor = (type: string) => {
    switch (type) {
      case 'ECONOMY':
        return 'blue';
      case 'COMFORT':
        return 'orange';
      case 'PREMIUM':
        return 'purple';
      default:
        return 'default';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'FAILED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getRideTimeline = (ride: Ride) => {
    const items = [
      {
        color: 'blue',
        children: (
          <div>
            <Text strong>Ride Requested</Text>
            <br />
            <Text type="secondary">
              {new Date(ride.createdAt).toLocaleString()}
            </Text>
          </div>
        ),
      },
    ];

    if (ride.acceptedAt) {
      items.push({
        color: 'green',
        children: (
          <div>
            <Text strong>Driver Accepted</Text>
            <br />
            <Text type="secondary">
              {new Date(ride.acceptedAt).toLocaleString()}
            </Text>
          </div>
        ),
      });
    }

    if (ride.startedAt) {
      items.push({
        color: 'orange',
        children: (
          <div>
            <Text strong>Ride Started</Text>
            <br />
            <Text type="secondary">
              {new Date(ride.startedAt).toLocaleString()}
            </Text>
          </div>
        ),
      });
    }

    if (ride.completedAt) {
      items.push({
        color: 'green',
        children: (
          <div>
            <Text strong>Ride Completed</Text>
            <br />
            <Text type="secondary">
              {new Date(ride.completedAt).toLocaleString()}
            </Text>
          </div>
        ),
      });
    }

    if (ride.cancelledAt) {
      items.push({
        color: 'red',
        children: (
          <div>
            <Text strong>Ride Cancelled</Text>
            <br />
            <Text type="secondary">
              {new Date(ride.cancelledAt).toLocaleString()}
            </Text>
            {ride.cancellationReason && (
              <>
                <br />
                <Text type="secondary">Reason: {ride.cancellationReason}</Text>
              </>
            )}
          </div>
        ),
      });
    }

    return items;
  };

  const columns: ColumnsType<Ride> = [
    {
      title: 'Ride ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => (
        <Text code style={{ fontSize: '12px' }}>
          {id.substring(0, 8)}...
        </Text>
      ),
    },
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} size="small" />
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
              {record.user.firstName} {record.user.lastName}
            </div>
            <div style={{ color: '#666', fontSize: '11px' }}>
              {record.user.email}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Driver',
      key: 'driver',
      render: (_, record) => (
        record.driver ? (
          <Space>
            <Avatar icon={<CarOutlined />} size="small" />
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
                {record.driver.firstName} {record.driver.lastName}
              </div>
              <div style={{ color: '#666', fontSize: '11px' }}>
                {record.driver.email}
              </div>
            </div>
          </Space>
        ) : (
          <Text type="secondary">Not assigned</Text>
        )
      ),
    },
    {
      title: 'Route',
      key: 'route',
      render: (_, record) => (
        <div style={{ maxWidth: '200px' }}>
          <div style={{ fontSize: '12px' }}>
            <Text strong>From:</Text> {record.pickupLocation.address}
          </div>
          <div style={{ fontSize: '12px', marginTop: '4px' }}>
            <Text strong>To:</Text> {record.dropoffLocation.address}
          </div>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'rideType',
      key: 'rideType',
      render: (type: string) => (
        <Tag color={getRideTypeColor(type)}>{type}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status.replace('_', ' ')}</Tag>
      ),
    },
    {
      title: 'Fare',
      dataIndex: 'fare',
      key: 'fare',
      render: (fare: number) => `$${fare.toFixed(2)}`,
      sorter: (a, b) => a.fare - b.fare,
    },
    {
      title: 'Payment',
      key: 'payment',
      render: (_, record) => (
        <div>
          <Tag>{record.paymentMethod}</Tag>
          <br />
          <Tag color={getPaymentStatusColor(record.paymentStatus)}>
            {record.paymentStatus}
          </Tag>
        </div>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          icon={<EyeOutlined />}
          size="small"
          onClick={() => openRideModal(record)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Rides"
              value={stats.total}
              prefix={<RocketOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Completed"
              value={stats.completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="In Progress"
              value={stats.inProgress}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Cancelled"
              value={stats.cancelled}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <Title level={3} style={{ margin: 0 }}>
            Rides Management
          </Title>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchRides}
            loading={loading}
          >
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div style={{ marginBottom: '16px' }}>
          <Space wrap>
            <Input
              placeholder="Search rides..."
              prefix={<SearchOutlined />}
              style={{ width: 250 }}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
            />
            <Select
              placeholder="Filter by status"
              style={{ width: 150 }}
              allowClear
              onChange={(value) => setFilters({ ...filters, status: value })}
            >
              <Option value="REQUESTED">Requested</Option>
              <Option value="ACCEPTED">Accepted</Option>
              <Option value="DRIVER_ARRIVED">Driver Arrived</Option>
              <Option value="IN_PROGRESS">In Progress</Option>
              <Option value="COMPLETED">Completed</Option>
              <Option value="CANCELLED">Cancelled</Option>
            </Select>
            <Select
              placeholder="Filter by type"
              style={{ width: 130 }}
              allowClear
              onChange={(value) => setFilters({ ...filters, rideType: value })}
            >
              <Option value="ECONOMY">Economy</Option>
              <Option value="COMFORT">Comfort</Option>
              <Option value="PREMIUM">Premium</Option>
            </Select>
            <Select
              placeholder="Payment status"
              style={{ width: 140 }}
              allowClear
              onChange={(value) => setFilters({ ...filters, paymentStatus: value })}
            >
              <Option value="PENDING">Pending</Option>
              <Option value="COMPLETED">Completed</Option>
              <Option value="FAILED">Failed</Option>
            </Select>
            <RangePicker
              placeholder={['Start Date', 'End Date']}
              onChange={(dates, dateStrings) =>
                setFilters({
                  ...filters,
                  dateRange: dateStrings as [string, string],
                })
              }
            />
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={rides}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} rides`,
          }}
        />
      </Card>

      {/* Ride Details Modal */}
      <Modal
        title="Ride Details"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={900}
      >
        {selectedRide && (
          <div>
            <Row gutter={24}>
              <Col span={12}>
                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label="Ride ID">
                    {selectedRide.id}
                  </Descriptions.Item>
                  <Descriptions.Item label="User">
                    {selectedRide.user.firstName} {selectedRide.user.lastName}
                    <br />
                    <Text type="secondary">{selectedRide.user.email}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Driver">
                    {selectedRide.driver ? (
                      <>
                        {selectedRide.driver.firstName} {selectedRide.driver.lastName}
                        <br />
                        <Text type="secondary">{selectedRide.driver.email}</Text>
                      </>
                    ) : (
                      <Text type="secondary">Not assigned</Text>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Pickup Location">
                    {selectedRide.pickupLocation.address}
                  </Descriptions.Item>
                  <Descriptions.Item label="Dropoff Location">
                    {selectedRide.dropoffLocation.address}
                  </Descriptions.Item>
                  <Descriptions.Item label="Ride Type">
                    <Tag color={getRideTypeColor(selectedRide.rideType)}>
                      {selectedRide.rideType}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Status">
                    <Tag color={getStatusColor(selectedRide.status)}>
                      {selectedRide.status.replace('_', ' ')}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Fare">
                    ${selectedRide.fare.toFixed(2)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Distance">
                    {selectedRide.distance.toFixed(2)} km
                  </Descriptions.Item>
                  <Descriptions.Item label="Duration">
                    {Math.round(selectedRide.duration)} minutes
                  </Descriptions.Item>
                  <Descriptions.Item label="Payment Method">
                    <Tag>{selectedRide.paymentMethod}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Payment Status">
                    <Tag color={getPaymentStatusColor(selectedRide.paymentStatus)}>
                      {selectedRide.paymentStatus}
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>
              </Col>
              <Col span={12}>
                <Title level={4}>Ride Timeline</Title>
                <Timeline items={getRideTimeline(selectedRide)} />
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RidesPage;