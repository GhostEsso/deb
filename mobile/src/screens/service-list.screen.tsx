import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, TextInput, Dimensions, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '@/constants/theme';
import { ServiceCard } from '@/components/service-card';
import { servicesApi, bookingsApi } from '@/services/api.service';
import { Bell, Search, X, Clock, Calendar as CalendarIcon, CheckCircle2, LayoutGrid, List, User } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/services/auth.context';
import { Modal, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { StoryBar } from '@/components/story-bar';

const { width } = Dimensions.get('window');

const CATEGORIES = ['Tous', 'Vernis', 'Capsules', 'Cils', 'Tatouage'];

export const ServiceListScreen = ({ navigation }: any) => {
    const [services, setServices] = useState<any[]>([]);
    const [filteredServices, setFilteredServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Tous');
    const [bookingModalVisible, setBookingModalVisible] = useState(false);
    const [selectedService, setSelectedService] = useState<any>(null);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookedSlots, setBookedSlots] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

    const TIME_SLOTS = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

    const generateAvailableDates = () => {
        const dates = [];
        let tempDate = new Date();

        while (dates.length < 14) { // Proposer 2 semaines
            if (tempDate.getDay() !== 0) {
                const dateValue = tempDate.toISOString().split('T')[0];
                const dayName = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(tempDate).replace('.', '');
                const dayNum = tempDate.getDate();
                const month = new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(tempDate).replace('.', '');

                dates.push({
                    label: dates.length === 0 ? "Auj" : dayName,
                    dayNum,
                    month,
                    value: dateValue
                });
            }
            tempDate.setDate(tempDate.getDate() + 1);
        }
        return dates;
    }

    const DATES = generateAvailableDates();
    const MORNING_SLOTS = ['09:00', '10:00', '11:00'];
    const AFTERNOON_SLOTS = ['14:00', '15:00', '16:00', '17:00'];

    useFocusEffect(
        useCallback(() => {
            fetchServices();
        }, [])
    );

    useEffect(() => {
        filterServices();
    }, [searchQuery, selectedCategory, services]);

    useEffect(() => {
        if (bookingModalVisible && selectedDate) {
            fetchBookedSlots();
        }
    }, [selectedDate, bookingModalVisible]);

    const fetchBookedSlots = async () => {
        try {
            const response = await bookingsApi.getBookedSlots(selectedDate);
            setBookedSlots(response.data);
            if (response.data.includes(selectedTime)) {
                setSelectedTime('');
            }
        } catch (error) {
            console.error('Error fetching booked slots:', error);
        }
    };

    const fetchServices = async () => {
        try {
            const response = await servicesApi.getAll();
            setServices(response.data || []);
        } catch (error) {
            console.error('Error fetching services:', error);
            setServices([]);
        } finally {
            setLoading(false);
        }
    };

    const filterServices = () => {
        let filtered = [...services];

        if (searchQuery) {
            filtered = filtered.filter(s =>
                s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.description?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (selectedCategory !== 'Tous') {
            filtered = filtered.filter(s => {
                if (selectedCategory === 'Vernis') return s.name.toLowerCase().includes('vernis');
                if (selectedCategory === 'Capsules') return s.name.toLowerCase().includes('capsule');
                if (selectedCategory === 'Cils') return s.name.toLowerCase().includes('cils');
                if (selectedCategory === 'Tatouage') return s.name.toLowerCase().includes('tatouage');
                return true;
            });
        }

        setFilteredServices(filtered);
    };



    const { user } = useAuth();

    const handleBook = (service: any) => {
        if (!user) {
            navigation.navigate('Login');
            return;
        }
        setSelectedService(service);
        setBookingModalVisible(true);
    };

    const confirmBooking = async () => {
        if (!selectedTime) {
            Alert.alert('Erreur', 'Veuillez choisir une heure');
            return;
        }

        setBookingLoading(true);
        try {
            // On construit une date UTC pour que 09:00 reste 09:00 quel que soit le fuseau horaire
            const bookingDate = `${selectedDate}T${selectedTime}:00.000Z`;

            await bookingsApi.create({
                userId: user!.id,
                serviceId: selectedService.id,
                date: bookingDate,
            });

            setBookingModalVisible(false);
            Alert.alert(
                'Réservation confirmée',
                `Votre rendez-vous pour "${selectedService.name}" est enregistré !`,
                [{ text: 'Super !', onPress: () => navigation.navigate('Profile') }]
            );
        } catch (error: any) {
            Alert.alert('Erreur', error.response?.data?.message || 'Une erreur est survenue');
            // Rafraîchir les créneaux au cas où celui-ci vient d'être pris
            fetchBookedSlots();
        } finally {
            setBookingLoading(false);
        }
    };

    const renderItem = ({ item }: any) => (
        <ServiceCard
            name={item.name}
            description={item.description}
            price={item.price}
            duration={item.duration}
            imageUrl={item.imageUrl}
            onPress={() => navigation.navigate('ServiceDetail', { service: item })}
            onBookPress={() => handleBook(item)}
            viewMode={viewMode}
        />
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[COLORS.secondary, COLORS.white]}
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>{user ? 'Bonjour' : 'Bienvenue'}</Text>
                        <Text style={styles.greetingName}>
                            {user ? user.firstName : 'Sublimez vous'}
                        </Text>
                    </View>

                    {user ? (
                        <TouchableOpacity
                            style={styles.profileBtn}
                            onPress={() => navigation.navigate('Profile')}
                        >
                            {user.profilePictureUrl ? (
                                <Image
                                    source={{ uri: user.profilePictureUrl }}
                                    style={styles.profileImage}
                                />
                            ) : (
                                <Text style={styles.profileInitials}>
                                    {user.firstName?.charAt(0).toUpperCase()}
                                    {user.lastName?.charAt(0).toUpperCase()}
                                </Text>
                            )}
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={styles.profileBtn}
                            onPress={() => navigation.navigate('Login')}
                        >
                            <User size={22} color={COLORS.white} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Search Bar */}
                <View style={styles.searchSection}>
                    <View style={styles.searchContainer}>
                        <Search size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Rechercher un service..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor={COLORS.textSecondary}
                        />
                        {searchQuery !== '' && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <X size={18} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Stories Section */}
                <StoryBar />

                {/* Services Title Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Nos Services</Text>
                    <View style={styles.viewToggle}>
                        <TouchableOpacity
                            onPress={() => setViewMode('list')}
                            style={[styles.toggleBtn, viewMode === 'list' && styles.activeToggleBtn]}
                        >
                            <List size={20} color={viewMode === 'list' ? COLORS.white : COLORS.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setViewMode('grid')}
                            style={[styles.toggleBtn, viewMode === 'grid' && styles.activeToggleBtn]}
                        >
                            <LayoutGrid size={18} color={viewMode === 'grid' ? COLORS.white : COLORS.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Categories Filter */}
                <View style={styles.categoriesContainer}>
                    <FlatList
                        data={CATEGORIES}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item) => item}
                        contentContainerStyle={styles.categoriesList}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.categoryChip,
                                    selectedCategory === item && styles.selectedCategoryChip
                                ]}
                                onPress={() => setSelectedCategory(item)}
                            >
                                <Text style={[
                                    styles.categoryText,
                                    selectedCategory === item && styles.selectedCategoryText
                                ]}>
                                    {item}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>

                {loading ? (
                    <View style={styles.loader}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                ) : (
                    <FlatList
                        key={viewMode}
                        data={filteredServices}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id}
                        numColumns={viewMode === 'grid' ? 2 : 1}
                        columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : null}
                        contentContainerStyle={[
                            styles.listContent,
                            viewMode === 'grid' && styles.gridContentList
                        ]}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={() => (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>Aucun service trouvé</Text>
                            </View>
                        )}
                    />
                )}

                {/* Booking Modal */}
                <Modal
                    visible={bookingModalVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setBookingModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHandle} />
                            <View style={styles.modalHeader}>
                                <View>
                                    <Text style={styles.modalTitle}>Réserver un service</Text>
                                    <Text style={styles.modalSubtitleLabel}>Sélectionnez vos préférences</Text>
                                </View>
                                <TouchableOpacity style={styles.closeBtn} onPress={() => setBookingModalVisible(false)}>
                                    <X size={20} color={COLORS.text} />
                                </TouchableOpacity>
                            </View>

                            {selectedService && (
                                <LinearGradient
                                    colors={['#7C4DFF20', '#7C4DFF05']}
                                    style={styles.servicePreview}
                                >
                                    <View>
                                        <Text style={styles.previewName}>{selectedService.name}</Text>
                                        <Text style={styles.previewPrice}>{selectedService.price} FCFA • {selectedService.duration} min</Text>
                                    </View>
                                    <Clock size={20} color={COLORS.primary} opacity={0.5} />
                                </LinearGradient>
                            )}

                            <Text style={styles.sectionLabel}>Choisir le jour</Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.dateListUnder}
                                style={styles.dateScroll}
                            >
                                {DATES.map((date) => (
                                    <TouchableOpacity
                                        key={date.value}
                                        style={[
                                            styles.dateCard,
                                            selectedDate === date.value && styles.selectedDateCard
                                        ]}
                                        onPress={() => setSelectedDate(date.value)}
                                    >
                                        <Text style={[styles.dateDayName, selectedDate === date.value && styles.selectedDateText]}>
                                            {date.label.toUpperCase()}
                                        </Text>
                                        <Text style={[styles.dateDayNum, selectedDate === date.value && styles.selectedDateText]}>
                                            {date.dayNum}
                                        </Text>
                                        <Text style={[styles.dateMonth, selectedDate === date.value && styles.selectedDateText]}>
                                            {date.month}
                                        </Text>
                                        {selectedDate === date.value && <View style={styles.activeDot} />}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <Text style={styles.sectionLabel}>Choisir l'heure</Text>
                            <View style={styles.timeSection}>
                                <View style={styles.timeCategory}>
                                    <Text style={styles.timeCategoryTitle}>Matin</Text>
                                    <View style={styles.timeGrid}>
                                        {MORNING_SLOTS.map((time) => {
                                            const isBooked = bookedSlots.includes(time);
                                            return (
                                                <TouchableOpacity
                                                    key={time}
                                                    style={[
                                                        styles.timeSlot,
                                                        selectedTime === time && styles.selectedTimeSlot,
                                                        isBooked && styles.bookedTimeSlot
                                                    ]}
                                                    onPress={() => !isBooked && setSelectedTime(time)}
                                                    disabled={isBooked}
                                                >
                                                    <Text style={[
                                                        styles.timeSlotText,
                                                        selectedTime === time && styles.selectedTimeSlotText,
                                                        isBooked && styles.bookedTimeSlotText
                                                    ]}>{time}</Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>

                                <View style={styles.timeCategory}>
                                    <Text style={styles.timeCategoryTitle}>Après-midi</Text>
                                    <View style={styles.timeGrid}>
                                        {AFTERNOON_SLOTS.map((time) => {
                                            const isBooked = bookedSlots.includes(time);
                                            return (
                                                <TouchableOpacity
                                                    key={time}
                                                    style={[
                                                        styles.timeSlot,
                                                        selectedTime === time && styles.selectedTimeSlot,
                                                        isBooked && styles.bookedTimeSlot
                                                    ]}
                                                    onPress={() => !isBooked && setSelectedTime(time)}
                                                    disabled={isBooked}
                                                >
                                                    <Text style={[
                                                        styles.timeSlotText,
                                                        selectedTime === time && styles.selectedTimeSlotText,
                                                        isBooked && styles.bookedTimeSlotText
                                                    ]}>{time}</Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.confirmBtn, (!selectedTime || bookingLoading) && styles.disabledBtn]}
                                onPress={confirmBooking}
                                disabled={!selectedTime || bookingLoading}
                            >
                                {bookingLoading ? (
                                    <ActivityIndicator color={COLORS.white} />
                                ) : (
                                    <>
                                        <CheckCircle2 size={20} color={COLORS.white} style={{ marginRight: 8 }} />
                                        <Text style={styles.confirmBtnText}>Confirmer la réservation</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 10,
        paddingBottom: 20,
    },
    title: {
        fontSize: 16,
        color: COLORS.textSecondary,
        fontFamily: FONTS.medium,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        fontFamily: FONTS.medium,
        marginTop: -4,
    },
    greetingName: {
        fontSize: 28,
        color: COLORS.text,
        fontFamily: FONTS.extraBold,
        marginTop: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginTop: 10,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        color: COLORS.text,
        fontFamily: FONTS.extraBold,
    },
    seeAllText: {
        fontSize: 14,
        color: COLORS.primary,
        fontFamily: FONTS.bold,
    },
    notificationBtn: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    dot: {
        position: 'absolute',
        top: 14,
        right: 14,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary,
        zIndex: 1,
        borderWidth: 1.5,
        borderColor: COLORS.white,
    },
    searchSection: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        marginBottom: 20,
        alignItems: 'center',
    },
    searchContainer: {
        flex: 1,
        height: 56,
        backgroundColor: COLORS.white,
        borderRadius: 18,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        fontFamily: FONTS.medium,
        color: COLORS.text,
    },
    filterBtn: {
        width: 56,
        height: 56,
        borderRadius: 18,
        backgroundColor: COLORS.text,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.text,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    categoriesContainer: {
        marginBottom: 10,
    },
    categoriesList: {
        paddingHorizontal: 24,
        paddingBottom: 10,
    },
    categoryChip: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 14,
        backgroundColor: '#F0F0F0',
        marginRight: 10,
    },
    selectedCategoryChip: {
        backgroundColor: COLORS.primary,
    },
    categoryText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        fontFamily: FONTS.bold,
    },
    selectedCategoryText: {
        color: COLORS.white,
    },
    listContent: {
        padding: 24,
        paddingTop: 10,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        fontFamily: FONTS.medium,
        color: COLORS.textSecondary,
        fontSize: 16,
    },
    profileBtn: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
        overflow: 'hidden',
    },
    profileImage: {
        width: '100%',
        height: '100%',
    },
    profileInitials: {
        fontSize: 18,
        fontFamily: FONTS.bold,
        color: COLORS.white,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        padding: 24,
        paddingBottom: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 20,
    },
    modalHandle: {
        width: 40,
        height: 5,
        backgroundColor: '#EEE',
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 22,
        fontFamily: FONTS.bold,
        color: COLORS.text,
    },
    modalSubtitleLabel: {
        fontSize: 14,
        fontFamily: FONTS.medium,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    servicePreview: {
        padding: 20,
        borderRadius: 24,
        marginBottom: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#7C4DFF15',
    },
    previewName: {
        fontSize: 18,
        fontFamily: FONTS.bold,
        color: COLORS.text,
        marginBottom: 6,
    },
    previewPrice: {
        fontSize: 15,
        fontFamily: FONTS.bold,
        color: COLORS.primary,
    },
    sectionLabel: {
        fontSize: 17,
        fontFamily: FONTS.bold,
        color: COLORS.text,
        marginBottom: 16,
    },
    dateScroll: {
        marginHorizontal: -24,
        marginBottom: 28,
    },
    dateListUnder: {
        paddingHorizontal: 24,
        gap: 12,
    },
    dateCard: {
        width: 65,
        height: 100,
        borderRadius: 20,
        backgroundColor: '#F8F8F8',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    selectedDateCard: {
        backgroundColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    dateDayName: {
        fontSize: 11,
        fontFamily: FONTS.bold,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    dateDayNum: {
        fontSize: 20,
        fontFamily: FONTS.bold,
        color: COLORS.text,
        marginBottom: 2,
    },
    dateMonth: {
        fontSize: 11,
        fontFamily: FONTS.bold,
        color: COLORS.textSecondary,
    },
    selectedDateText: {
        color: COLORS.white,
    },
    activeDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: COLORS.white,
        marginTop: 8,
    },
    timeSection: {
        marginBottom: 32,
    },
    timeCategory: {
        marginBottom: 20,
    },
    timeCategoryTitle: {
        fontSize: 13,
        fontFamily: FONTS.bold,
        color: COLORS.textSecondary,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    timeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    timeSlot: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 14,
        backgroundColor: '#F5F5F5',
        minWidth: 70,
        alignItems: 'center',
    },
    selectedTimeSlot: {
        backgroundColor: COLORS.text,
    },
    bookedTimeSlot: {
        backgroundColor: '#FAFAFA',
        opacity: 0.4,
    },
    timeSlotText: {
        fontSize: 14,
        fontFamily: FONTS.bold,
        color: COLORS.text,
    },
    selectedTimeSlotText: {
        color: COLORS.white,
    },
    bookedTimeSlotText: {
        color: '#999',
        textDecorationLine: 'line-through',
    },
    confirmBtn: {
        backgroundColor: COLORS.primary,
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    disabledBtn: {
        backgroundColor: '#CCC',
        shadowOpacity: 0,
        elevation: 0,
    },
    confirmBtnText: {
        color: COLORS.white,
        fontFamily: FONTS.bold,
        fontSize: 16,
    },
    viewToggle: {
        flexDirection: 'row',
        backgroundColor: '#F0F0F0',
        borderRadius: 12,
        padding: 4,
    },
    toggleBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeToggleBtn: {
        backgroundColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    gridRow: {
        justifyContent: 'space-between',
        paddingHorizontal: 24,
    },
    gridContentList: {
        paddingHorizontal: 0,
    },
});
