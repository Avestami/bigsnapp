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
  DatePicker,
} from 'antd';
import {
  UserOutlined,
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { adminApi } from '../services/api';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
  lastLoginAt?: string;
  totalRides: number;
  totalSpent: number;
}

interface UserFilters {
  search?: string;
  status?: string;
  dateRange?: [string, string];
}

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'view' | 'edit' | 'create'>('view');
  const [filters, setFilters] = useState<UserFilters>({});
  const [form] = Form.useForm();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getUsers(filters);
      setUsers(response.data);
    } catch (error) {
      message.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const handleStatusChange = async (userId: string, status: string) => {
    try {
      await adminApi.updateUserStatus(userId, status);
      message.success('User status updated successfully');
      fetchUsers();
    } catch (error) {
      message.error('Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await adminApi.deleteUser(userId);
      message.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      message.error('Failed to delete user');
    }
  };

  const handleModalSubmit = async (values: any) => {
    try {
      if (modalType === 'create') {
        await adminApi.createUser(values);
        message.success('User created successfully');
      } else if (modalType === 'edit' && selectedUser) {
        await adminApi.updateUser(selectedUser.id, values);
        message.success('User updated successfully');
      }
      setIsModalVisible(false);
      form.resetFields();
      fetchUsers();
    } catch (error) {
      message.error(`Failed to ${modalType} user`);
    }
  };

  const openModal = (type: 'view' | 'edit' | 'create', user?: User) => {
    setModalType(type);
    setSelectedUser(user || null);
    if (user && (type === 'edit' || type === 'view')) {
      form.setFieldsValue(user);
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'INACTIVE':
        return 'default';
      case 'SUSPENDED':
        return 'error';
      default:
        return 'default';
    }
  };

  const columns: ColumnsType<User> = [
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
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
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: 'Total Rides',
      dataIndex: 'totalRides',
      key: 'totalRides',
      sorter: (a, b) => a.totalRides - b.totalRides,
    },
    {
      title: 'Total Spent',
      dataIndex: 'totalSpent',
      key: 'totalSpent',
      render: (amount: number) => `$${amount.toFixed(2)}`,
      sorter: (a, b) => a.totalSpent - b.totalSpent,
    },
    {
      title: 'Joined',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => openModal('view', record)}
          />
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => openModal('edit', record)}
          />
          <Select
            size="small"
            value={record.status}
            style={{ width: 100 }}
            onChange={(value) => handleStatusChange(record.id, value)}
          >
            <Option value="ACTIVE">Active</Option>
            <Option value="INACTIVE">Inactive</Option>
            <Option value="SUSPENDED">Suspended</Option>
          </Select>
          <Popconfirm
            title="Are you sure you want to delete this user?"
            onConfirm={() => handleDeleteUser(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
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
            Users Management
          </Title>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchUsers}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openModal('create')}
            >
              Add User
            </Button>
          </Space>
        </div>

        {/* Filters */}
        <div style={{ marginBottom: '16px' }}>
          <Space wrap>
            <Input
              placeholder="Search users..."
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
              <Option value="ACTIVE">Active</Option>
              <Option value="INACTIVE">Inactive</Option>
              <Option value="SUSPENDED">Suspended</Option>
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
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} users`,
          }}
        />
      </Card>

      {/* User Modal */}
      <Modal
        title={
          modalType === 'create'
            ? 'Create User'
            : modalType === 'edit'
            ? 'Edit User'
            : 'User Details'
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={
          modalType === 'view'
            ? [
                <Button key="close" onClick={() => setIsModalVisible(false)}>
                  Close
                </Button>,
              ]
            : [
                <Button key="cancel" onClick={() => setIsModalVisible(false)}>
                  Cancel
                </Button>,
                <Button
                  key="submit"
                  type="primary"
                  onClick={() => form.submit()}
                >
                  {modalType === 'create' ? 'Create' : 'Update'}
                </Button>,
              ]
        }
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleModalSubmit}
          disabled={modalType === 'view'}
        >
          <Form.Item
            name="firstName"
            label="First Name"
            rules={[{ required: true, message: 'Please enter first name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="lastName"
            label="Last Name"
            rules={[{ required: true, message: 'Please enter last name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter valid email' },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Phone"
            rules={[{ required: true, message: 'Please enter phone number' }]}
          >
            <Input />
          </Form.Item>
          {modalType !== 'create' && (
            <Form.Item name="status" label="Status">
              <Select>
                <Option value="ACTIVE">Active</Option>
                <Option value="INACTIVE">Inactive</Option>
                <Option value="SUSPENDED">Suspended</Option>
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default UsersPage;