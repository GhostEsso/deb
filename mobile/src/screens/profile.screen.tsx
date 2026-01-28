import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Dimensions, ActivityIndicator, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/theme';
import { ChevronLeft, User, Mail, Lock, LogOut, Calendar, Save, Edit2, Loader2, Layout, Plus, Package, Trash2, Image as ImageIcon, Check, XCircle, X, Phone, BarChart3, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/services/auth.context';
import { usersApi, bookingsApi, servicesApi, API_URL } from '@/services/api.service';
import { useFocusEffect } from '@react-navigation/native';

export const ProfileScreen = ({ navigation }: any) => {
    const { user, signOut, updateProfile, updateProfilePicture } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [bookings, setBookings] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [loadingBookings, setLoadingBookings] = useState(true);
    const [loadingServices, setLoadingServices] = useState(false);
    const isAdmin = user?.role === 'ADMIN';

    useFocusEffect(
        React.useCallback(() => {
            fetchBookings();
            if (isAdmin) fetchServices();

            // Rafraîchissement automatique toutes les 20 secondes
            const interval = setInterval(() => {
                fetchBookings();
                if (isAdmin) fetchServices();
            }, 20000);

            return () => clearInterval(interval);
        }, [isAdmin])
    );

    const fetchServices = async () => {
        setLoadingServices(true);
        try {
            const response = await servicesApi.getAll();
            setServices(response.data);
        } catch (error) {
            console.error('Error fetching services:', error);
        } finally {
            setLoadingServices(false);
        }
    };

    const fetchBookings = async () => {
        if (!user) return;
        try {
            const response = isAdmin ? await bookingsApi.getAll() : await bookingsApi.getByUser(user.id);
            setBookings(response.data.items || []);
        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setLoadingBookings(false);
        }
    };

    const [formData, setFormData] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        phoneNumber: user?.phoneNumber || '',
    });

    const handleUpdateBookingStatus = async (id: string, status: 'ACCEPTED' | 'REFUSED' | 'CANCELLED' | 'COMPLETED', reason?: string) => {
        try {
            await bookingsApi.updateStatus(id, status, reason);
            let message = '';
            if (status === 'ACCEPTED') message = 'Réservation acceptée';
            else if (status === 'REFUSED') message = 'Réservation refusée';
            else if (status === 'CANCELLED') message = 'Réservation annulée';
            else if (status === 'COMPLETED') message = 'Service marqué comme terminé';

            Alert.alert('Succès', message);
            fetchBookings();
        } catch (error: any) {
            Alert.alert('Erreur', error.response?.data?.message || 'Une erreur est survenue');
        }
    };

    const promptRefusal = (id: string, isAlreadyAccepted: boolean) => {
        Alert.prompt(
            isAlreadyAccepted ? 'Annuler la réservation' : 'Refuser la réservation',
            'Veuillez indiquer le motif du refus :',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Confirmer',
                    onPress: (reason) => handleUpdateBookingStatus(id, isAlreadyAccepted ? 'CANCELLED' : 'REFUSED', reason),
                    style: 'destructive'
                }
            ],
            'plain-text'
        );
    };

    const handleSelectProfilePicture = async () => {
        if (!user) return;
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission refusée', 'Nous avons besoin de votre permission pour accéder à vos photos.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.3,
        });

        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            setUploadingImage(true);

            try {
                const formData = new FormData();
                const uri = Platform.OS === 'android' ? asset.uri : asset.uri.replace('file://', '');
                const filename = asset.uri.split('/').pop() || 'profile.jpg';
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image/jpeg`;

                formData.append('file', {
                    uri: uri,
                    name: filename,
                    type,
                } as any);

                const response = await usersApi.nativeUpload(`${user.id}/profile-picture`, formData);
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || `Erreur serveur (${response.status})`);
                }

                Alert.alert('Succès', 'Photo de profil mise à jour');
            } catch (error: any) {
                const errorMessage = error.message || 'Erreur inconnue';
                const fullUrl = `${API_URL}/users/${user.id}/profile-picture`;
                // Version v2.0
                Alert.alert('Erreur Upload (v2.0)', `Path: ${fullUrl}\n\nÉchec : ${errorMessage}`);
            } finally {
                setUploadingImage(false);
            }
        }
    };

    const handleDeleteProfilePicture = () => {
        if (!user?.profilePictureUrl) return;

        Alert.alert(
            'Supprimer la photo',
            'Êtes-vous sûr de vouloir supprimer votre photo de profil ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setUploadingImage(true);
                            const response = await usersApi.deleteProfilePicture(user.id);
                            if (response.data.success) {
                                // Mettre à jour le contexte auth avec le nouvel utilisateur (sans photo)
                                await updateProfile({}); // Trick pour rafraîchir le contexte si nécessaire
                                Alert.alert('Succès', 'Photo supprimée');
                            }
                        } catch (error: any) {
                            Alert.alert('Erreur', 'Impossible de supprimer la photo');
                        } finally {
                            setUploadingImage(false);
                        }
                    }
                }
            ]
        );
    };

    const handleLogout = async () => {
        Alert.alert(
            'Déconnexion',
            'Êtes-vous sûr de vouloir vous déconnecter ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Déconnexion',
                    style: 'destructive',
                    onPress: async () => {
                        await signOut();
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'ServiceList' }],
                        });
                    }
                }
            ]
        );
    };

    const handleUpdateProfile = async () => {
        try {
            await updateProfile({
                firstName: formData.firstName,
                lastName: formData.lastName,
            });
            Alert.alert('Succès', 'Profil mis à jour avec succès');
            setIsEditing(false);
        } catch (error: any) {
            Alert.alert('Erreur', error.message);
        }
    };

    const handleDeleteService = (id: string) => {
        Alert.alert(
            'Supprimer le service',
            'Êtes-vous sûr de vouloir supprimer ce service ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await servicesApi.delete(id);
                            fetchServices();
                        } catch (error) {
                            Alert.alert('Erreur', 'Impossible de supprimer le service');
                        }
                    }
                }
            ]
        );
    };

    const MockBookings = [
        { id: 1, service: 'Vernis semi-permanent', date: '15 Jan 14:00', status: 'Confirmé', price: '25€' },
        { id: 2, service: 'Manucure complète', date: '20 Dec 10:00', status: 'Terminé', price: '45€' },
    ];

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[COLORS.secondary, COLORS.white]}
                style={StyleSheet.absoluteFill}
            />
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.circleButton} onPress={() => navigation.goBack()}>
                        <ChevronLeft size={22} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Mon Profil</Text>
                    <View style={{ width: 44 }}>
                        {isEditing ? (
                            <TouchableOpacity
                                style={[styles.circleButton, styles.saveButtonActive]}
                                onPress={handleUpdateProfile}
                            >
                                <Save size={20} color={COLORS.white} />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={styles.circleButton}
                                onPress={() => setIsEditing(true)}
                            >
                                <Edit2 size={20} color={COLORS.text} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

                    {/* Avatar Section */}
                    <View style={styles.avatarSection}>
                        <TouchableOpacity
                            style={styles.avatarContainer}
                            onPress={handleSelectProfilePicture}
                            disabled={uploadingImage}
                        >
                            {uploadingImage ? (
                                <ActivityIndicator color={COLORS.white} />
                            ) : user?.profilePictureUrl ? (
                                <Image
                                    source={{ uri: user.profilePictureUrl }}
                                    style={styles.avatarImage}
                                />
                            ) : (
                                <Text style={styles.avatarText}>
                                    {user?.firstName?.charAt(0).toUpperCase()}
                                    {user?.lastName?.charAt(0).toUpperCase()}
                                </Text>
                            )}
                            <View style={styles.cameraIconContainer}>
                                <Camera size={14} color={COLORS.white} />
                            </View>
                            {user?.profilePictureUrl && (
                                <TouchableOpacity
                                    style={styles.deleteImageIconContainer}
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        handleDeleteProfilePicture();
                                    }}
                                >
                                    <Trash2 size={12} color={COLORS.white} />
                                </TouchableOpacity>
                            )}
                        </TouchableOpacity>
                        <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
                        <Text style={styles.userEmail}>{user?.email}</Text>
                    </View>

                    {/* Personal Info Form */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Informations Personnelles</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Prénom</Text>
                            <View style={[styles.inputContainer, !isEditing && styles.disabledInput]}>
                                <User size={20} color={COLORS.textSecondary} />
                                <TextInput
                                    style={styles.input}
                                    value={formData.firstName}
                                    onChangeText={(t) => setFormData({ ...formData, firstName: t })}
                                    editable={isEditing}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Nom</Text>
                            <View style={[styles.inputContainer, !isEditing && styles.disabledInput]}>
                                <User size={20} color={COLORS.textSecondary} />
                                <TextInput
                                    style={styles.input}
                                    value={formData.lastName}
                                    onChangeText={(t) => setFormData({ ...formData, lastName: t })}
                                    editable={isEditing}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email (Non modifiable)</Text>
                            <View style={[styles.inputContainer, styles.disabledInput]}>
                                <Mail size={20} color={COLORS.textSecondary} />
                                <TextInput
                                    style={styles.input}
                                    value={formData.email}
                                    editable={false}
                                />
                            </View>
                        </View>

                        {isEditing ? (
                            <TouchableOpacity style={styles.mainSaveButton} onPress={handleUpdateProfile}>
                                <Text style={styles.mainSaveButtonText}>Enregistrer les modifications</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={styles.changePasswordBtn} onPress={() => Alert.alert('Info', 'Fonctionnalité à venir')}>
                                <Lock size={20} color={COLORS.primary} />
                                <Text style={styles.changePasswordText}>Changer mot de passe</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    {/* Admin Dashboard Section */}
                    {isAdmin && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeaderInner}>
                                <Text style={styles.sectionTitle}>Tableau de Bord Admin</Text>
                            </View>

                            <View style={{ flexDirection: 'row', gap: 10, marginTop: 15, marginBottom: 5 }}>
                                <TouchableOpacity
                                    style={[styles.addButton, { backgroundColor: '#2196F3', flex: 1, justifyContent: 'center' }]}
                                    onPress={() => navigation.navigate('Accounting')}
                                >
                                    <BarChart3 size={18} color={COLORS.white} />
                                    <Text style={styles.addButtonText}>Comptabilité</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.addButton, { flex: 1, justifyContent: 'center' }]}
                                    onPress={() => navigation.navigate('AdminServiceCreate')}
                                >
                                    <Plus size={18} color={COLORS.white} />
                                    <Text style={styles.addButtonText}>Nouveau Service</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.adminStatsRow}>
                                <View style={styles.adminStatCard}>
                                    <Package size={20} color={COLORS.primary} />
                                    <Text style={styles.adminStatValue}>{services.length}</Text>
                                    <Text style={styles.adminStatLabel}>Services</Text>
                                </View>
                                <View style={styles.adminStatCard}>
                                    <Calendar size={20} color={COLORS.primary} />
                                    <Text style={styles.adminStatValue}>{bookings.length}</Text>
                                    <Text style={styles.adminStatLabel}>RDV Totaux</Text>
                                </View>
                            </View>

                            <Text style={[styles.sectionTitle, { marginTop: 16, fontSize: 16 }]}>Gérer les Services</Text>
                            {loadingServices ? (
                                <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 20 }} />
                            ) : services.length === 0 ? (
                                <Text style={styles.emptyTextSmall}>Aucun service créé.</Text>
                            ) : (
                                services.map((service) => (
                                    <View key={service.id} style={styles.adminServiceCard}>
                                        <View style={styles.adminServiceInfo}>
                                            <Text style={styles.adminServiceName} numberOfLines={1}>{service.name}</Text>
                                            <Text style={styles.adminServicePrice}>{service.price} FCFA • {service.duration}min</Text>
                                        </View>
                                        <View style={styles.adminActions}>
                                            <TouchableOpacity
                                                onPress={() => navigation.navigate('AdminServiceEdit', { service })}
                                                style={styles.adminActionButton}
                                            >
                                                <Edit2 size={16} color={COLORS.primary} />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => handleDeleteService(service.id)}
                                                style={[styles.adminActionButton, { backgroundColor: '#FFF0F0' }]}
                                            >
                                                <Trash2 size={16} color="#FF4444" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))
                            )}
                        </View>
                    )}
                    {/* My Bookings Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{isAdmin ? 'Tous les Rendez-vous' : 'Mes Réservations'}</Text>

                        {loadingBookings ? (
                            <View style={styles.loadingContainer}>
                                <Loader2 size={24} color={COLORS.primary} />
                                <Text style={styles.loadingText}>Chargement...</Text>
                            </View>
                        ) : bookings.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Calendar size={48} color="#EEE" />
                                <Text style={styles.emptyStateText}>Aucun rendez-vous pour le moment.</Text>
                            </View>
                        ) : (
                            bookings.map((booking) => (
                                <View key={booking.id} style={styles.bookingCard}>
                                    <View style={styles.bookingTop}>
                                        <View style={styles.bookingMainInfo}>
                                            <Text style={styles.bookingService}>{booking.service?.name}</Text>
                                            <View style={[
                                                styles.statusBadge,
                                                {
                                                    backgroundColor: booking.status === 'ACCEPTED' ? '#E8F5E9' :
                                                        booking.status === 'PENDING' ? '#FFF3E0' :
                                                            booking.status === 'REFUSED' ? '#FFEBEE' :
                                                                booking.status === 'COMPLETED' ? '#E3F2FD' : '#F5F5F5'
                                                }
                                            ]}>
                                                <Text style={[
                                                    styles.statusBadgeText,
                                                    {
                                                        color: booking.status === 'ACCEPTED' ? '#4CAF50' :
                                                            booking.status === 'PENDING' ? '#FF9800' :
                                                                booking.status === 'REFUSED' ? '#F44336' :
                                                                    booking.status === 'COMPLETED' ? '#2196F3' : '#888'
                                                    }
                                                ]}>
                                                    {booking.status === 'ACCEPTED' ? 'Acceptée' :
                                                        booking.status === 'PENDING' ? 'En attente' :
                                                            booking.status === 'REFUSED' ? 'Refusée' :
                                                                booking.status === 'CANCELLED' ? 'Annulée' :
                                                                    booking.status === 'COMPLETED' ? 'Terminée' : booking.status}
                                                </Text>
                                            </View>
                                        </View>
                                        <Text style={styles.bookingPrice}>{booking.service?.price} FCFA</Text>
                                    </View>

                                    <View style={styles.bookingDivider} />

                                    <View style={styles.bookingContent}>
                                        <View style={styles.bookingDetails}>
                                            <View style={styles.detailRow}>
                                                <Calendar size={14} color={COLORS.textSecondary} />
                                                <Text style={styles.detailText}>
                                                    {new Date(booking.date).toLocaleDateString('fr-FR', {
                                                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </Text>
                                            </View>
                                            {isAdmin && (
                                                <>
                                                    <View style={[styles.detailRow, { marginTop: 4 }]}>
                                                        <User size={14} color={COLORS.textSecondary} />
                                                        <Text style={styles.detailText}>Client : {booking.user?.firstName} {booking.user?.lastName}</Text>
                                                    </View>
                                                    {booking.user?.phoneNumber && (
                                                        <View style={[styles.detailRow, { marginTop: 2 }]}>
                                                            <Phone size={14} color={COLORS.textSecondary} />
                                                            <Text style={styles.detailText}>{booking.user.phoneNumber}</Text>
                                                        </View>
                                                    )}
                                                </>
                                            )}
                                        </View>

                                        {isAdmin && (
                                            <View style={styles.adminBookingActions}>
                                                {booking.status === 'PENDING' && (
                                                    <View style={styles.actionRow}>
                                                        <TouchableOpacity
                                                            style={[styles.miniBtn, { backgroundColor: '#E8F5E9' }]}
                                                            onPress={() => handleUpdateBookingStatus(booking.id, 'ACCEPTED')}
                                                        >
                                                            <Check size={18} color="#4CAF50" />
                                                        </TouchableOpacity>
                                                        <TouchableOpacity
                                                            style={[styles.miniBtn, { backgroundColor: '#FFEBEE' }]}
                                                            onPress={() => promptRefusal(booking.id, false)}
                                                        >
                                                            <X size={18} color="#F44336" />
                                                        </TouchableOpacity>
                                                    </View>
                                                )}
                                                {booking.status === 'ACCEPTED' && (
                                                    <View style={styles.actionRow}>
                                                        <TouchableOpacity
                                                            style={[styles.miniBtn, { backgroundColor: '#E3F2FD', width: 'auto', paddingHorizontal: 12, flexDirection: 'row', gap: 6 }]}
                                                            onPress={() => handleUpdateBookingStatus(booking.id, 'COMPLETED')}
                                                        >
                                                            <Check size={16} color="#2196F3" />
                                                            <Text style={{ fontSize: 13, fontFamily: 'Urbanist-Bold', color: '#2196F3' }}>Terminé</Text>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity
                                                            style={styles.cancelBookingBtn}
                                                            onPress={() => promptRefusal(booking.id, true)}
                                                        >
                                                            <XCircle size={16} color="#FF9800" />
                                                        </TouchableOpacity>
                                                    </View>
                                                )}
                                            </View>
                                        )}
                                    </View>

                                    {booking.cancellationReason && (
                                        <View style={styles.reasonContainer}>
                                            <Text style={styles.reasonTitle}>Motif du refus :</Text>
                                            <Text style={styles.reasonText}>{booking.cancellationReason}</Text>
                                        </View>
                                    )}
                                </View>
                            ))
                        )}
                    </View>

                    {/* Sign Out Button */}
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <LogOut size={20} color="#FF4444" />
                        <Text style={styles.logoutText}>Se déconnecter</Text>
                    </TouchableOpacity>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    circleButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    saveButtonActive: {
        backgroundColor: COLORS.primary,
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: 'Urbanist-Bold',
        color: COLORS.text,
    },
    content: {
        paddingBottom: 40,
    },
    avatarSection: {
        alignItems: 'center',
        marginVertical: 24,
    },
    avatarContainer: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 4,
        borderColor: COLORS.white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    avatarText: {
        fontSize: 36,
        fontFamily: 'Urbanist-Bold',
        color: COLORS.white,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 50,
    },
    cameraIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: COLORS.primary,
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.background,
    },
    deleteImageIconContainer: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#FF4444',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.background,
    },
    userName: {
        fontSize: 24,
        fontFamily: 'Urbanist-Bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 16,
        fontFamily: 'Urbanist-Medium',
        color: COLORS.textSecondary,
    },
    section: {
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: 'Urbanist-Bold',
        color: COLORS.text,
        marginBottom: 16,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontFamily: 'Urbanist-SemiBold',
        color: COLORS.textSecondary,
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 56,
        backgroundColor: COLORS.white,
        borderRadius: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    disabledInput: {
        backgroundColor: '#F9F9F9',
        borderColor: '#F0F0F0',
    },
    input: {
        flex: 1,
        marginLeft: 12,
        fontFamily: 'Urbanist-Medium',
        fontSize: 16,
        color: COLORS.text,
    },
    changePasswordBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: COLORS.white,
        borderRadius: 16,
        marginTop: 8,
        gap: 8,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    changePasswordText: {
        fontSize: 14,
        fontFamily: 'Urbanist-Bold',
        color: COLORS.primary,
    },
    mainSaveButton: {
        backgroundColor: COLORS.primary,
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    mainSaveButtonText: {
        color: COLORS.white,
        fontFamily: 'Urbanist-Bold',
        fontSize: 16,
    },
    bookingCard: {
        backgroundColor: COLORS.white,
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
    },
    bookingTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    bookingMainInfo: {
        flex: 1,
    },
    bookingService: {
        fontSize: 17,
        fontFamily: 'Urbanist-Bold',
        color: COLORS.text,
        marginBottom: 6,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusBadgeText: {
        fontSize: 11,
        fontFamily: 'Urbanist-Bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    bookingPrice: {
        fontSize: 18,
        fontFamily: 'Urbanist-Bold',
        color: COLORS.primary,
    },
    bookingDivider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginVertical: 12,
    },
    bookingContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bookingDetails: {
        flex: 1,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    detailText: {
        fontSize: 14,
        fontFamily: 'Urbanist-Medium',
        color: COLORS.textSecondary,
    },
    adminBookingActions: {
        marginLeft: 16,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 8,
    },
    miniBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelBookingBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF3E0',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        gap: 6,
    },
    cancelBookingText: {
        fontSize: 13,
        fontFamily: 'Urbanist-Bold',
        color: '#FF9800',
    },
    reasonContainer: {
        marginTop: 12,
        padding: 12,
        backgroundColor: '#FFF0F0',
        borderRadius: 12,
        borderLeftWidth: 3,
        borderLeftColor: '#F44336',
    },
    reasonTitle: {
        fontSize: 12,
        fontFamily: 'Urbanist-Bold',
        color: '#F44336',
        marginBottom: 2,
    },
    reasonText: {
        fontSize: 13,
        fontFamily: 'Urbanist-Medium',
        color: COLORS.textSecondary,
        fontStyle: 'italic',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 24,
        marginTop: 8,
        padding: 16,
        backgroundColor: '#FFF0F0',
        borderRadius: 16,
        gap: 8,
    },
    logoutText: {
        fontSize: 16,
        fontFamily: 'Urbanist-Bold',
        color: '#FF4444',
    },
    loadingContainer: {
        alignItems: 'center',
        padding: 40,
    },
    loadingText: {
        marginTop: 12,
        fontFamily: 'Urbanist-Medium',
        color: COLORS.textSecondary,
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
        backgroundColor: '#FAFAFA',
        borderRadius: 20,
    },
    emptyStateText: {
        marginTop: 16,
        fontFamily: 'Urbanist-Medium',
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    sectionHeaderInner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 4,
    },
    addButtonText: {
        fontSize: 12,
        fontFamily: 'Urbanist-Bold',
        color: COLORS.white,
    },
    adminStatsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    adminStatCard: {
        flex: 1,
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E8E8E8',
    },
    adminStatValue: {
        fontSize: 20,
        fontFamily: 'Urbanist-Bold',
        color: COLORS.text,
        marginTop: 8,
    },
    adminStatLabel: {
        fontSize: 12,
        fontFamily: 'Urbanist-Medium',
        color: COLORS.textSecondary,
    },
    emptyTextSmall: {
        fontSize: 14,
        fontFamily: 'Urbanist-Medium',
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginVertical: 10,
    },
    adminServiceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E8E8E8',
    },
    adminServiceInfo: {
        flex: 1,
    },
    adminServiceName: {
        fontSize: 15,
        fontFamily: 'Urbanist-Bold',
        color: COLORS.text,
    },
    adminServicePrice: {
        fontSize: 13,
        fontFamily: 'Urbanist-Medium',
        color: COLORS.textSecondary,
    },
    adminActions: {
        flexDirection: 'row',
        gap: 8,
    },
    adminActionButton: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: COLORS.secondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bookingUser: {
        fontSize: 14,
        fontFamily: 'Urbanist-SemiBold',
        color: COLORS.text,
        marginTop: 2,
    },
});

export default ProfileScreen;
