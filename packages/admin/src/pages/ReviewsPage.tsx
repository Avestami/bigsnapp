import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Button,
  Input,
  Select,
  DatePicker,
  Space,
  Tag,
  Rate,
  Modal,
  Typography,
  Row,
  Col,
  Statistic,
  Avatar,
  Divider,
  message,
  Popconfirm
} from 'antd';
import type { Dayjs } from 'dayjs';
import {
  SearchOutlined,
  EyeOutlined,
  DeleteOutlined,
  StarOutlined,
  UserOutlined,
  CarOutlined
} from '@ant-design/icons';
import { adminApi } from '../services/api';
import type { ColumnsType } from 'antd/es/table';

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;
const { Option } = Select;

interface Review {
  id: string;
  rating: number;
  comment: string;
  type: 'ride' | 'delivery';
  status: 'active' | 'hidden' | 'flagged';
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  driver: {
    id: string;
    name: string;
    avatar?: string;
  };
  ride?: {
    id: string;
    pickupAddress: string;
    dropoffAddress: string;
  };
  delivery?: {
    id: string;
    pickupAddress: string;
    dropoffAddress: string;
  };
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  flaggedReviews: number;
}

const ReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  
  // Filters
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, [searchText, statusFilter, typeFilter, ratingFilter, dateRange]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = {
        search: searchText || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        rating: ratingFilter !== 'all' ? parseInt(ratingFilter) : undefined,
        startDate: dateRange?.[0]?.format('YYYY-MM-DD'),
        endDate: dateRange?.[1]?.format('YYYY-MM-DD'),
      };
      
      const response = await adminApi.getReviews(params);
      setReviews(response.data.reviews);
    } catch (error) {
      message.error('Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await adminApi.getReviewStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch review stats:', error);
    }
  };

  const handleStatusChange = async (reviewId: string, newStatus: string) => {
    try {
      await adminApi.updateReviewStatus(reviewId, newStatus);
      message.success('Review status updated successfully');
      fetchReviews();
      fetchStats();
    } catch (error) {
      message.error('Failed to update review status');
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await adminApi.deleteReview(reviewId, 'Deleted by admin');
      message.success('Review deleted successfully');
      fetchReviews();
      fetchStats();
    } catch (error) {
      message.error('Failed to delete review');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'hidden': return 'orange';
      case 'flagged': return 'red';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'ride' ? <CarOutlined /> : <UserOutlined />;
  };

  const columns: ColumnsType<Review> = [
    {
      title: 'Review',
      key: 'review',
      render: (_, record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <Avatar 
              src={record.user.avatar} 
              icon={<UserOutlined />} 
              size="small" 
              style={{ marginRight: 8 }}
            />
            <Text strong>{record.user.name}</Text>
            <Tag 
              icon={getTypeIcon(record.type)} 
              color={record.type === 'ride' ? 'blue' : 'purple'}
              style={{ marginLeft: 8 }}
            >
              {record.type}
            </Tag>
          </div>
          <Rate disabled value={record.rating} style={{ fontSize: 14 }} />
          <div style={{ marginTop: 4 }}>
            <Text ellipsis={{ tooltip: record.comment }}>
              {record.comment || 'No comment'}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Driver',
      key: 'driver',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            src={record.driver.avatar} 
            icon={<UserOutlined />} 
            size="small" 
            style={{ marginRight: 8 }}
          />
          <Text>{record.driver.name}</Text>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record) => (
        <Select
          value={status}
          style={{ width: 100 }}
          size="small"
          onChange={(value) => handleStatusChange(record.id, value)}
        >
          <Option value="active">
            <Tag color="green">Active</Tag>
          </Option>
          <Option value="hidden">
            <Tag color="orange">Hidden</Tag>
          </Option>
          <Option value="flagged">
            <Tag color="red">Flagged</Tag>
          </Option>
        </Select>
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
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedReview(record);
              setDetailModalVisible(true);
            }}
          />
          <Popconfirm
            title="Are you sure you want to delete this review?"
            onConfirm={() => handleDeleteReview(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="reviews-page">
      {/* Statistics Cards */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Reviews"
                value={stats.totalReviews}
                prefix={<StarOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Average Rating"
                value={stats.averageRating}
                precision={1}
                suffix="/ 5"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Flagged Reviews"
                value={stats.flaggedReviews}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <div>
                <Text strong>Rating Distribution</Text>
                <div style={{ marginTop: 8 }}>
                  {[5, 4, 3, 2, 1].map(rating => (
                    <div key={rating} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                      <Rate disabled value={rating} count={1} style={{ fontSize: 12, marginRight: 8 }} />
                      <Text style={{ minWidth: 20 }}>{rating}</Text>
                      <div 
                        style={{ 
                          flex: 1, 
                          height: 8, 
                          backgroundColor: '#f0f0f0', 
                          marginLeft: 8,
                          borderRadius: 4
                        }}
                      >
                        <div 
                          style={{
                            height: '100%',
                            width: `${(stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution] / stats.totalReviews) * 100}%`,
                            backgroundColor: '#1890ff',
                            borderRadius: 4
                          }}
                        />
                      </div>
                      <Text style={{ marginLeft: 8, minWidth: 30 }}>
                        {stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution]}
                      </Text>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Input
              placeholder="Search reviews..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">All Status</Option>
              <Option value="active">Active</Option>
              <Option value="hidden">Hidden</Option>
              <Option value="flagged">Flagged</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="Type"
              value={typeFilter}
              onChange={setTypeFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">All Types</Option>
              <Option value="ride">Ride</Option>
              <Option value="delivery">Delivery</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="Rating"
              value={ratingFilter}
              onChange={setRatingFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">All Ratings</Option>
              <Option value="5">5 Stars</Option>
              <Option value="4">4 Stars</Option>
              <Option value="3">3 Stars</Option>
              <Option value="2">2 Stars</Option>
              <Option value="1">1 Star</Option>
            </Select>
          </Col>
          <Col span={6}>
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates)}
              style={{ width: '100%' }}
            />
          </Col>
        </Row>
      </Card>

      {/* Reviews Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={reviews}
          rowKey="id"
          loading={loading}
          pagination={{
            total: reviews.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} reviews`,
          }}
        />
      </Card>

      {/* Review Detail Modal */}
      <Modal
        title="Review Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedReview && (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>Customer</Text>
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: 8 }}>
                    <Avatar 
                      src={selectedReview.user.avatar} 
                      icon={<UserOutlined />} 
                      style={{ marginRight: 8 }}
                    />
                    <Text>{selectedReview.user.name}</Text>
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>Driver</Text>
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: 8 }}>
                    <Avatar 
                      src={selectedReview.driver.avatar} 
                      icon={<UserOutlined />} 
                      style={{ marginRight: 8 }}
                    />
                    <Text>{selectedReview.driver.name}</Text>
                  </div>
                </div>
              </Col>
            </Row>

            <Divider />

            <div style={{ marginBottom: 16 }}>
              <Text strong>Rating & Review</Text>
              <div style={{ marginTop: 8 }}>
                <Rate disabled value={selectedReview.rating} />
                <Tag 
                  color={getStatusColor(selectedReview.status)} 
                  style={{ marginLeft: 8 }}
                >
                  {selectedReview.status}
                </Tag>
                <Tag 
                  icon={getTypeIcon(selectedReview.type)} 
                  color={selectedReview.type === 'ride' ? 'blue' : 'purple'}
                  style={{ marginLeft: 8 }}
                >
                  {selectedReview.type}
                </Tag>
              </div>
              <div style={{ marginTop: 8, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 6 }}>
                <Text>{selectedReview.comment || 'No comment provided'}</Text>
              </div>
            </div>

            <Divider />

            {selectedReview.ride && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>Ride Details</Text>
                <div style={{ marginTop: 8 }}>
                  <div><Text strong>Pickup:</Text> {selectedReview.ride.pickupAddress}</div>
                  <div><Text strong>Dropoff:</Text> {selectedReview.ride.dropoffAddress}</div>
                </div>
              </div>
            )}

            {selectedReview.delivery && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>Delivery Details</Text>
                <div style={{ marginTop: 8 }}>
                  <div><Text strong>Pickup:</Text> {selectedReview.delivery.pickupAddress}</div>
                  <div><Text strong>Dropoff:</Text> {selectedReview.delivery.dropoffAddress}</div>
                </div>
              </div>
            )}

            <div>
              <Text strong>Date:</Text> {new Date(selectedReview.createdAt).toLocaleString()}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReviewsPage;