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
  SendOutlined,
  SearchOutlined,
  EyeOutlined,
  ReloadOutlined,
  UserOutlined,
  CarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  BoxPlotOutlined,
} from '@ant-design/icons';
import { adminApi } from '../services/api';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
import { DatePicker } from 'antd';

interface Delivery {
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
  packageType: 'DOCUMENT' | 'SMALL_PACKAGE' | 'MEDIUM_PACKAGE' | 'LARGE_PACKAGE' | 'FRAGILE';
  packageDescription: string;
  recipientName: string;
  recipientPhone: string;
  status: 'REQUESTED' | 'ACCEPTED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  deliveryFee: number;
  distance: number;
  estimatedDuration: number;
  paymentMethod: 'CASH' | 'CARD' | 'WALLET';
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  acceptedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  deliveryInstructions?: string;
}

interface DeliveryFilters {
  search?: string;
  status?: string;
  packageType?: string;
  paymentStatus?: string;
  dateRange?: [string, string];
}

const DeliveriesPage: React.FC = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [filters, setFilters] = useState<DeliveryFilters>({});
  const [stats, setStats] = useState({
    total: 0,
    delivered: 0,
    cancelled: 0,
    inTransit: 0,
  });

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const [deliveriesResponse, statsResponse] = await Promise.all([
        adminApi.getDeliveries(filters),
        adminApi.getDeliveryStats(),
      ]);
      setDeliveries(deliveriesResponse.data);
      setStats(statsResponse.data);
    } catch (error) {
      message.error('Failed to fetch deliveries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, [filters]);

  const openDeliveryModal = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setIsModalVisible(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'success';
      case 'IN_TRANSIT':
      case 'PICKED_UP':
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

  const getPackageTypeColor = (type: string) => {
    switch (type) {
      case 'DOCUMENT':
        return 'blue';
      case 'SMALL_PACKAGE':
        return 'green';
      case 'MEDIUM_PACKAGE':
        return 'orange';
      case 'LARGE_PACKAGE':
        return 'red';
      case 'FRAGILE':
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

  const getDeliveryTimeline = (delivery: Delivery) => {
    const items = [
      {
        color: 'blue',
        children: (
          <div>
            <Text strong>Delivery Requested</Text>
            <br />
            <Text type="secondary">
              {new Date(delivery.createdAt).toLocaleString()}
            </Text>
          </div>
        ),
      },
    ];

    if (delivery.acceptedAt) {
      items.push({
        color: 'green',
        children: (
          <div>
            <Text strong>Driver Accepted</Text>
            <br />
            <Text type="secondary">
              {new Date(delivery.acceptedAt).toLocaleString()}
            </Text>
          </div>
        ),
      });
    }

    if (delivery.pickedUpAt) {
      items.push({
        color: 'orange',
        children: (
          <div>
            <Text strong>Package Picked Up</Text>
            <br />
            <Text type="secondary">
              {new Date(delivery.pickedUpAt).toLocaleString()}
            </Text>
          </div>
        ),
      });
    }

    if (delivery.deliveredAt) {
      items.push({
        color: 'green',
        children: (
          <div>
            <Text strong>Package Delivered</Text>
            <br />
            <Text type="secondary">
              {new Date(delivery.deliveredAt).toLocaleString()}
            </Text>
          </div>
        ),
      });
    }

    if (delivery.cancelledAt) {
      items.push({
        color: 'red',
        children: (
          <div>
            <Text strong>Delivery Cancelled</Text>
            <br />
            <Text type="secondary">
              {new Date(delivery.cancelledAt).toLocaleString()}
            </Text>
            {delivery.cancellationReason && (
              <>
                <br />
                <Text type="secondary">Reason: {delivery.cancellationReason}</Text>
              </>
            )}
          </div>
        ),
      });
    }

    return items;
  };

  const columns: ColumnsType<Delivery> = [
    {
      title: 'Delivery ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => (
        <Text code style={{ fontSize: '12px' }}>
          {id.substring(0, 8)}...
        </Text>
      ),
    },
    {
      title: 'Sender',
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
      title: 'Package',
      key: 'package',
      render: (_, record) => (
        <div>
          <Tag color={getPackageTypeColor(record.packageType)} icon={<BoxPlotOutlined />}>
            {record.packageType.replace('_', ' ')}
          </Tag>
          <br />
          <Text style={{ fontSize: '11px' }} type="secondary">
            {record.packageDescription.length > 30
              ? `${record.packageDescription.substring(0, 30)}...`
              : record.packageDescription}
          </Text>
        </div>
      ),
    },
    {
      title: 'Recipient',
      key: 'recipient',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
            {record.recipientName}
          </div>
          <div style={{ color: '#666', fontSize: '11px' }}>
            {record.recipientPhone}
          </div>
        </div>
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
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status.replace('_', ' ')}</Tag>
      ),
    },
    {
      title: 'Fee',
      dataIndex: 'deliveryFee',
      key: 'deliveryFee',
      render: (fee: number) => `$${fee.toFixed(2)}`,
      sorter: (a, b) => a.deliveryFee - b.deliveryFee,
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
          onClick={() => openDeliveryModal(record)}
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
              title="Total Deliveries"
              value={stats.total}
              prefix={<SendOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Delivered"
              value={stats.delivered}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="In Transit"
              value={stats.inTransit}
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
            Deliveries Management
          </Title>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchDeliveries}
            loading={loading}
          >
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div style={{ marginBottom: '16px' }}>
          <Space wrap>
            <Input
              placeholder="Search deliveries..."
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
              <Option value="PICKED_UP">Picked Up</Option>
              <Option value="IN_TRANSIT">In Transit</Option>
              <Option value="DELIVERED">Delivered</Option>
              <Option value="CANCELLED">Cancelled</Option>
            </Select>
            <Select
              placeholder="Filter by package type"
              style={{ width: 160 }}
              allowClear
              onChange={(value) => setFilters({ ...filters, packageType: value })}
            >
              <Option value="DOCUMENT">Document</Option>
              <Option value="SMALL_PACKAGE">Small Package</Option>
              <Option value="MEDIUM_PACKAGE">Medium Package</Option>
              <Option value="LARGE_PACKAGE">Large Package</Option>
              <Option value="FRAGILE">Fragile</Option>
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
          dataSource={deliveries}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1400 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} deliveries`,
          }}
        />
      </Card>

      {/* Delivery Details Modal */}
      <Modal
        title="Delivery Details"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={900}
      >
        {selectedDelivery && (
          <div>
            <Row gutter={24}>
              <Col span={12}>
                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label="Delivery ID">
                    {selectedDelivery.id}
                  </Descriptions.Item>
                  <Descriptions.Item label="Sender">
                    {selectedDelivery.user.firstName} {selectedDelivery.user.lastName}
                    <br />
                    <Text type="secondary">{selectedDelivery.user.email}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Driver">
                    {selectedDelivery.driver ? (
                      <>
                        {selectedDelivery.driver.firstName} {selectedDelivery.driver.lastName}
                        <br />
                        <Text type="secondary">{selectedDelivery.driver.email}</Text>
                      </>
                    ) : (
                      <Text type="secondary">Not assigned</Text>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Package Type">
                    <Tag color={getPackageTypeColor(selectedDelivery.packageType)}>
                      {selectedDelivery.packageType.replace('_', ' ')}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Package Description">
                    {selectedDelivery.packageDescription}
                  </Descriptions.Item>
                  <Descriptions.Item label="Recipient">
                    {selectedDelivery.recipientName}
                    <br />
                    <Text type="secondary">{selectedDelivery.recipientPhone}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Pickup Location">
                    {selectedDelivery.pickupLocation.address}
                  </Descriptions.Item>
                  <Descriptions.Item label="Dropoff Location">
                    {selectedDelivery.dropoffLocation.address}
                  </Descriptions.Item>
                  <Descriptions.Item label="Status">
                    <Tag color={getStatusColor(selectedDelivery.status)}>
                      {selectedDelivery.status.replace('_', ' ')}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Delivery Fee">
                    ${selectedDelivery.deliveryFee.toFixed(2)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Distance">
                    {selectedDelivery.distance.toFixed(2)} km
                  </Descriptions.Item>
                  <Descriptions.Item label="Estimated Duration">
                    {Math.round(selectedDelivery.estimatedDuration)} minutes
                  </Descriptions.Item>
                  <Descriptions.Item label="Payment Method">
                    <Tag>{selectedDelivery.paymentMethod}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Payment Status">
                    <Tag color={getPaymentStatusColor(selectedDelivery.paymentStatus)}>
                      {selectedDelivery.paymentStatus}
                    </Tag>
                  </Descriptions.Item>
                  {selectedDelivery.deliveryInstructions && (
                    <Descriptions.Item label="Delivery Instructions">
                      {selectedDelivery.deliveryInstructions}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Col>
              <Col span={12}>
                <Title level={4}>Delivery Timeline</Title>
                <Timeline items={getDeliveryTimeline(selectedDelivery)} />
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DeliveriesPage;