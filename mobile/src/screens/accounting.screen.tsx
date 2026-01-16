import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { ArrowLeft, TrendingUp, Calendar, Clock, BarChart3, Wallet } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { accountingApi } from '@/services/api.service';

const COLORS = {
    primary: '#9B67FF',
    secondary: '#70E1F5',
    text: '#1A1A1A',
    textSecondary: '#666666',
    white: '#FFFFFF',
    background: '#F8F9FE',
    accent: '#FFD700',
    success: '#4CAF50',
    info: '#2196F3',
    warning: '#FF9800'
};

interface Stat {
    amount: number;
    count: number;
}

interface StatsData {
    today: Stat;
    week: Stat;
    month: Stat;
}

export const AccountingScreen = () => {
    const navigation = useNavigation<any>();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState<StatsData | null>(null);

    const fetchStats = async () => {
        try {
            const response = await accountingApi.getStats();
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching accounting stats:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString('fr-FR') + ' FCFA';
    };

    const StatCard = ({ title, data, icon: Icon, color }: { title: string, data: Stat, icon: any, color: string }) => (
        <View style={styles.card}>
            <View style={[styles.iconBadge, { backgroundColor: color + '20' }]}>
                <Icon size={24} color={color} />
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{title}</Text>
                <Text style={[styles.cardAmount, { color: color }]}>{formatCurrency(data.amount)}</Text>
                <View style={styles.cardFooter}>
                    <TrendingUp size={14} color={COLORS.textSecondary} />
                    <Text style={styles.cardSubtext}>{data.count} prestations terminées</Text>
                </View>
            </View>
        </View>
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Comptabilité</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
                }
            >
                <View style={styles.heroSection}>
                    <View style={styles.totalBalanceCard}>
                        <View style={styles.balanceIcon}>
                            <Wallet size={30} color={COLORS.white} />
                        </View>
                        <Text style={styles.balanceLabel}>Chiffre d'Affaires Mensuel</Text>
                        <Text style={styles.balanceValue}>{stats ? formatCurrency(stats.month.amount) : '0 FCFA'}</Text>
                    </View>
                </View>

                <View style={styles.statsGrid}>
                    <Text style={styles.sectionTitle}>Performance Financière</Text>

                    {stats && (
                        <>
                            <StatCard
                                title="Aujourd'hui"
                                data={stats.today}
                                icon={Clock}
                                color={COLORS.success}
                            />
                            <StatCard
                                title="Cette Semaine"
                                data={stats.week}
                                icon={Calendar}
                                color={COLORS.info}
                            />
                            <StatCard
                                title="Ce Mois"
                                data={stats.month}
                                icon={BarChart3}
                                color={COLORS.primary}
                            />
                        </>
                    )}
                </View>

                <View style={styles.infoBox}>
                    <Text style={styles.infoTitle}>Note :</Text>
                    <Text style={styles.infoText}>
                        Ces montants sont calculés uniquement sur la base des rendez-vous marqués comme "Terminé".
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: COLORS.white,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: 'Urbanist-Bold',
        color: COLORS.text,
    },
    content: {
        flex: 1,
    },
    heroSection: {
        padding: 20,
    },
    totalBalanceCard: {
        backgroundColor: COLORS.primary,
        borderRadius: 24,
        padding: 25,
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
    },
    balanceIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    balanceLabel: {
        fontSize: 16,
        fontFamily: 'Urbanist-Medium',
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: 5,
    },
    balanceValue: {
        fontSize: 32,
        fontFamily: 'Urbanist-ExtraBold',
        color: COLORS.white,
    },
    statsGrid: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: 'Urbanist-Bold',
        color: COLORS.text,
        marginBottom: 15,
        marginTop: 10,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    iconBadge: {
        width: 50,
        height: 50,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 14,
        fontFamily: 'Urbanist-Medium',
        color: COLORS.textSecondary,
        marginBottom: 2,
    },
    cardAmount: {
        fontSize: 20,
        fontFamily: 'Urbanist-Bold',
        marginBottom: 6,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    cardSubtext: {
        fontSize: 12,
        fontFamily: 'Urbanist-Regular',
        color: COLORS.textSecondary,
    },
    infoBox: {
        margin: 20,
        padding: 15,
        backgroundColor: '#E3F2FD',
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.info,
    },
    infoTitle: {
        fontSize: 14,
        fontFamily: 'Urbanist-Bold',
        color: COLORS.info,
        marginBottom: 4,
    },
    infoText: {
        fontSize: 13,
        fontFamily: 'Urbanist-Regular',
        color: '#444',
        lineHeight: 18,
    }
});
