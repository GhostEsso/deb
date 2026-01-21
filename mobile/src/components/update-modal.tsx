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
    Platform
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import Constants from 'expo-constants';
import { Download, AlertTriangle, CheckCircle2, X } from 'lucide-react-native';
import { COLORS, FONTS } from '@/constants/theme';
import { versionApi } from '@/services/api.service';

const { width } = Dimensions.get('window');

export const UpdateModal = () => {
    const [visible, setVisible] = useState(false);
    const [updateInfo, setUpdateInfo] = useState<any>(null);
    const [downloading, setDownloading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [downloaded, setDownloaded] = useState(false);

    const currentVersion = Constants.expoConfig?.version || '1.0.0';

    useEffect(() => {
        checkUpdate();
    }, []);

    const checkUpdate = async () => {
        try {
            const response = await versionApi.getLatestVersion();
            const latest = response.data;

            if (latest.version !== currentVersion) {
                setUpdateInfo(latest);
                setVisible(true);
            }
        } catch (error) {
            console.error('[Update] Erreur lors de la vérification:', error);
        }
    };

    const handleUpdate = async () => {
        if (downloaded) {
            installApk();
            return;
        }

        if (Platform.OS !== 'android') {
            Alert.alert("Information", "Les mises à jour automatiques sont principalement pour Android.");
            return;
        }

        try {
            setDownloading(true);
            const fileUri = FileSystem.cacheDirectory + 'NailsDG_Update.apk';

            const downloadResumable = FileSystem.createDownloadResumable(
                updateInfo.apkUrl,
                fileUri,
                {},
                (downloadProgress) => {
                    const prog = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
                    setProgress(prog);
                }
            );

            const result = await downloadResumable.downloadAsync();

            if (result && result.uri) {
                setDownloaded(true);
                setDownloading(false);
                installApk();
            }
        } catch (error) {
            setDownloading(false);
            Alert.alert("Erreur", "Le téléchargement a échoué. Vérifiez votre connexion.");
            console.error('[Update] Erreur téléchargement:', error);
        }
    };

    const installApk = async () => {
        const fileUri = FileSystem.cacheDirectory + 'NailsDG_Update.apk';

        try {
            const contentUri = await FileSystem.getContentUriAsync(fileUri);

            await IntentLauncher.startActivityAsync('android.intent.action.INSTALL_PACKAGE', {
                data: contentUri,
                flags: 1,
                type: 'application/vnd.android.package-archive',
            });
        } catch (error) {
            console.error('[Update] Erreur installation:', error);
            // Fallback: essayer via Sharing si l'intent launcher échoue
            await Sharing.shareAsync(fileUri);
        }
    };

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {!updateInfo?.forceUpdate && (
                        <TouchableOpacity
                            style={styles.closeBtn}
                            onPress={() => setVisible(false)}
                            disabled={downloading}
                        >
                            <X size={20} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    )}

                    <View style={styles.iconContainer}>
                        {downloaded ? (
                            <CheckCircle2 size={48} color={COLORS.success} />
                        ) : (
                            <Download size={48} color={COLORS.primary} />
                        )}
                    </View>

                    <Text style={styles.title}>Mise à jour disponible</Text>
                    <Text style={styles.versionText}>Version {updateInfo?.version} 🚀</Text>

                    <Text style={styles.description}>
                        {updateInfo?.notes || "Une nouvelle version de NailsDG est disponible avec des améliorations."}
                    </Text>

                    {downloading ? (
                        <View style={styles.progressSection}>
                            <View style={styles.progressBarBg}>
                                <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
                            </View>
                            <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.updateBtn} onPress={handleUpdate}>
                            <Text style={styles.updateBtnText}>
                                {downloaded ? "Installer maintenant" : "Mettre à jour"}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {!updateInfo?.forceUpdate && !downloading && (
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
