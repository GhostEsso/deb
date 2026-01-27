import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { COLORS, FONTS } from '@/constants/theme';
import { Clock, Calendar } from 'lucide-react-native';

interface ServiceCardProps {
    name: string;
    description?: string;
    price: number;
    duration: number;
    imageUrl?: string;
    onPress: () => void;
    onBookPress?: () => void;
    viewMode?: 'grid' | 'list';
}

export const ServiceCard = ({
    name,
    description,
    price,
    duration,
    imageUrl,
    onPress,
    onBookPress,
    viewMode = 'list'
}: ServiceCardProps) => {
    const isGrid = viewMode === 'grid';

    return (
        <TouchableOpacity
            style={[styles.card, isGrid && styles.gridCard]}
            onPress={onPress}
            activeOpacity={0.9}
        >
            {imageUrl && (
                <Image
                    source={{ uri: imageUrl }}
                    style={[styles.image, isGrid && styles.gridImage]}
                    resizeMode="cover"
                />
            )}
            <View style={[styles.content, isGrid && styles.gridContent]}>
                <View style={[styles.header, isGrid && styles.gridHeader]}>
                    <Text style={[styles.name, isGrid && styles.gridName]} numberOfLines={isGrid ? 1 : 2}>{name}</Text>
                    <Text style={[styles.price, isGrid && styles.gridPrice]}>{price} FCFA</Text>
                </View>

                {!isGrid && description && (
                    <Text style={styles.description} numberOfLines={2}>
                        {description}
                    </Text>
                )}

                <View style={[styles.footer, isGrid && styles.gridFooter]}>
                    <View style={styles.infoRow}>
                        <View style={styles.durationContainer}>
                            <Clock size={14} color={COLORS.textSecondary} />
                            <Text style={styles.duration}>{duration} min</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.bookButton, isGrid && styles.gridBookButton]}
                        onPress={(e) => {
                            e.stopPropagation();
                            onBookPress?.();
                        }}
                    >
                        <Calendar size={14} color={COLORS.white} />
                        <Text style={styles.bookButtonText}>Réserver</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 24,
        marginBottom: 16,
        flexDirection: 'row',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 15,
        elevation: 5,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F5F5F5',
    },
    gridCard: {
        flexDirection: 'column',
        width: (Dimensions.get('window').width - 58) / 2, // 24*2 padding + 10 gap
        marginBottom: 10,
    },
    image: {
        width: 100,
        height: '100%',
    },
    gridImage: {
        width: '100%',
        height: 120,
    },
    content: {
        flex: 1,
        padding: 12,
        justifyContent: 'center',
    },
    gridContent: {
        padding: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    gridHeader: {
        flexDirection: 'column',
        marginBottom: 6,
    },
    name: {
        fontSize: 16,
        fontFamily: FONTS.bold,
        color: COLORS.text,
        flex: 1,
        marginRight: 8,
    },
    gridName: {
        fontSize: 14,
        fontFamily: FONTS.extraBold,
        marginBottom: 2,
        marginRight: 0,
    },
    price: {
        fontSize: 16,
        fontFamily: FONTS.extraBold,
        color: COLORS.primary,
    },
    gridPrice: {
        fontSize: 15,
        marginBottom: 4,
    },
    description: {
        fontSize: 13,
        color: COLORS.textSecondary,
        fontFamily: FONTS.medium,
        lineHeight: 18,
        marginBottom: 10,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    gridFooter: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 8,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    durationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    duration: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginLeft: 4,
        fontFamily: FONTS.medium,
    },
    bookButton: {
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    gridBookButton: {
        width: '100%',
        justifyContent: 'center',
        paddingVertical: 8,
    },
    bookButtonText: {
        color: COLORS.white,
        fontSize: 12,
        fontFamily: FONTS.bold,
        marginLeft: 4,
    },
});
