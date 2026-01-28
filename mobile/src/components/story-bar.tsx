import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Modal, Dimensions, ActivityIndicator, Alert, Platform, Pressable, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storiesApi, API_URL } from '@/services/api.service';
import { COLORS, FONTS } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Plus, Camera } from 'lucide-react-native';
import { useAuth } from '@/services/auth.context';
import * as ImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get('window');

import { useFocusEffect } from '@react-navigation/native';

export const StoryBar = () => {
    const { user } = useAuth();
    const [stories, setStories] = useState<any[]>([]);
    const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [currentProgress, setCurrentProgress] = useState(0);
    const [paused, setPaused] = useState(false);
    const [seenStoryIds, setSeenStoryIds] = useState<string[]>([]);
    const [imageLoading, setImageLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            fetchStories();
            loadSeenStories();

            // Refresh stories every 30 seconds to show new ones immediately
            const interval = setInterval(fetchStories, 30000);

            return () => clearInterval(interval);
        }, [])
    );

    const loadSeenStories = async () => {
        try {
            const saved = await AsyncStorage.getItem('seen_stories');
            if (saved) {
                setSeenStoryIds(JSON.parse(saved));
            }
        } catch (e) {
            console.error('Error loading seen stories:', e);
        }
    };

    const fetchStories = async () => {
        try {
            const response = await storiesApi.getAll();
            setStories(response.data || []);
        } catch (error) {
            console.error('Error fetching stories:', error);
        }
    };

    // ... (rest of the functions: pickImage, uploadStory, etc. remain the same)
    // I will skip re-writing them to save space in the tool call if possible, 
    // but the tool requires the full ReplacementContent for the range.
    // Actually I'll keep them.

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission refusée', 'Désolé, nous avons besoin des permissions pour accéder à vos photos.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [9, 16],
            quality: 0.3,
        });

        if (!result.canceled) {
            uploadStory(result.assets[0]);
        }
    };

    const uploadStory = async (asset: any) => {
        if (!user) return;
        setUploading(true);

        try {
            console.log('[UPLOAD DEBUG] Story Asset URI:', asset.uri);
            const formData = new FormData();

            // Formatage URI robuste pour téléphone physique
            const uri = Platform.OS === 'android' ? asset.uri : asset.uri.replace('file://', '');
            const filename = asset.uri.split('/').pop() || `story_${Date.now()}.jpg`;
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image/jpeg`;

            formData.append('file', {
                uri: uri,
                name: filename,
                type: type,
            } as any);

            const response = await storiesApi.nativeUpload('stories/upload', formData);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Erreur serveur (${response.status})`);
            }

            const uploadRes = await response.json();
            const { url, publicId } = uploadRes;

            await storiesApi.create({
                imageUrl: url,
                publicId: publicId,
                userId: user.id,
                caption: '',
            });

            Alert.alert(`Succès`, `Votre story a été publiée !`);
            fetchStories();
        } catch (error: any) {
            console.error('Error uploading story:', error);
            const errorMessage = error.message || 'Erreur inconnue';
            // Version v2.0
            Alert.alert(`Erreur Upload (v2.0)`, `Impossible de publier la story : ${errorMessage}`);
        } finally {
            setUploading(false);
        }
    };

    const openStory = async (index: number) => {
        const storyId = stories[index].id;
        setSelectedStoryIndex(index);
        setModalVisible(true);

        if (!seenStoryIds.includes(storyId)) {
            const newSeen = [...seenStoryIds, storyId];
            setSeenStoryIds(newSeen);
            try {
                await AsyncStorage.setItem('seen_stories', JSON.stringify(newSeen));
            } catch (e) {
                console.error('Error saving seen story:', e);
            }
        }
    };

    const nextStory = () => {
        if (selectedStoryIndex !== null && selectedStoryIndex < stories.length - 1) {
            setSelectedStoryIndex(selectedStoryIndex + 1);
        } else {
            setModalVisible(false);
        }
    };

    const prevStory = () => {
        if (selectedStoryIndex !== null && selectedStoryIndex > 0) {
            setSelectedStoryIndex(selectedStoryIndex - 1);
        }
    };

    useEffect(() => {
        let interval: any;
        if (modalVisible && !paused && !imageLoading) {
            interval = setInterval(() => {
                setCurrentProgress((prev) => {
                    if (prev >= 1) {
                        nextStory();
                        return 0;
                    }
                    return prev + 0.01;
                });
            }, 50);
        }
        return () => clearInterval(interval);
    }, [modalVisible, paused, selectedStoryIndex, imageLoading]);

    useEffect(() => {
        if (modalVisible) {
            setCurrentProgress(0);
            setPaused(false);
            setImageLoading(true);
        }
    }, [selectedStoryIndex, modalVisible]);

    if (stories.length === 0 && user?.role !== 'ADMIN') {
        return null;
    }

    return (
        <View style={styles.container}>
            <StatusBar
                hidden={modalVisible}
                backgroundColor="transparent"
                translucent
                barStyle="light-content"
                animated
            />
            <FlatList
                data={stories}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={() => (
                    user?.role === 'ADMIN' ? (
                        <TouchableOpacity
                            style={styles.storyItem}
                            onPress={pickImage}
                            disabled={uploading}
                        >
                            <View style={styles.addStoryCircle}>
                                <View style={styles.addStoryInner}>
                                    {uploading ? (
                                        <ActivityIndicator size="small" color={COLORS.primary} />
                                    ) : (
                                        <Plus size={28} color={COLORS.primary} />
                                    )}
                                </View>
                                <View style={styles.plusBadge}>
                                    <Camera size={12} color={COLORS.white} />
                                </View>
                            </View>
                            <Text style={styles.artistName} numberOfLines={1}>
                                Ajouter
                            </Text>
                        </TouchableOpacity>
                    ) : null
                )}
                renderItem={({ item, index }) => (
                    <TouchableOpacity style={styles.storyItem} onPress={() => openStory(index)}>
                        {seenStoryIds.includes(item.id) ? (
                            <View style={styles.storyRingSeen}>
                                <View style={styles.imageContainer}>
                                    <Image source={{ uri: item.imageUrl }} style={styles.storyImage} />
                                </View>
                            </View>
                        ) : (
                            <LinearGradient
                                colors={[COLORS.primary, '#A78BFF']}
                                style={styles.storyRing}
                            >
                                <View style={styles.imageContainer}>
                                    <Image source={{ uri: item.imageUrl }} style={styles.storyImage} />
                                </View>
                            </LinearGradient>
                        )}
                    </TouchableOpacity>
                )}
            />

            <Modal
                visible={modalVisible}
                transparent={false}
                animationType="fade"
                statusBarTranslucent
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    {selectedStoryIndex !== null && stories[selectedStoryIndex] && (
                        <>
                            <Image
                                source={{ uri: stories[selectedStoryIndex].imageUrl }}
                                style={styles.fullImage}
                                resizeMode="cover"
                                onLoadStart={() => setImageLoading(true)}
                                onLoadEnd={() => setImageLoading(false)}
                            />

                            {imageLoading && (
                                <View style={styles.loaderOverlay}>
                                    <ActivityIndicator size="large" color={COLORS.white} />
                                </View>
                            )}

                            <LinearGradient
                                colors={['rgba(0,0,0,0.6)', 'transparent']}
                                style={styles.topGradient}
                            />

                            <LinearGradient
                                colors={['transparent', 'rgba(0,0,0,0.8)']}
                                style={styles.bottomGradient}
                            />

                            <View style={styles.storyHeader}>
                                <View style={styles.progressContainer}>
                                    {stories.map((_, i) => (
                                        <View key={i} style={styles.progressBarBg}>
                                            <View
                                                style={[
                                                    styles.progressBarFill,
                                                    {
                                                        width: i < selectedStoryIndex ? '100%' : i === selectedStoryIndex ? `${currentProgress * 100}%` : '0%'
                                                    }
                                                ]}
                                            />
                                        </View>
                                    ))}
                                </View>
                                <View style={styles.headerInfo}>
                                    <View style={styles.userInfo}>
                                        <View style={styles.miniAvatar}>
                                            <Text style={styles.avatarLetter}>N</Text>
                                        </View>
                                        <View>
                                            <Text style={styles.userName}>Nails Divine Grâce</Text>
                                            <Text style={styles.timeAgo}>Story</Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                                        <X color={COLORS.white} size={24} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {stories[selectedStoryIndex].caption && (
                                <View style={styles.captionContainer}>
                                    <Text style={styles.caption}>{stories[selectedStoryIndex].caption}</Text>
                                </View>
                            )}

                            <View style={styles.navigationZones}>
                                <Pressable
                                    style={styles.prevZone}
                                    onPress={prevStory}
                                    onPressIn={() => setPaused(true)}
                                    onPressOut={() => setPaused(false)}
                                />
                                <Pressable
                                    style={styles.nextZone}
                                    onPress={nextStory}
                                    onPressIn={() => setPaused(true)}
                                    onPressOut={() => setPaused(false)}
                                />
                            </View>
                        </>
                    )}
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 10,
        backgroundColor: 'transparent',
    },
    horizontalScroll: {
        flexDirection: 'row',
        paddingHorizontal: 20,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 5,
    },
    storyItem: {
        alignItems: 'center',
        marginRight: 15,
        width: 76,
    },
    addStoryCircle: {
        width: 76,
        height: 76,
        borderRadius: 38,
        borderWidth: 2,
        borderColor: '#EEE',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
    addStoryInner: {
        width: 66,
        height: 66,
        borderRadius: 33,
        backgroundColor: COLORS.secondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    plusBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: COLORS.primary,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    storyRing: {
        width: 76,
        height: 76,
        borderRadius: 38,
        padding: 3,
        justifyContent: 'center',
        alignItems: 'center',
    },
    storyRingSeen: {
        width: 76,
        height: 76,
        borderRadius: 38,
        padding: 3,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    imageContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: COLORS.white,
        padding: 2,
    },
    storyImage: {
        width: '100%',
        height: '100%',
        borderRadius: 33,
    },
    artistName: {
        marginTop: 6,
        fontSize: 12,
        fontFamily: FONTS.medium,
        color: COLORS.text,
        textAlign: 'center',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#000000',
    },
    fullImage: {
        width: width,
        height: height,
    },
    topGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 150,
    },
    bottomGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 200,
    },
    storyHeader: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        paddingHorizontal: 15,
    },
    progressContainer: {
        flexDirection: 'row',
        height: 3,
        marginBottom: 15,
        paddingHorizontal: 5,
    },
    progressBarBg: {
        flex: 1,
        height: '100%',
        backgroundColor: 'rgba(255,255,255,0.3)',
        marginHorizontal: 2,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: COLORS.white,
    },
    headerInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    miniAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        borderWidth: 1,
        borderColor: COLORS.white,
    },
    avatarLetter: {
        color: COLORS.white,
        fontFamily: FONTS.bold,
        fontSize: 18,
    },
    userName: {
        color: COLORS.white,
        fontFamily: FONTS.bold,
        fontSize: 16,
    },
    timeAgo: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        fontFamily: FONTS.medium,
    },
    closeButton: {
        padding: 5,
    },
    captionContainer: {
        position: 'absolute',
        bottom: 60,
        left: 20,
        right: 20,
        alignItems: 'center',
    },
    caption: {
        color: COLORS.white,
        fontSize: 18,
        fontFamily: FONTS.bold,
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10
    },
    navigationZones: {
        position: 'absolute',
        top: 100,
        bottom: 100,
        left: 0,
        right: 0,
        flexDirection: 'row',
    },
    prevZone: {
        flex: 1,
    },
    nextZone: {
        flex: 1,
    },
    loaderOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
});
