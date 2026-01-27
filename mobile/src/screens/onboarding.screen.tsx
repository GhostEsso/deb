import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, Dimensions, Image, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS } from '@/constants/theme';
import { ChevronRight } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export const OnboardingScreen = ({ navigation }: any) => {
    return (
        <View style={styles.container}>
            <ImageBackground
                source={require('../../assets/onboarding-bg.png')}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
            >
                <LinearGradient
                    colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.95)']}
                    style={StyleSheet.absoluteFill}
                />

                <SafeAreaView style={styles.content} edges={['top', 'bottom']}>
                    <View style={styles.topSection}>
                        <View style={styles.logoContainer}>
                            <Image
                                source={require('../../assets/images/logo.png')}
                                style={styles.logoImage}
                                resizeMode="contain"
                            />
                        </View>
                    </View>

                    <View style={styles.bottomSection}>
                        <View style={styles.textContainer}>
                            <Text style={styles.welcomeText}>Bienvenue chez</Text>
                            <Text style={styles.brandText}>Nails by Divine Grâce</Text>

                            <View style={styles.divider} />

                            <Text style={styles.descriptionText}>
                                Choisissez un ou plusieurs de nos services, réservez votre passage, puis passez chez nous...
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.button}
                            onPress={() => navigation.replace('ServiceList')}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.buttonText}>Découvrir nos services</Text>
                            <View style={styles.buttonIcon}>
                                <ChevronRight size={20} color={COLORS.primary} />
                            </View>
                        </TouchableOpacity>

                        <Text style={styles.footerText}>Une expérience de beauté unique</Text>
                    </View>
                </SafeAreaView>
            </ImageBackground>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        paddingHorizontal: 30,
    },
    topSection: {
        alignItems: 'center',
        marginTop: 40, // Increased for better spacing with edge-to-edge
    },
    logoContainer: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
    },
    logoImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'white', // Ensure it stands out if transparent
    },
    bottomSection: {
        marginBottom: 40, // Increased for better spacing with nav bar
    },
    textContainer: {
        marginBottom: 30,
    },
    welcomeText: {
        fontSize: 20,
        color: COLORS.text,
        fontFamily: FONTS.medium,
        marginBottom: 4,
    },
    brandText: {
        fontSize: 42,
        color: COLORS.text,
        fontFamily: FONTS.extraBold,
        lineHeight: 48,
    },
    divider: {
        width: 60,
        height: 4,
        backgroundColor: COLORS.primary,
        borderRadius: 2,
        marginVertical: 20,
    },
    descriptionText: {
        fontSize: 18,
        color: COLORS.textSecondary,
        fontFamily: FONTS.medium,
        lineHeight: 28,
        letterSpacing: 0.3,
    },
    button: {
        backgroundColor: COLORS.text,
        height: 64,
        borderRadius: 32,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 8,
    },
    buttonText: {
        color: COLORS.white,
        fontSize: 18,
        fontFamily: FONTS.bold,
    },
    buttonIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerText: {
        textAlign: 'center',
        marginTop: 24,
        color: COLORS.textSecondary,
        fontFamily: 'Urbanist-Medium',
        fontSize: 14,
        opacity: 0.7,
    }
});
