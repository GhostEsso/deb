import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/theme';
import { ChevronLeft, ImageIcon, Clock, AlignLeft, Check } from 'lucide-react-native';
import { servicesApi } from '@/services/api.service';
import * as ImagePicker from 'expo-image-picker';

export const AdminServiceFormScreen = ({ navigation, route }: any) => {
    const { service } = route.params || {};
    const isEdit = !!service;

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: service?.name || '',
        description: service?.description || '',
        price: service?.price?.toString() || '',
        duration: service?.duration?.toString() || '',
        imageUrl: service?.imageUrl || '',
    });

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission requise', 'Nous avons besoin de votre permission pour accéder à vos photos.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setLoading(true);
            try {
                const asset = result.assets[0];
                const formDataImage = new FormData();

                // Construct file object for FormData
                const localUri = asset.uri;
                const filename = localUri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename || '');
                const type = match ? `image/${match[1]}` : `image`;

                // @ts-ignore
                formDataImage.append('file', { uri: localUri, name: filename, type });

                const response = await servicesApi.uploadImage(formDataImage);
                setFormData({ ...formData, imageUrl: response.data.url });
            } catch (error) {
                console.error('Upload Error:', error);
                Alert.alert('Erreur', 'Impossible d\'uploader l\'image');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleSave = async () => {
        if (!formData.name || !formData.price || !formData.duration) {
            Alert.alert('Erreur', 'Veuillez remplir les champs obligatoires (*)');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...formData,
                price: parseFloat(formData.price),
                duration: parseInt(formData.duration),
            };

            if (isEdit) {
                await servicesApi.update(service.id, payload);
            } else {
                await servicesApi.create(payload);
            }

            Alert.alert('Succès', `Service ${isEdit ? 'mis à jour' : 'créé'} avec succès`);
            navigation.goBack();
        } catch (error: any) {
            Alert.alert('Erreur', error.response?.data?.message || 'Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.circleButton} onPress={() => navigation.goBack()}>
                        <ChevronLeft size={22} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{isEdit ? 'Modifier Service' : 'Nouveau Service'}</Text>
                    <TouchableOpacity style={[styles.circleButton, styles.saveButton]} onPress={handleSave}>
                        {loading ? (
                            <ActivityIndicator size="small" color={COLORS.white} />
                        ) : (
                            <Check size={20} color={COLORS.white} />
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                    {/* Image Selector */}
                    <TouchableOpacity style={styles.imageSelector} onPress={handlePickImage} disabled={loading}>
                        {formData.imageUrl ? (
                            <Image source={{ uri: formData.imageUrl }} style={styles.previewImage} />
                        ) : (
                            <View style={styles.placeholderImage}>
                                <ImageIcon size={48} color={COLORS.textSecondary} />
                                <Text style={styles.placeholderText}>Ajouter une image</Text>
                            </View>
                        )}
                        <View style={styles.imageEditBadge}>
                            <ImageIcon size={16} color={COLORS.white} />
                        </View>
                    </TouchableOpacity>

                    {/* Form Fields */}
                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Nom du service *</Text>
                            <View style={styles.inputContainer}>
                                <AlignLeft size={20} color={COLORS.textSecondary} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="ex: Vernis Gel"
                                    value={formData.name}
                                    onChangeText={(t) => setFormData({ ...formData, name: t })}
                                />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Prix (FCFA) *</Text>
                                <View style={styles.inputContainer}>
                                    <View style={styles.priceSymbol}><Text style={styles.symbolText}>CFA</Text></View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="0"
                                        keyboardType="numeric"
                                        value={formData.price}
                                        onChangeText={(t) => setFormData({ ...formData, price: t })}
                                    />
                                </View>
                            </View>
                            <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                                <Text style={styles.label}>Durée (min) *</Text>
                                <View style={styles.inputContainer}>
                                    <Clock size={20} color={COLORS.textSecondary} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="30"
                                        keyboardType="numeric"
                                        value={formData.duration}
                                        onChangeText={(t) => setFormData({ ...formData, duration: t })}
                                    />
                                </View>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Description</Text>
                            <View style={[styles.inputContainer, styles.textArea]}>
                                <TextInput
                                    style={[styles.input, styles.textAreaInput]}
                                    placeholder="Décrivez le service..."
                                    multiline
                                    numberOfLines={4}
                                    value={formData.description}
                                    onChangeText={(t) => setFormData({ ...formData, description: t })}
                                />
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.mainButton, loading && styles.disabledButton]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={COLORS.white} />
                        ) : (
                            <Text style={styles.mainButtonText}>{isEdit ? 'Enregistrer les modifications' : 'Créer le service'}</Text>
                        )}
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
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveButton: {
        backgroundColor: COLORS.primary,
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: 'Urbanist-Bold',
        color: COLORS.text,
    },
    content: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    imageSelector: {
        width: '100%',
        height: 200,
        borderRadius: 24,
        marginTop: 10,
        marginBottom: 24,
        overflow: 'hidden',
        backgroundColor: '#F8F8F8',
        borderWidth: 1,
        borderColor: '#E8E8E8',
        borderStyle: 'dashed',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    placeholderImage: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        marginTop: 12,
        fontSize: 14,
        fontFamily: 'Urbanist-SemiBold',
        color: COLORS.textSecondary,
    },
    imageEditBadge: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    form: {
        gap: 16,
    },
    inputGroup: {
        marginBottom: 8,
    },
    label: {
        fontSize: 14,
        fontFamily: 'Urbanist-SemiBold',
        color: COLORS.text,
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
        borderColor: '#E8E8E8',
    },
    priceSymbol: {
        backgroundColor: '#F8F4FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginRight: 8,
    },
    symbolText: {
        fontSize: 10,
        fontFamily: 'Urbanist-Bold',
        color: COLORS.primary,
    },
    input: {
        flex: 1,
        fontFamily: 'Urbanist-Medium',
        fontSize: 16,
        color: COLORS.text,
        marginLeft: 12,
    },
    textArea: {
        height: 120,
        alignItems: 'flex-start',
        paddingVertical: 12,
    },
    textAreaInput: {
        height: '100%',
        textAlignVertical: 'top',
        marginLeft: 0,
    },
    row: {
        flexDirection: 'row',
    },
    mainButton: {
        backgroundColor: COLORS.primary,
        height: 60,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 32,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
    },
    mainButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontFamily: 'Urbanist-Bold',
    },
    disabledButton: {
        opacity: 0.6,
    }
});
