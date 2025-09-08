import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  TextInput,
  Modal,
  FlatList,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import apiService from '../../services/api';
import { useThemedStyles, useThemeColors } from '../../contexts/ThemeContext';

interface Review {
  id: string;
  type: 'RIDE' | 'DELIVERY';
  serviceId: string;
  driverName: string;
  driverPhoto?: string;
  rating: number;
  comment: string;
  date: string;
  response?: string;
  responseDate?: string;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

const ReviewsScreen: React.FC = () => {
  const navigation = useNavigation();
  const themeColors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const sampleReviews: Review[] = [
    {
      id: '1',
      type: 'RIDE',
      serviceId: 'RIDE123',
      driverName: 'Rajesh Kumar',
      rating: 5,
      comment: 'Excellent service! Very punctual and professional driver. Clean car and smooth ride.',
      date: '2024-01-15T10:30:00Z',
    },
    {
      id: '2',
      type: 'DELIVERY',
      serviceId: 'DEL456',
      driverName: 'Amit Singh',
      rating: 4,
      comment: 'Good delivery service. Package was delivered safely and on time.',
      date: '2024-01-14T16:20:00Z',
      response: 'Thank you for your feedback! We appreciate your business.',
      responseDate: '2024-01-14T18:00:00Z',
    },
    {
      id: '3',
      type: 'RIDE',
      serviceId: 'RIDE789',
      driverName: 'Priya Sharma',
      rating: 5,
      comment: 'Amazing experience! Driver was very courteous and the car was spotless.',
      date: '2024-01-13T14:15:00Z',
    },
    {
      id: '4',
      type: 'DELIVERY',
      serviceId: 'DEL101',
      driverName: 'Vikash Yadav',
      rating: 3,
      comment: 'Delivery was okay but took longer than expected. Could be improved.',
      date: '2024-01-12T11:45:00Z',
    },
    {
      id: '5',
      type: 'RIDE',
      serviceId: 'RIDE202',
      driverName: 'Suresh Gupta',
      rating: 4,
      comment: 'Good ride overall. Driver was friendly and knew the routes well.',
      date: '2024-01-11T09:30:00Z',
    },
  ];

  const [reviews, setReviews] = useState<Review[]>(sampleReviews);
  const [reviewStats, setReviewStats] = useState<ReviewStats>({
    averageRating: 4.2,
    totalReviews: 156,
    ratingDistribution: {
      5: 78,
      4: 45,
      3: 23,
      2: 7,
      1: 3,
    },
  });
  const [refreshing, setRefreshing] = useState(false);

  console.log('⭐ ReviewsScreen: Component loaded');
  console.log('⭐ ReviewsScreen: Reviews count:', reviews.length);
  console.log('⭐ ReviewsScreen: Average rating:', reviewStats.averageRating);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    console.log('⭐ ReviewsScreen: Fetching reviews from API');
    setRefreshing(true);
    try {
      const reviewsResponse = await apiService.getReviews();
      
      // Update state with API data
      if (reviewsResponse.data) {
        setReviews(reviewsResponse.data.reviews || []);
        // Calculate basic stats from reviews data
        const reviews = reviewsResponse.data.reviews || [];
        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0 
          ? reviews.reduce((sum: number, review: any) => sum + (review.rating || 0), 0) / totalReviews 
          : 0;
        setReviewStats({
          totalReviews,
          averageRating: Math.round(averageRating * 10) / 10,
          ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        });
      }
      
      console.log('✅ ReviewsScreen: Reviews loaded successfully');
    } catch (error) {
      console.error('❌ ReviewsScreen: Error fetching reviews:', error);
      Alert.alert('Error', 'Failed to load reviews. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'RIDE' | 'DELIVERY'>('ALL');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [newReview, setNewReview] = useState({
    type: 'RIDE' as 'RIDE' | 'DELIVERY',
    serviceId: '',
    driverName: '',
    rating: 0,
    comment: '',
  });
  const [loading, setLoading] = useState(false);

  const filteredReviews = reviews.filter(review => {
    if (selectedFilter === 'ALL') return true;
    return review.type === selectedFilter;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderStars = (rating: number, size: number = 16, interactive: boolean = false, onPress?: (rating: number) => void) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            disabled={!interactive}
            onPress={() => onPress && onPress(star)}
            style={interactive ? styles.interactiveStar : undefined}
          >
            <Text style={[styles.star, { fontSize: size, color: star <= rating ? '#FFD700' : '#ddd' }]}>
              ⭐
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderRatingDistribution = () => {
    const maxCount = Math.max(...Object.values(reviewStats.ratingDistribution));
    
    return (
      <View style={styles.ratingDistribution}>
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = reviewStats.ratingDistribution[rating as keyof typeof reviewStats.ratingDistribution];
          const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
          
          return (
            <View key={rating} style={styles.ratingRow}>
              <Text style={styles.ratingNumber}>{rating}</Text>
              <Text style={styles.starSymbol}>⭐</Text>
              <View style={styles.ratingBar}>
                <View style={[styles.ratingBarFill, { width: `${percentage}%` }]} />
              </View>
              <Text style={styles.ratingCount}>{count}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  const submitReview = async () => {
    if (!newReview.serviceId.trim()) {
      Alert.alert('Error', 'Please enter service ID');
      return;
    }

    if (!newReview.driverName.trim()) {
      Alert.alert('Error', 'Please enter driver name');
      return;
    }

    if (newReview.rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    if (!newReview.comment.trim()) {
      Alert.alert('Error', 'Please write a comment');
      return;
    }

    setLoading(true);
    try {
      const review: Review = {
        id: Date.now().toString(),
        type: newReview.type,
        serviceId: newReview.serviceId,
        driverName: newReview.driverName,
        rating: newReview.rating,
        comment: newReview.comment,
        date: new Date().toISOString(),
      };

      setReviews(prev => [review, ...prev]);
      
      // Update stats
      const newTotalReviews = reviewStats.totalReviews + 1;
      const newAverageRating = ((reviewStats.averageRating * reviewStats.totalReviews) + newReview.rating) / newTotalReviews;
      const newDistribution = { ...reviewStats.ratingDistribution };
      newDistribution[newReview.rating as keyof typeof newDistribution]++;
      
      setReviewStats({
        averageRating: Math.round(newAverageRating * 10) / 10,
        totalReviews: newTotalReviews,
        ratingDistribution: newDistribution,
      });

      setShowReviewModal(false);
      setNewReview({
        type: 'RIDE',
        serviceId: '',
        driverName: '',
        rating: 0,
        comment: '',
      });
      
      Alert.alert('Success', 'Review submitted successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderReview = ({ item }: { item: Review }) => (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewInfo}>
          <Text style={styles.driverName}>{item.driverName}</Text>
          <View style={styles.reviewMeta}>
            <View style={styles.serviceType}>
              <Text style={styles.serviceTypeText}>
                {item.type === 'RIDE' ? '🚗' : '📦'} {item.type}
              </Text>
            </View>
            <Text style={styles.serviceId}>#{item.serviceId}</Text>
          </View>
        </View>
        <View style={styles.reviewRating}>
          {renderStars(item.rating, 14)}
          <Text style={styles.reviewDate}>{formatDate(item.date)}</Text>
        </View>
      </View>
      
      <Text style={styles.reviewComment}>{item.comment}</Text>
      
      {item.response && (
        <View style={styles.responseContainer}>
          <Text style={styles.responseLabel}>Response from SnappClone:</Text>
          <Text style={styles.responseText}>{item.response}</Text>
          <Text style={styles.responseDate}>{formatDate(item.responseDate!)}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchReviews}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>My Reviews</Text>
          <TouchableOpacity
            style={styles.addReviewButton}
            onPress={() => setShowReviewModal(true)}
          >
            <Text style={styles.addReviewButtonText}>+ Add Review</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <View style={styles.averageRating}>
              <Text style={styles.averageRatingNumber}>{reviewStats.averageRating}</Text>
              {renderStars(Math.round(reviewStats.averageRating), 20)}
              <Text style={styles.totalReviews}>{reviewStats.totalReviews} reviews</Text>
            </View>
          </View>
          {renderRatingDistribution()}
        </View>

        <View style={styles.filtersContainer}>
          <Text style={styles.filtersTitle}>Filter Reviews</Text>
          <View style={styles.filterButtons}>
            {['ALL', 'RIDE', 'DELIVERY'].map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterButton,
                  selectedFilter === filter && styles.filterButtonActive
                ]}
                onPress={() => setSelectedFilter(filter as any)}
              >
                <Text style={[
                  styles.filterButtonText,
                  selectedFilter === filter && styles.filterButtonTextActive
                ]}>
                  {filter === 'ALL' ? 'All' : filter === 'RIDE' ? '🚗 Rides' : '📦 Deliveries'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.reviewsList}>
          <FlatList
            data={filteredReviews}
            renderItem={renderReview}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.reviewSeparator} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No reviews found</Text>
                <Text style={styles.emptySubtext}>Start by adding your first review!</Text>
              </View>
            }
          />
        </View>
      </ScrollView>

      <Modal
        visible={showReviewModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Add New Review</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Service Type</Text>
                <View style={styles.serviceTypeSelector}>
                  {['RIDE', 'DELIVERY'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.serviceTypeOption,
                        newReview.type === type && styles.serviceTypeOptionActive
                      ]}
                      onPress={() => setNewReview(prev => ({ ...prev, type: type as any }))}
                    >
                      <Text style={[
                        styles.serviceTypeOptionText,
                        newReview.type === type && styles.serviceTypeOptionTextActive
                      ]}>
                        {type === 'RIDE' ? '🚗 Ride' : '📦 Delivery'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Service ID</Text>
                <TextInput
                  style={styles.textInput}
                  value={newReview.serviceId}
                  onChangeText={(text) => setNewReview(prev => ({ ...prev, serviceId: text }))}
                  placeholder="Enter service ID (e.g., RIDE123)"
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Driver Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={newReview.driverName}
                  onChangeText={(text) => setNewReview(prev => ({ ...prev, driverName: text }))}
                  placeholder="Enter driver name"
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Rating</Text>
                {renderStars(
                  newReview.rating,
                  24,
                  true,
                  (rating) => setNewReview(prev => ({ ...prev, rating }))
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Comment</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={newReview.comment}
                  onChangeText={(text) => setNewReview(prev => ({ ...prev, comment: text }))}
                  placeholder="Share your experience..."
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setShowReviewModal(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalSubmitButton, loading && styles.buttonDisabled]}
                  onPress={submitReview}
                  disabled={loading}
                >
                  <Text style={styles.modalSubmitText}>
                    {loading ? 'Submitting...' : 'Submit Review'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.themeColors.background,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.themeColors.surface,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.themeColors.textPrimary,
  },
  addReviewButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addReviewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: theme.themeColors.surface,
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },
  statsHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  averageRating: {
    alignItems: 'center',
  },
  averageRatingNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: theme.themeColors.textPrimary,
    marginBottom: 8,
  },
  totalReviews: {
    fontSize: 14,
    color: theme.themeColors.textSecondary,
    marginTop: 8,
  },
  ratingDistribution: {
    gap: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingNumber: {
    fontSize: 14,
    color: '#333',
    width: 12,
  },
  starSymbol: {
    fontSize: 12,
  },
  ratingBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    backgroundColor: '#FFD700',
  },
  ratingCount: {
    fontSize: 12,
    color: '#666',
    width: 20,
    textAlign: 'right',
  },
  filtersContainer: {
    backgroundColor: theme.themeColors.surface,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.themeColors.textPrimary,
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  reviewsList: {
    backgroundColor: theme.themeColors.surface,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
  },
  reviewItem: {
    paddingVertical: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  reviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  serviceType: {
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  serviceTypeText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  serviceId: {
    fontSize: 12,
    color: '#666',
  },
  reviewRating: {
    alignItems: 'flex-end',
  },
  reviewDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  reviewComment: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  responseContainer: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  responseLabel: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  responseText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
    marginBottom: 4,
  },
  responseDate: {
    fontSize: 11,
    color: '#666',
  },
  reviewSeparator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: theme.themeColors.textSecondary,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.themeColors.textTertiary,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginRight: 2,
  },
  interactiveStar: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.themeColors.surface,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.themeColors.textPrimary,
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.themeColors.textPrimary,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.themeColors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: theme.themeColors.backgroundSecondary,
    color: theme.themeColors.textPrimary,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  serviceTypeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  serviceTypeOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.themeColors.border,
    borderRadius: 8,
    alignItems: 'center',
  },
  serviceTypeOptionActive: {
    borderColor: theme.themeColors.brand,
    backgroundColor: theme.themeColors.brandLight,
  },
  serviceTypeOptionText: {
    fontSize: 14,
    color: theme.themeColors.textSecondary,
    fontWeight: '500',
  },
  serviceTypeOptionTextActive: {
    color: theme.themeColors.brand,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: theme.themeColors.backgroundSecondary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  modalCancelText: {
    color: theme.themeColors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  modalSubmitButton: {
    flex: 1,
    backgroundColor: theme.themeColors.brand,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  modalSubmitText: {
    color: theme.themeColors.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: theme.themeColors.disabled,
  },
});

export default ReviewsScreen;