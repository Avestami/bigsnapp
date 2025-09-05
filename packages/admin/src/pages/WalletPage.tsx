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
  Avatar,
  Statistic,
  Row,
  Col,
  Tabs,
  Form,
  InputNumber,
} from 'antd';
import {
  WalletOutlined,
  SearchOutlined,
  EyeOutlined,
  ReloadOutlined,
  UserOutlined,
  DollarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CreditCardOutlined,
  BankOutlined,
  PlusOutlined,
  MinusOutlined,
} from '@ant-design/icons';
import { adminApi } from '../services/api';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;
import { DatePicker } from 'antd';

interface WalletTransaction {
  id: string;
  userId: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  paymentMethod?: 'CARD' | 'BANK_TRANSFER' | 'CASH';
  referenceId?: string;
  rideId?: string;
  deliveryId?: string;
  createdAt: string;
  completedAt?: string;
}

interface UserWallet {
  id: string;
  userId: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  balance: number;
  totalEarnings: number;
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
}

interface WalletFilters {
  search?: string;
  type?: string;
  status?: string;
  paymentMethod?: string;
  dateRange?: [string, string];
}

const WalletPage: React.FC = () => {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [wallets, setWallets] = useState<UserWallet[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<WalletTransaction | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<UserWallet | null>(null);
  const [isTransactionModalVisible, setIsTransactionModalVisible] = useState(false);
  const [isWalletModalVisible, setIsWalletModalVisible] = useState(false);
  const [isAdjustBalanceModalVisible, setIsAdjustBalanceModalVisible] = useState(false);
  const [filters, setFilters] = useState<WalletFilters>({});
  const [activeTab, setActiveTab] = useState('transactions');
  const [form] = Form.useForm();
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalVolume: 0,
    pendingTransactions: 0,
    failedTransactions: 0,
    totalWalletBalance: 0,
    activeWallets: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [transactionsResponse, walletsResponse, statsResponse] = await Promise.all([
        adminApi.getWalletTransactions(filters),
        adminApi.getUserWallets(),
        adminApi.getWalletStats(),
      ]);
      setTransactions(transactionsResponse.data);
      setWallets(walletsResponse.data);
      setStats(statsResponse.data);
    } catch (error) {
      message.error('Failed to fetch wallet data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters, activeTab]);

  const openTransactionModal = (transaction: WalletTransaction) => {
    setSelectedTransaction(transaction);
    setIsTransactionModalVisible(true);
  };

  const openWalletModal = (wallet: UserWallet) => {
    setSelectedWallet(wallet);
    setIsWalletModalVisible(true);
  };

  const openAdjustBalanceModal = (wallet: UserWallet) => {
    setSelectedWallet(wallet);
    form.setFieldsValue({
      userId: wallet.userId,
      currentBalance: wallet.balance,
      adjustmentType: 'CREDIT',
      amount: 0,
      description: '',
    });
    setIsAdjustBalanceModalVisible(true);
  };

  const handleAdjustBalance = async (values: any) => {
    try {
      await adminApi.adjustWalletBalance({
        userId: values.userId,
        type: values.adjustmentType,
        amount: values.amount,
        description: values.description,
      });
      message.success('Wallet balance adjusted successfully');
      setIsAdjustBalanceModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      message.error('Failed to adjust wallet balance');
    }
  };

  const getTransactionTypeColor = (type: string) => {
    return type === 'CREDIT' ? 'success' : 'error';
  };

  const getStatusColor = (status: string) => {
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

  const getPaymentMethodIcon = (method?: string) => {
    switch (method) {
      case 'CARD':
        return <CreditCardOutlined />;
      case 'BANK_TRANSFER':
        return <BankOutlined />;
      case 'CASH':
        return <DollarOutlined />;
      default:
        return <WalletOutlined />;
    }
  };

  const transactionColumns: ColumnsType<WalletTransaction> = [
    {
      title: 'Transaction ID',
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
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag
          color={getTransactionTypeColor(type)}
          icon={type === 'CREDIT' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
        >
          {type}
        </Tag>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number, record) => (
        <Text
          style={{
            color: record.type === 'CREDIT' ? '#52c41a' : '#ff4d4f',
            fontWeight: 'bold',
          }}
        >
          {record.type === 'CREDIT' ? '+' : '-'}${amount.toFixed(2)}
        </Text>
      ),
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (description: string) => (
        <Text style={{ fontSize: '12px' }}>
          {description.length > 40
            ? `${description.substring(0, 40)}...`
            : description}
        </Text>
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
      title: 'Payment Method',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (method?: string) => (
        method ? (
          <Tag icon={getPaymentMethodIcon(method)}>
            {method.replace('_', ' ')}
          </Tag>
        ) : (
          <Text type="secondary">-</Text>
        )
      ),
    },
    {
      title: 'Date',
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
          onClick={() => openTransactionModal(record)}
        >
          View
        </Button>
      ),
    },
  ];

  const walletColumns: ColumnsType<UserWallet> = [
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
      title: 'Current Balance',
      dataIndex: 'balance',
      key: 'balance',
      render: (balance: number) => (
        <Text style={{ fontWeight: 'bold', fontSize: '14px' }}>
          ${balance.toFixed(2)}
        </Text>
      ),
      sorter: (a, b) => a.balance - b.balance,
    },
    {
      title: 'Total Earnings',
      dataIndex: 'totalEarnings',
      key: 'totalEarnings',
      render: (earnings: number) => (
        <Text style={{ color: '#52c41a' }}>
          ${earnings.toFixed(2)}
        </Text>
      ),
      sorter: (a, b) => a.totalEarnings - b.totalEarnings,
    },
    {
      title: 'Total Spent',
      dataIndex: 'totalSpent',
      key: 'totalSpent',
      render: (spent: number) => (
        <Text style={{ color: '#ff4d4f' }}>
          ${spent.toFixed(2)}
        </Text>
      ),
      sorter: (a, b) => a.totalSpent - b.totalSpent,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => openWalletModal(record)}
          >
            View
          </Button>
          <Button
            icon={<WalletOutlined />}
            size="small"
            onClick={() => openAdjustBalanceModal(record)}
          >
            Adjust
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={4}>
          <Card>
            <Statistic
              title="Total Transactions"
              value={stats.totalTransactions}
              prefix={<WalletOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Total Volume"
              value={stats.totalVolume}
              prefix={<DollarOutlined />}
              formatter={(value) => `$${Number(value).toFixed(2)}`}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Pending"
              value={stats.pendingTransactions}
              prefix={<ArrowUpOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Failed"
              value={stats.failedTransactions}
              prefix={<ArrowDownOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Total Wallet Balance"
              value={stats.totalWalletBalance}
              prefix={<BankOutlined />}
              formatter={(value) => `$${Number(value).toFixed(2)}`}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Active Wallets"
              value={stats.activeWallets}
              prefix={<UserOutlined />}
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
            Wallet & Payments Management
          </Title>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchData}
            loading={loading}
          >
            Refresh
          </Button>
        </div>

        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Transactions" key="transactions">
            {/* Filters */}
            <div style={{ marginBottom: '16px' }}>
              <Space wrap>
                <Input
                  placeholder="Search transactions..."
                  prefix={<SearchOutlined />}
                  style={{ width: 250 }}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                />
                <Select
                  placeholder="Filter by type"
                  style={{ width: 120 }}
                  allowClear
                  onChange={(value) => setFilters({ ...filters, type: value })}
                >
                  <Option value="CREDIT">Credit</Option>
                  <Option value="DEBIT">Debit</Option>
                </Select>
                <Select
                  placeholder="Filter by status"
                  style={{ width: 130 }}
                  allowClear
                  onChange={(value) => setFilters({ ...filters, status: value })}
                >
                  <Option value="PENDING">Pending</Option>
                  <Option value="COMPLETED">Completed</Option>
                  <Option value="FAILED">Failed</Option>
                </Select>
                <Select
                  placeholder="Payment method"
                  style={{ width: 150 }}
                  allowClear
                  onChange={(value) => setFilters({ ...filters, paymentMethod: value })}
                >
                  <Option value="CARD">Card</Option>
                  <Option value="BANK_TRANSFER">Bank Transfer</Option>
                  <Option value="CASH">Cash</Option>
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
              columns={transactionColumns}
              dataSource={transactions}
              rowKey="id"
              loading={loading}
              scroll={{ x: 1200 }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} transactions`,
              }}
            />
          </TabPane>

          <TabPane tab="User Wallets" key="wallets">
            <Table
              columns={walletColumns}
              dataSource={wallets}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} wallets`,
              }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* Transaction Details Modal */}
      <Modal
        title="Transaction Details"
        open={isTransactionModalVisible}
        onCancel={() => setIsTransactionModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsTransactionModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={600}
      >
        {selectedTransaction && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Transaction ID">
              {selectedTransaction.id}
            </Descriptions.Item>
            <Descriptions.Item label="User">
              {selectedTransaction.user.firstName} {selectedTransaction.user.lastName}
              <br />
              <Text type="secondary">{selectedTransaction.user.email}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Type">
              <Tag
                color={getTransactionTypeColor(selectedTransaction.type)}
                icon={selectedTransaction.type === 'CREDIT' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              >
                {selectedTransaction.type}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Amount">
              <Text
                style={{
                  color: selectedTransaction.type === 'CREDIT' ? '#52c41a' : '#ff4d4f',
                  fontWeight: 'bold',
                  fontSize: '16px',
                }}
              >
                {selectedTransaction.type === 'CREDIT' ? '+' : '-'}${selectedTransaction.amount.toFixed(2)}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Description">
              {selectedTransaction.description}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={getStatusColor(selectedTransaction.status)}>
                {selectedTransaction.status}
              </Tag>
            </Descriptions.Item>
            {selectedTransaction.paymentMethod && (
              <Descriptions.Item label="Payment Method">
                <Tag icon={getPaymentMethodIcon(selectedTransaction.paymentMethod)}>
                  {selectedTransaction.paymentMethod.replace('_', ' ')}
                </Tag>
              </Descriptions.Item>
            )}
            {selectedTransaction.referenceId && (
              <Descriptions.Item label="Reference ID">
                {selectedTransaction.referenceId}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Created At">
              {new Date(selectedTransaction.createdAt).toLocaleString()}
            </Descriptions.Item>
            {selectedTransaction.completedAt && (
              <Descriptions.Item label="Completed At">
                {new Date(selectedTransaction.completedAt).toLocaleString()}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* Wallet Details Modal */}
      <Modal
        title="Wallet Details"
        open={isWalletModalVisible}
        onCancel={() => setIsWalletModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsWalletModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={600}
      >
        {selectedWallet && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Wallet ID">
              {selectedWallet.id}
            </Descriptions.Item>
            <Descriptions.Item label="User">
              {selectedWallet.user.firstName} {selectedWallet.user.lastName}
              <br />
              <Text type="secondary">{selectedWallet.user.email}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Current Balance">
              <Text style={{ fontWeight: 'bold', fontSize: '18px' }}>
                ${selectedWallet.balance.toFixed(2)}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Total Earnings">
              <Text style={{ color: '#52c41a', fontSize: '16px' }}>
                ${selectedWallet.totalEarnings.toFixed(2)}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Total Spent">
              <Text style={{ color: '#ff4d4f', fontSize: '16px' }}>
                ${selectedWallet.totalSpent.toFixed(2)}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Created At">
              {new Date(selectedWallet.createdAt).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="Last Updated">
              {new Date(selectedWallet.updatedAt).toLocaleString()}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Adjust Balance Modal */}
      <Modal
        title="Adjust Wallet Balance"
        open={isAdjustBalanceModalVisible}
        onCancel={() => {
          setIsAdjustBalanceModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAdjustBalance}
        >
          <Form.Item label="User" name="userId">
            <Input disabled />
          </Form.Item>
          <Form.Item label="Current Balance" name="currentBalance">
            <InputNumber
              disabled
              style={{ width: '100%' }}
              formatter={(value) => `$ ${value}`}
            />
          </Form.Item>
          <Form.Item
            label="Adjustment Type"
            name="adjustmentType"
            rules={[{ required: true, message: 'Please select adjustment type' }]}
          >
            <Select>
              <Option value="CREDIT">
                <Space>
                  <PlusOutlined style={{ color: '#52c41a' }} />
                  Credit (Add Money)
                </Space>
              </Option>
              <Option value="DEBIT">
                <Space>
                  <MinusOutlined style={{ color: '#ff4d4f' }} />
                  Debit (Deduct Money)
                </Space>
              </Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="Amount"
            name="amount"
            rules={[
              { required: true, message: 'Please enter amount' },
              { type: 'number', min: 0.01, message: 'Amount must be greater than 0' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              formatter={(value) => `$ ${value}`}
              parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
              step={0.01}
              precision={2}
            />
          </Form.Item>
          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Enter reason for balance adjustment..."
            />
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setIsAdjustBalanceModalVisible(false);
                form.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Adjust Balance
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default WalletPage;