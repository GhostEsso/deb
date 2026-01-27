import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    Alert,
} from 'react-native';
import * as Updates from 'expo-updates';
import Constants from 'expo-constants';
import { Download, CheckCircle2, X, RefreshCw } from 'lucide-react-native';
import { COLORS, FONTS } from '@/constants/theme';

const { width } = Dimensions.get('window');

export const UpdateModal = () => {
    const [visible, setVisible] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [downloaded, setDownloaded] = useState(false);

    useEffect(() => {
        console.log('[Update] Initializing update check...');

        // TEST VISUEL : On affiche la modale pendant 2 secondes au lancement
        // pour confirmer que le composant fonctionne graphiquement.
        setVisible(true);
        const timer = setTimeout(() => {
            // Après 2s, on vérifie s'il y a une VRAIE mise à jour avant de cacher
            Updates.checkForUpdateAsync()
                .then(update => {
                    if (!update.isAvailable) setVisible(false);
                })
                .catch(() => setVisible(false));
        }, 2000);

        checkUpdate();

        return () => clearTimeout(timer);
    }, []);

    const checkUpdate = async () => {
        try {
            const update = await Updates.checkForUpdateAsync();
            console.log('[Update] Vérification automatique - Disponible:', update.isAvailable);
            if (update.isAvailable) {
                setVisible(true);
            }
        } catch (error) {
            console.log('[Update] Erreur de vérification OTA:', error);
        }
    };

    const handleUpdate = async () => {
        if (downloaded) {
            await Updates.reloadAsync();
            return;
        }

        try {
            setDownloading(true);
            await Updates.fetchUpdateAsync();
            setDownloaded(true);
            setDownloading(false);

            Alert.alert(
                "Mise à jour prête",
                "L'application va maintenant redémarrer pour appliquer les changements.",
                [{ text: "OK", onPress: () => Updates.reloadAsync() }]
            );
        } catch (error) {
            setDownloading(false);
            Alert.alert("Erreur", "La mise à jour en direct a échoué.");
            console.error('[Update] Erreur fetch:', error);
        }
    };

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {!downloading && (
                        <TouchableOpacity
                            style={styles.closeBtn}
                            onPress={() => setVisible(false)}
                        >
                            <X size={20} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    )}

                    <View style={[styles.iconContainer, { borderColor: 'red', borderWidth: 5 }]}>
                        <Text style={{ color: 'red', fontWeight: 'bold' }}>FORCE TEST</Text>
                        {downloaded ? (
                            <CheckCircle2 size={48} color={COLORS.success} />
                        ) : (
                            <RefreshCw size={48} color={COLORS.primary} />
                        )}
                    </View>

                    <Text style={styles.title}>Nouvelle version disponible !</Text>

                    <Text style={styles.description}>
                        Une mise à jour rapide est disponible pour améliorer votre expérience NailsDG.
                    </Text>

                    {downloading ? (
                        <View style={styles.progressSection}>
                            <ActivityIndicator size="large" color={COLORS.primary} />
                            <Text style={styles.progressText}>Téléchargement en cours...</Text>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.updateBtn} onPress={handleUpdate}>
                            <Text style={styles.updateBtnText}>
                                {downloaded ? "Relancer l'application" : "Mettre à jour maintenant"}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {!downloading && (
                        <TouchableOpacity style={styles.skipBtn} onPress={() => setVisible(false)}>
                            <Text style={styles.skipBtnText}>Plus tard</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    container: {
        width: '100%',
        backgroundColor: COLORS.white,
        borderRadius: 32,
        padding: 32,
        alignItems: 'center',
    },
    closeBtn: {
        position: 'absolute',
        top: 20,
        right: 20,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontFamily: FONTS.bold,
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: 8,
    },
    versionText: {
        fontSize: 16,
        fontFamily: FONTS.medium,
        color: COLORS.primary,
        marginBottom: 16,
    },
    description: {
        fontSize: 15,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    progressSection: {
        width: '100%',
        alignItems: 'center',
    },
    progressBarBg: {
        width: '100%',
        height: 10,
        backgroundColor: '#F0F0F0',
        borderRadius: 5,
        overflow: 'hidden',
        marginBottom: 10,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: COLORS.primary,
    },
    progressText: {
        fontSize: 14,
        fontFamily: FONTS.bold,
        color: COLORS.primary,
    },
    updateBtn: {
        width: '100%',
        height: 60,
        backgroundColor: COLORS.primary,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    updateBtnText: {
        color: COLORS.white,
        fontSize: 16,
        fontFamily: FONTS.bold,
    },
    skipBtn: {
        marginTop: 20,
    },
    skipBtnText: {
        fontSize: 14,
        fontFamily: FONTS.medium,
        color: COLORS.textSecondary,
    }
});
