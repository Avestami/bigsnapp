import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Switch,
  Button,
  Select,
  Divider,
  Row,
  Col,
  Typography,
  Space,
  message,
  Tabs,
  Upload,
  Avatar,
  Table,
  Modal,
  Tag
} from 'antd';
import {
  SaveOutlined,
  UploadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SettingOutlined,
  DollarOutlined,
  CarOutlined,
  NotificationOutlined
} from '@ant-design/icons';
import { adminApi } from '../services/api';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

interface AppSettings {
  appName: string;
  appVersion: string;
  appLogo: string;
  supportEmail: string;
  supportPhone: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  emailVerificationRequired: boolean;
  phoneVerificationRequired: boolean;
}

interface PricingSettings {
  baseFare: number;
  perKmRate: number;
  perMinuteRate: number;
  minimumFare: number;
  cancellationFee: number;
  platformCommission: number;
  deliveryBaseFare: number;
  deliveryPerKmRate: number;
  deliveryWeightMultiplier: number;
}

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  rideUpdates: boolean;
  paymentAlerts: boolean;
  systemAlerts: boolean;
}

interface VehicleType {
  id: string;
  name: string;
  icon: string;
  baseFare: number;
  perKmRate: number;
  capacity: number;
  description: string;
  active: boolean;
}

const SettingsPage: React.FC = () => {
  const [form] = Form.useForm();
  const [pricingForm] = Form.useForm();
  const [notificationForm] = Form.useForm();
  const [vehicleForm] = Form.useForm();
  
  const [loading, setLoading] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [pricingSettings, setPricingSettings] = useState<PricingSettings | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [vehicleModalVisible, setVehicleModalVisible] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleType | null>(null);

  useEffect(() => {
    fetchSettings();
    fetchVehicleTypes();
  }, []);

  const fetchSettings = async () => {
    try {
      const [appResponse, pricingResponse, notificationResponse] = await Promise.all([
        adminApi.getAppSettings(),
        adminApi.getPricingSettings(),
        adminApi.getNotificationSettings()
      ]);
      
      setAppSettings(appResponse.data);
      setPricingSettings(pricingResponse.data);
      setNotificationSettings(notificationResponse.data);
      
      form.setFieldsValue(appResponse.data);
      pricingForm.setFieldsValue(pricingResponse.data);
      notificationForm.setFieldsValue(notificationResponse.data);
    } catch (error) {
      message.error('Failed to fetch settings');
    }
  };

  const fetchVehicleTypes = async () => {
    try {
      const response = await adminApi.getVehicleTypes();
      setVehicleTypes(response.data);
    } catch (error) {
      message.error('Failed to fetch vehicle types');
    }
  };

  const handleAppSettingsSubmit = async (values: AppSettings) => {
    setLoading(true);
    try {
      await adminApi.updateAppSettings(values);
      message.success('App settings updated successfully');
      setAppSettings(values);
    } catch (error) {
      message.error('Failed to update app settings');
    } finally {
      setLoading(false);
    }
  };

  const handlePricingSubmit = async (values: PricingSettings) => {
    setLoading(true);
    try {
      await adminApi.updatePricingSettings(values);
      message.success('Pricing settings updated successfully');
      setPricingSettings(values);
    } catch (error) {
      message.error('Failed to update pricing settings');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationSubmit = async (values: NotificationSettings) => {
    setLoading(true);
    try {
      await adminApi.updateNotificationSettings(values);
      message.success('Notification settings updated successfully');
      setNotificationSettings(values);
    } catch (error) {
      message.error('Failed to update notification settings');
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleSubmit = async (values: any) => {
    setLoading(true);
    try {
      if (editingVehicle) {
        await adminApi.updateVehicleType(editingVehicle.id, values);
        message.success('Vehicle type updated successfully');
      } else {
        await adminApi.createVehicleType(values);
        message.success('Vehicle type created successfully');
      }
      
      setVehicleModalVisible(false);
      setEditingVehicle(null);
      vehicleForm.resetFields();
      fetchVehicleTypes();
    } catch (error) {
      message.error('Failed to save vehicle type');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVehicleType = async (id: string) => {
    try {
      await adminApi.deleteVehicleType(id);
      message.success('Vehicle type deleted successfully');
      fetchVehicleTypes();
    } catch (error) {
      message.error('Failed to delete vehicle type');
    }
  };

  const handleToggleVehicleStatus = async (id: string, active: boolean) => {
    try {
      await adminApi.updateVehicleType(id, { active });
      message.success('Vehicle type status updated');
      fetchVehicleTypes();
    } catch (error) {
      message.error('Failed to update vehicle type status');
    }
  };

  const vehicleColumns: ColumnsType<VehicleType> = [
    {
      title: 'Vehicle Type',
      key: 'vehicle',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            src={record.icon} 
            icon={<CarOutlined />} 
            style={{ marginRight: 8 }}
          />
          <div>
            <Text strong>{record.name}</Text>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.description}
              </Text>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Capacity',
      dataIndex: 'capacity',
      key: 'capacity',
      render: (capacity: number) => `${capacity} passengers`,
    },
    {
      title: 'Base Fare',
      dataIndex: 'baseFare',
      key: 'baseFare',
      render: (fare: number) => `$${fare.toFixed(2)}`,
    },
    {
      title: 'Per KM Rate',
      dataIndex: 'perKmRate',
      key: 'perKmRate',
      render: (rate: number) => `$${rate.toFixed(2)}/km`,
    },
    {
      title: 'Status',
      dataIndex: 'active',
      key: 'active',
      render: (active: boolean, record) => (
        <Switch
          checked={active}
          onChange={(checked) => handleToggleVehicleStatus(record.id, checked)}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingVehicle(record);
              vehicleForm.setFieldsValue(record);
              setVehicleModalVisible(true);
            }}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              Modal.confirm({
                title: 'Delete Vehicle Type',
                content: 'Are you sure you want to delete this vehicle type?',
                onOk: () => handleDeleteVehicleType(record.id),
              });
            }}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="settings-page">
      <Title level={2}>Settings</Title>
      
      <Tabs defaultActiveKey="app">
        <TabPane tab={<span><SettingOutlined />App Settings</span>} key="app">
          <Card>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleAppSettingsSubmit}
              initialValues={appSettings || {}}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="App Name"
                    name="appName"
                    rules={[{ required: true, message: 'Please enter app name' }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="App Version"
                    name="appVersion"
                    rules={[{ required: true, message: 'Please enter app version' }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Support Email"
                    name="supportEmail"
                    rules={[{ required: true, type: 'email', message: 'Please enter valid email' }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Support Phone"
                    name="supportPhone"
                    rules={[{ required: true, message: 'Please enter support phone' }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
              
              <Divider />
              
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label="Maintenance Mode"
                    name="maintenanceMode"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Registration Enabled"
                    name="registrationEnabled"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Email Verification Required"
                    name="emailVerificationRequired"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
                  Save App Settings
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>
        
        <TabPane tab={<span><DollarOutlined />Pricing</span>} key="pricing">
          <Card>
            <Form
              form={pricingForm}
              layout="vertical"
              onFinish={handlePricingSubmit}
              initialValues={pricingSettings || {}}
            >
              <Title level={4}>Ride Pricing</Title>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label="Base Fare ($)"
                    name="baseFare"
                    rules={[{ required: true, message: 'Please enter base fare' }]}
                  >
                    <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Per KM Rate ($)"
                    name="perKmRate"
                    rules={[{ required: true, message: 'Please enter per km rate' }]}
                  >
                    <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Per Minute Rate ($)"
                    name="perMinuteRate"
                    rules={[{ required: true, message: 'Please enter per minute rate' }]}
                  >
                    <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label="Minimum Fare ($)"
                    name="minimumFare"
                    rules={[{ required: true, message: 'Please enter minimum fare' }]}
                  >
                    <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Cancellation Fee ($)"
                    name="cancellationFee"
                    rules={[{ required: true, message: 'Please enter cancellation fee' }]}
                  >
                    <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Platform Commission (%)"
                    name="platformCommission"
                    rules={[{ required: true, message: 'Please enter platform commission' }]}
                  >
                    <InputNumber min={0} max={100} step={0.1} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              
              <Divider />
              
              <Title level={4}>Delivery Pricing</Title>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label="Delivery Base Fare ($)"
                    name="deliveryBaseFare"
                    rules={[{ required: true, message: 'Please enter delivery base fare' }]}
                  >
                    <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Delivery Per KM Rate ($)"
                    name="deliveryPerKmRate"
                    rules={[{ required: true, message: 'Please enter delivery per km rate' }]}
                  >
                    <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Weight Multiplier"
                    name="deliveryWeightMultiplier"
                    rules={[{ required: true, message: 'Please enter weight multiplier' }]}
                  >
                    <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
                  Save Pricing Settings
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>
        
        <TabPane tab={<span><NotificationOutlined />Notifications</span>} key="notifications">
          <Card>
            <Form
              form={notificationForm}
              layout="vertical"
              onFinish={handleNotificationSubmit}
              initialValues={notificationSettings || {}}
            >
              <Title level={4}>Notification Channels</Title>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label="Email Notifications"
                    name="emailNotifications"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="SMS Notifications"
                    name="smsNotifications"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Push Notifications"
                    name="pushNotifications"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
              
              <Divider />
              
              <Title level={4}>Notification Types</Title>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label="Marketing Emails"
                    name="marketingEmails"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Ride Updates"
                    name="rideUpdates"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Payment Alerts"
                    name="paymentAlerts"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label="System Alerts"
                    name="systemAlerts"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
                  Save Notification Settings
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>
        
        <TabPane tab={<span><CarOutlined />Vehicle Types</span>} key="vehicles">
          <Card>
            <div style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingVehicle(null);
                  vehicleForm.resetFields();
                  setVehicleModalVisible(true);
                }}
              >
                Add Vehicle Type
              </Button>
            </div>
            
            <Table
              columns={vehicleColumns}
              dataSource={vehicleTypes}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </TabPane>
      </Tabs>
      
      {/* Vehicle Type Modal */}
      <Modal
        title={editingVehicle ? 'Edit Vehicle Type' : 'Add Vehicle Type'}
        open={vehicleModalVisible}
        onCancel={() => {
          setVehicleModalVisible(false);
          setEditingVehicle(null);
          vehicleForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={vehicleForm}
          layout="vertical"
          onFinish={handleVehicleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Name"
                name="name"
                rules={[{ required: true, message: 'Please enter vehicle name' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Capacity"
                name="capacity"
                rules={[{ required: true, message: 'Please enter capacity' }]}
              >
                <InputNumber min={1} max={20} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Base Fare ($)"
                name="baseFare"
                rules={[{ required: true, message: 'Please enter base fare' }]}
              >
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Per KM Rate ($)"
                name="perKmRate"
                rules={[{ required: true, message: 'Please enter per km rate' }]}
              >
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            label="Description"
            name="description"
          >
            <TextArea rows={3} />
          </Form.Item>
          
          <Form.Item
            label="Icon URL"
            name="icon"
          >
            <Input placeholder="https://example.com/icon.png" />
          </Form.Item>
          
          <Form.Item
            label="Active"
            name="active"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingVehicle ? 'Update' : 'Create'} Vehicle Type
              </Button>
              <Button onClick={() => setVehicleModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SettingsPage;