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
  Form,
  message,
  Avatar,
  Typography,
  Popconfirm,
  Rate,
  Image,
  Descriptions,
} from 'antd';
import {
  UserOutlined,
  SearchOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  ReloadOutlined,
  CarOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { adminApi } from '../services/api';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { Option } = Select;

interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  licenseNumber: string;
  licenseExpiry: string;
  vehicleType: 'CAR' | 'MOTORCYCLE' | 'BICYCLE';
  rating: number;
  totalRides: number;
  totalEarnings: number;
  createdAt: string;
  documents: {
    licensePhoto?: string;
    vehicleRegistration?: string;
    insurance?: string;
    profilePhoto?: string;
  };
}

interface DriverFilters {
  search?: string;
  status?: string;
  vehicleType?: string;
}

const DriversPage: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [filters, setFilters] = useState<DriverFilters>({});

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getDrivers(filters);
      setDrivers(response.data);
    } catch (error) {
      message.error('Failed to fetch drivers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [filters]);

  const handleDriverAction = async (driverId: string, action: 'approve' | 'reject' | 'suspend') => {
    try {
      await adminApi.updateDriverStatus(driverId, action);
      message.success(`Driver ${action}d successfully`);
      fetchDrivers();
    } catch (error) {
      message.error(`Failed to ${action} driver`);
    }
  };

  const openDriverModal = (driver: Driver) => {
    setSelectedDriver(driver);
    setIsModalVisible(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'REJECTED':
        return 'error';
      case 'SUSPENDED':
        return 'default';
      default:
        return 'default';
    }
  };

  const getVehicleTypeColor = (type: string) => {
    switch (type) {
      case 'CAR':
        return 'blue';
      case 'MOTORCYCLE':
        return 'orange';
      case 'BICYCLE':
        return 'green';
      default:
        return 'default';
    }
  };

  const columns: ColumnsType<Driver> = [
    {
      title: 'Driver',
      key: 'driver',
      render: (_, record) => (
        <Space>
          <Avatar
            src={record.documents.profilePhoto}
            icon={<UserOutlined />}
          />
          <div>
            <div style={{ fontWeight: 'bold' }}>
              {record.firstName} {record.lastName}
            </div>
            <div style={{ color: '#666', fontSize: '12px' }}>
              {record.email}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'License',
      dataIndex: 'licenseNumber',
      key: 'licenseNumber',
    },
    {
      title: 'Vehicle Type',
      dataIndex: 'vehicleType',
      key: 'vehicleType',
      render: (type: string) => (
        <Tag color={getVehicleTypeColor(type)} icon={<CarOutlined />}>
          {type}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating: number) => (
        <Space>
          <Rate disabled defaultValue={rating} style={{ fontSize: '14px' }} />
          <Text>({rating.toFixed(1)})</Text>
        </Space>
      ),
      sorter: (a, b) => a.rating - b.rating,
    },
    {
      title: 'Total Rides',
      dataIndex: 'totalRides',
      key: 'totalRides',
      sorter: (a, b) => a.totalRides - b.totalRides,
    },
    {
      title: 'Earnings',
      dataIndex: 'totalEarnings',
      key: 'totalEarnings',
      render: (amount: number) => `$${amount.toFixed(2)}`,
      sorter: (a, b) => a.totalEarnings - b.totalEarnings,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => openDriverModal(record)}
          >
            View
          </Button>
          {record.status === 'PENDING' && (
            <>
              <Button
                icon={<CheckOutlined />}
                size="small"
                type="primary"
                onClick={() => handleDriverAction(record.id, 'approve')}
              >
                Approve
              </Button>
              <Button
                icon={<CloseOutlined />}
                size="small"
                danger
                onClick={() => handleDriverAction(record.id, 'reject')}
              >
                Reject
              </Button>
            </>
          )}
          {record.status === 'APPROVED' && (
            <Popconfirm
              title="Are you sure you want to suspend this driver?"
              onConfirm={() => handleDriverAction(record.id, 'suspend')}
            >
              <Button size="small" danger>
                Suspend
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
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
            Drivers Management
          </Title>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchDrivers}
            loading={loading}
          >
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div style={{ marginBottom: '16px' }}>
          <Space wrap>
            <Input
              placeholder="Search drivers..."
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
              <Option value="PENDING">Pending</Option>
              <Option value="APPROVED">Approved</Option>
              <Option value="REJECTED">Rejected</Option>
              <Option value="SUSPENDED">Suspended</Option>
            </Select>
            <Select
              placeholder="Filter by vehicle type"
              style={{ width: 180 }}
              allowClear
              onChange={(value) => setFilters({ ...filters, vehicleType: value })}
            >
              <Option value="CAR">Car</Option>
              <Option value="MOTORCYCLE">Motorcycle</Option>
              <Option value="BICYCLE">Bicycle</Option>
            </Select>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={drivers}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} drivers`,
          }}
        />
      </Card>

      {/* Driver Details Modal */}
      <Modal
        title="Driver Details"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            Close
          </Button>,
          selectedDriver?.status === 'PENDING' && (
            <Space key="actions">
              <Button
                key="approve"
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => {
                  if (selectedDriver) {
                    handleDriverAction(selectedDriver.id, 'approve');
                    setIsModalVisible(false);
                  }
                }}
              >
                Approve
              </Button>
              <Button
                key="reject"
                danger
                icon={<CloseOutlined />}
                onClick={() => {
                  if (selectedDriver) {
                    handleDriverAction(selectedDriver.id, 'reject');
                    setIsModalVisible(false);
                  }
                }}
              >
                Reject
              </Button>
            </Space>
          ),
        ]}
        width={800}
      >
        {selectedDriver && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Name">
                {selectedDriver.firstName} {selectedDriver.lastName}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {selectedDriver.email}
              </Descriptions.Item>
              <Descriptions.Item label="Phone">
                {selectedDriver.phone}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(selectedDriver.status)}>
                  {selectedDriver.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="License Number">
                {selectedDriver.licenseNumber}
              </Descriptions.Item>
              <Descriptions.Item label="License Expiry">
                {new Date(selectedDriver.licenseExpiry).toLocaleDateString()}
              </Descriptions.Item>
              <Descriptions.Item label="Vehicle Type">
                <Tag color={getVehicleTypeColor(selectedDriver.vehicleType)}>
                  {selectedDriver.vehicleType}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Rating">
                <Space>
                  <Rate disabled defaultValue={selectedDriver.rating} />
                  <Text>({selectedDriver.rating.toFixed(1)})</Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Total Rides">
                {selectedDriver.totalRides}
              </Descriptions.Item>
              <Descriptions.Item label="Total Earnings">
                ${selectedDriver.totalEarnings.toFixed(2)}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: '24px' }}>
              <Title level={4}>Documents</Title>
              <Space wrap size="large">
                {selectedDriver.documents.profilePhoto && (
                  <div>
                    <Text strong>Profile Photo</Text>
                    <br />
                    <Image
                      width={100}
                      height={100}
                      src={selectedDriver.documents.profilePhoto}
                      style={{ objectFit: 'cover', borderRadius: '8px' }}
                    />
                  </div>
                )}
                {selectedDriver.documents.licensePhoto && (
                  <div>
                    <Text strong>License Photo</Text>
                    <br />
                    <Image
                      width={150}
                      height={100}
                      src={selectedDriver.documents.licensePhoto}
                      style={{ objectFit: 'cover', borderRadius: '8px' }}
                    />
                  </div>
                )}
                {selectedDriver.documents.vehicleRegistration && (
                  <div>
                    <Text strong>Vehicle Registration</Text>
                    <br />
                    <Image
                      width={150}
                      height={100}
                      src={selectedDriver.documents.vehicleRegistration}
                      style={{ objectFit: 'cover', borderRadius: '8px' }}
                    />
                  </div>
                )}
                {selectedDriver.documents.insurance && (
                  <div>
                    <Text strong>Insurance</Text>
                    <br />
                    <Image
                      width={150}
                      height={100}
                      src={selectedDriver.documents.insurance}
                      style={{ objectFit: 'cover', borderRadius: '8px' }}
                    />
                  </div>
                )}
              </Space>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DriversPage;