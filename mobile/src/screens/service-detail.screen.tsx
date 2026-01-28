import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '@/constants/theme';
import { Clock, Euro, Star, ChevronLeft, Calendar, ShieldCheck, Heart, X, CheckCircle2 } from 'lucide-react-native';
import { useAuth } from '@/services/auth.context';
import { bookingsApi } from '@/services/api.service';
import { LinearGradient } from 'expo-linear-gradient';
import { Modal, Alert, ActivityIndicator } from 'react-native';

const { width } = Dimensions.get('window');

export const ServiceDetailScreen = ({ route, navigation }: any) => {
    const { service } = route.params;
    const { user } = useAuth();

    const [bookingModalVisible, setBookingModalVisible] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookedSlots, setBookedSlots] = useState<string[]>([]);

    const MORNING_SLOTS = ['09:00', '10:00', '11:00'];
    const AFTERNOON_SLOTS = ['14:00', '15:00', '16:00', '17:00'];

    const generateAvailableDates = () => {
        const dates = [];
        let tempDate = new Date();
        while (dates.length < 14) {
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
    };

    const DATES = generateAvailableDates();

    React.useEffect(() => {
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

    const handleBook = () => {
        if (!user) {
            navigation.navigate('Login');
            return;
        }
        setBookingModalVisible(true);
    };

    const confirmBooking = async () => {
        if (!selectedTime) {
            Alert.alert('Erreur', 'Veuillez choisir une heure');
            return;
        }

        setBookingLoading(true);
        try {
            const bookingDate = `${selectedDate}T${selectedTime}:00.000Z`;
            await bookingsApi.create({
                userId: user!.id,
                serviceId: service.id,
                date: bookingDate,
            });

            setBookingModalVisible(false);
            Alert.alert(
                'Réservation confirmée',
                `Votre rendez-vous pour "${service.name}" est enregistré !`,
                [{ text: 'Super !', onPress: () => navigation.navigate('Profile') }]
            );
        } catch (error: any) {
            Alert.alert('Erreur', error.response?.data?.message || 'Une erreur est survenue');
            fetchBookedSlots();
        } finally {
            setBookingLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Image Header with Back Button */}
            <View style={styles.imageHeader}>
                <Image
                    source={{ uri: service.imageUrl || 'https://images.unsplash.com/photo-1632345033839-8f25a74775b3' }}
                    style={styles.mainImage}
                    resizeMode="cover"
                />
                <SafeAreaView style={styles.headerOverlay}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.roundButton}>
                        <ChevronLeft size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.roundButton}>
                        <Heart size={22} color={COLORS.error} />
                    </TouchableOpacity>
                </SafeAreaView>
            </View>

            <ScrollView
                style={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.contentCard}>
                    <View style={styles.titleRow}>
                        <Text style={styles.serviceName}>{service.name}</Text>
                        <View style={styles.ratingContainer}>
                            <Star size={16} color="#FFD700" fill="#FFD700" />
                            <Text style={styles.ratingText}>4.9</Text>
                        </View>
                    </View>

                    <View style={styles.statsRow}>
                        <View style={styles.stat}>
                            <View style={styles.statIconBadge}>
                                <Clock size={18} color={COLORS.primary} />
                            </View>
                            <Text style={styles.statLabel}>Durée</Text>
                            <Text style={styles.statValue}>{service.duration} min</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.stat}>
                            <View style={styles.statIconBadge}>
                                <Euro size={18} color={COLORS.primary} />
                            </View>
                            <Text style={styles.statLabel}>Prix</Text>
                            <Text style={styles.statValue}>{service.price} FCFA</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.stat}>
                            <View style={styles.statIconBadge}>
                                <ShieldCheck size={18} color={COLORS.primary} />
                            </View>
                            <Text style={styles.statLabel}>Qualité</Text>
                            <Text style={styles.statValue}>Premium</Text>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>À propos de ce soin</Text>
                        <Text style={styles.description}>
                            {service.description || "Profitez d'une expérience de soin des ongles exceptionnelle. Nos expertes utilisent des produits de haute qualité pour garantir un résultat durable et éclatant. Ce service comprend une préparation minutieuse et une finition parfaite."}
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Ce qui est inclus</Text>
                        <View style={styles.includeItem}>
                            <View style={styles.checkBadge}>
                                <Text style={styles.checkIcon}>✓</Text>
                            </View>
                            <Text style={styles.includeText}>Analyse personnalisée de l'ongle</Text>
                        </View>
                        <View style={styles.includeItem}>
                            <View style={styles.checkBadge}>
                                <Text style={styles.checkIcon}>✓</Text>
                            </View>
                            <Text style={styles.includeText}>Soin complet des cuticules</Text>
                        </View>
                        <View style={styles.includeItem}>
                            <View style={styles.checkBadge}>
                                <Text style={styles.checkIcon}>✓</Text>
                            </View>
                            <Text style={styles.includeText}>Modelage et finition soignée</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

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
                                <Text style={styles.modalTitle}>Réserver ce service</Text>
                                <Text style={styles.modalSubtitleLabel}>Sélectionnez vos préférences</Text>
                            </View>
                            <TouchableOpacity style={styles.closeBtn} onPress={() => setBookingModalVisible(false)}>
                                <X size={20} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        <LinearGradient
                            colors={['#7C4DFF20', '#7C4DFF05']}
                            style={styles.servicePreview}
                        >
                            <View>
                                <Text style={styles.previewName}>{service.name}</Text>
                                <Text style={styles.previewPrice}>{service.price} FCFA • {service.duration} min</Text>
                            </View>
                            <Clock size={20} color={COLORS.primary} opacity={0.5} />
                        </LinearGradient>

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

            <SafeAreaView style={styles.footer}>
                <View style={styles.priceSummary}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>{service.price} FCFA</Text>
                </View>
                <TouchableOpacity
                    style={styles.bookButton}
                    onPress={handleBook}
                >
                    <Calendar size={20} color={COLORS.white} />
                    <Text style={styles.bookButtonText}>Réserver </Text>
                </TouchableOpacity>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    imageHeader: {
        height: 350,
        width: width,
    },
    mainImage: {
        width: '100%',
        height: '100%',
    },
    headerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    roundButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 5,
    },
    scrollContainer: {
        flex: 1,
        marginTop: -40,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    contentCard: {
        backgroundColor: COLORS.background,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        padding: 24,
        minHeight: 500,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    serviceName: {
        fontSize: 28,
        color: COLORS.text,
        fontFamily: FONTS.extraBold,
        flex: 1,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF9E6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    ratingText: {
        marginLeft: 6,
        fontSize: 14,
        color: '#FFB800',
        fontFamily: FONTS.bold,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.secondary,
        padding: 20,
        borderRadius: 24,
        marginBottom: 32,
    },
    stat: {
        flex: 1,
        alignItems: 'center',
    },
    divider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(155, 103, 255, 0.2)',
    },
    statIconBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontFamily: FONTS.medium,
        marginBottom: 2,
    },
    statValue: {
        fontSize: 15,
        color: COLORS.text,
        fontFamily: FONTS.bold,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 20,
        color: COLORS.text,
        fontFamily: FONTS.bold,
        marginBottom: 16,
    },
    description: {
        fontSize: 16,
        lineHeight: 26,
        color: COLORS.textSecondary,
        fontFamily: FONTS.medium,
    },
    includeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    checkBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#E8FFF1',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    checkIcon: {
        color: '#4CAF50',
        fontSize: 14,
    },
    includeText: {
        fontSize: 16,
        color: COLORS.text,
        fontFamily: FONTS.medium,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.white,
        paddingHorizontal: 24,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    priceSummary: {
        flex: 1,
    },
    totalLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
        fontFamily: FONTS.medium,
    },
    totalValue: {
        fontSize: 24,
        color: COLORS.primary,
        fontFamily: FONTS.bold,
    },
    bookButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 20,
        height: 60,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    bookButtonText: {
        color: COLORS.white,
        fontSize: 18,
        fontFamily: FONTS.bold,
        marginLeft: 10,
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
        height: 90,
        borderRadius: 20,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F0F0F0',
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
        backgroundColor: COLORS.white,
        minWidth: 70,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F0F0F0',
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
        marginLeft: 8,
    },
});
