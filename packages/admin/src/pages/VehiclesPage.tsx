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
  Popconfirm,
  Image,
  Descriptions,
  Avatar,
} from 'antd';
import {
  CarOutlined,
  SearchOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  ReloadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { adminApi } from '../services/api';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { Option } = Select;

interface Vehicle {
  id: string;
  driverId: string;
  driver: {
    firstName: string;
    lastName: string;
    email: string;
  };
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  type: 'CAR' | 'MOTORCYCLE' | 'BICYCLE';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  registrationNumber: string;
  insuranceNumber: string;
  insuranceExpiry: string;
  inspectionExpiry: string;
  createdAt: string;
  documents: {
    vehiclePhoto?: string;
    registrationDocument?: string;
    insuranceDocument?: string;
    inspectionCertificate?: string;
  };
}

interface VehicleFilters {
  search?: string;
  status?: string;
  type?: string;
}

const VehiclesPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [filters, setFilters] = useState<VehicleFilters>({});

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getVehicles(filters);
      setVehicles(response.data);
    } catch (error) {
      message.error('Failed to fetch vehicles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [filters]);

  const handleVehicleAction = async (vehicleId: string, action: 'approve' | 'reject') => {
    try {
      await adminApi.updateVehicleStatus(vehicleId, action);
      message.success(`Vehicle ${action}d successfully`);
      fetchVehicles();
    } catch (error) {
      message.error(`Failed to ${action} vehicle`);
    }
  };

  const openVehicleModal = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
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

  const isDocumentExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  const columns: ColumnsType<Vehicle> = [
    {
      title: 'Vehicle',
      key: 'vehicle',
      render: (_, record) => (
        <Space>
          <Avatar
            src={record.documents.vehiclePhoto}
            icon={<CarOutlined />}
            shape="square"
            size="large"
          />
          <div>
            <div style={{ fontWeight: 'bold' }}>
              {record.make} {record.model} ({record.year})
            </div>
            <div style={{ color: '#666', fontSize: '12px' }}>
              {record.color} • {record.licensePlate}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Driver',
      key: 'driver',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>
            {record.driver.firstName} {record.driver.lastName}
          </div>
          <div style={{ color: '#666', fontSize: '12px' }}>
            {record.driver.email}
          </div>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
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
      title: 'Registration',
      dataIndex: 'registrationNumber',
      key: 'registrationNumber',
    },
    {
      title: 'Insurance Expiry',
      dataIndex: 'insuranceExpiry',
      key: 'insuranceExpiry',
      render: (date: string) => {
        const expired = isDocumentExpired(date);
        return (
          <Text type={expired ? 'danger' : undefined}>
            {new Date(date).toLocaleDateString()}
            {expired && ' (Expired)'}
          </Text>
        );
      },
    },
    {
      title: 'Inspection Expiry',
      dataIndex: 'inspectionExpiry',
      key: 'inspectionExpiry',
      render: (date: string) => {
        const expired = isDocumentExpired(date);
        return (
          <Text type={expired ? 'danger' : undefined}>
            {new Date(date).toLocaleDateString()}
            {expired && ' (Expired)'}
          </Text>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => openVehicleModal(record)}
          >
            View
          </Button>
          {record.status === 'PENDING' && (
            <>
              <Button
                icon={<CheckOutlined />}
                size="small"
                type="primary"
                onClick={() => handleVehicleAction(record.id, 'approve')}
              >
                Approve
              </Button>
              <Button
                icon={<CloseOutlined />}
                size="small"
                danger
                onClick={() => handleVehicleAction(record.id, 'reject')}
              >
                Reject
              </Button>
            </>
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
            Vehicles Management
          </Title>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchVehicles}
            loading={loading}
          >
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div style={{ marginBottom: '16px' }}>
          <Space wrap>
            <Input
              placeholder="Search vehicles..."
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
            </Select>
            <Select
              placeholder="Filter by type"
              style={{ width: 150 }}
              allowClear
              onChange={(value) => setFilters({ ...filters, type: value })}
            >
              <Option value="CAR">Car</Option>
              <Option value="MOTORCYCLE">Motorcycle</Option>
              <Option value="BICYCLE">Bicycle</Option>
            </Select>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={vehicles}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} vehicles`,
          }}
        />
      </Card>

      {/* Vehicle Details Modal */}
      <Modal
        title="Vehicle Details"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            Close
          </Button>,
          selectedVehicle?.status === 'PENDING' && (
            <Space key="actions">
              <Button
                key="approve"
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => {
                  if (selectedVehicle) {
                    handleVehicleAction(selectedVehicle.id, 'approve');
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
                  if (selectedVehicle) {
                    handleVehicleAction(selectedVehicle.id, 'reject');
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
        {selectedVehicle && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Make & Model">
                {selectedVehicle.make} {selectedVehicle.model}
              </Descriptions.Item>
              <Descriptions.Item label="Year">
                {selectedVehicle.year}
              </Descriptions.Item>
              <Descriptions.Item label="Color">
                {selectedVehicle.color}
              </Descriptions.Item>
              <Descriptions.Item label="License Plate">
                {selectedVehicle.licensePlate}
              </Descriptions.Item>
              <Descriptions.Item label="Type">
                <Tag color={getVehicleTypeColor(selectedVehicle.type)}>
                  {selectedVehicle.type}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(selectedVehicle.status)}>
                  {selectedVehicle.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Registration Number">
                {selectedVehicle.registrationNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Insurance Number">
                {selectedVehicle.insuranceNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Insurance Expiry">
                <Text
                  type={
                    isDocumentExpired(selectedVehicle.insuranceExpiry)
                      ? 'danger'
                      : undefined
                  }
                >
                  {new Date(selectedVehicle.insuranceExpiry).toLocaleDateString()}
                  {isDocumentExpired(selectedVehicle.insuranceExpiry) &&
                    ' (Expired)'}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Inspection Expiry">
                <Text
                  type={
                    isDocumentExpired(selectedVehicle.inspectionExpiry)
                      ? 'danger'
                      : undefined
                  }
                >
                  {new Date(selectedVehicle.inspectionExpiry).toLocaleDateString()}
                  {isDocumentExpired(selectedVehicle.inspectionExpiry) &&
                    ' (Expired)'}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Driver">
                {selectedVehicle.driver.firstName} {selectedVehicle.driver.lastName}
                <br />
                <Text type="secondary">{selectedVehicle.driver.email}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Registered">
                {new Date(selectedVehicle.createdAt).toLocaleDateString()}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: '24px' }}>
              <Title level={4}>Documents</Title>
              <Space wrap size="large">
                {selectedVehicle.documents.vehiclePhoto && (
                  <div>
                    <Text strong>Vehicle Photo</Text>
                    <br />
                    <Image
                      width={200}
                      height={150}
                      src={selectedVehicle.documents.vehiclePhoto}
                      style={{ objectFit: 'cover', borderRadius: '8px' }}
                    />
                  </div>
                )}
                {selectedVehicle.documents.registrationDocument && (
                  <div>
                    <Text strong>Registration Document</Text>
                    <br />
                    <Image
                      width={150}
                      height={100}
                      src={selectedVehicle.documents.registrationDocument}
                      style={{ objectFit: 'cover', borderRadius: '8px' }}
                    />
                  </div>
                )}
                {selectedVehicle.documents.insuranceDocument && (
                  <div>
                    <Text strong>Insurance Document</Text>
                    <br />
                    <Image
                      width={150}
                      height={100}
                      src={selectedVehicle.documents.insuranceDocument}
                      style={{ objectFit: 'cover', borderRadius: '8px' }}
                    />
                  </div>
                )}
                {selectedVehicle.documents.inspectionCertificate && (
                  <div>
                    <Text strong>Inspection Certificate</Text>
                    <br />
                    <Image
                      width={150}
                      height={100}
                      src={selectedVehicle.documents.inspectionCertificate}
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

export default VehiclesPage;