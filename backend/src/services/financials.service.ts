import prisma from '../config/prisma';

export async function getFinancialsData(branchId: string) {
    // 1. Fetch all transactions for this branch
    const transactions = await prisma.transaction.findMany({
        where: {
            branchId,
        },
        include: {
            client: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                }
            },
            services: {
                include: {
                    service: {
                        select: {
                            name: true,
                            category: true,
                        }
                    },
                    employee: {
                        select: {
                            id: true,
                            name: true,
                        }
                    }
                }
            }
        },
        orderBy: {
            createdAt: 'desc',
        }
    });

    // Fetch inbound inventory logs to compute expenses
    const inventoryLogs = await prisma.inventoryLog.findMany({
        where: {
            item: {
                branchId,
            },
            logType: 'INBOUND',
        },
        include: {
            item: true,
        },
    });

    // 2. Calculations
    let totalRevenue = 0;
    let totalExpenses = 0;
    const now = new Date();

    // Daily maps
    const dailyMap: { [dateStr: string]: number } = {};
    const dailyExpensesMap: { [dateStr: string]: number } = {};
    for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dayKey = d.toLocaleDateString('en-US', { weekday: 'short' }); // e.g. "Mon", "Tue"
        dailyMap[dayKey] = 0;
        dailyExpensesMap[dayKey] = 0;
    }

    // Monthly maps
    const monthlyMap: { [monthStr: string]: { revenue: number } } = {};
    const monthlyExpensesMap: { [monthStr: string]: number } = {};
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = d.toLocaleDateString('en-US', { month: 'short' }); // e.g. "Jan", "Feb"
        monthlyMap[monthKey] = { revenue: 0 };
        monthlyExpensesMap[monthKey] = 0;
    }

    // Category breakdown
    const categoryMap: { [category: string]: number } = {};

    // Stylist Performance
    const stylistMap: {
        [id: string]: {
            employeeId: string;
            employeeName: string;
            servicesCount: number;
            salesAmount: number;
        }
    } = {};

    // For 10 recent transactions list
    const recentLedger = transactions.slice(0, 10).map((t) => {
        const clientName = t.client
            ? `${t.client.firstName} ${t.client.lastName}`.trim()
            : 'Walk-in Guest';
        const serviceNames = t.services.map((ts) => ts.service?.name).filter(Boolean);

        return {
            id: t.id,
            clientName,
            totalAmount: Number(t.totalAmount),
            paymentMethod: t.paymentMethod,
            createdAt: t.createdAt.toISOString(),
            services: serviceNames,
        };
    });

    // Populate transaction aggregates
    for (const t of transactions) {
        const rev = Number(t.totalAmount);
        totalRevenue += rev;

        const txDate = new Date(t.createdAt);
        const diffTime = Math.abs(now.getTime() - txDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 7) {
            const dayKey = txDate.toLocaleDateString('en-US', { weekday: 'short' });
            if (dayKey in dailyMap) {
                dailyMap[dayKey] += rev;
            }
        }

        const monthKey = txDate.toLocaleDateString('en-US', { month: 'short' });
        if (monthKey in monthlyMap) {
            monthlyMap[monthKey].revenue += rev;
        }

        for (const ts of t.services) {
            const price = Number(ts.priceCharged);
            const cat = ts.service?.category || 'Uncategorized';
            categoryMap[cat] = (categoryMap[cat] || 0) + price;

            if (ts.employee) {
                const empId = ts.employee.id;
                if (!stylistMap[empId]) {
                    stylistMap[empId] = {
                        employeeId: empId,
                        employeeName: ts.employee.name,
                        servicesCount: 0,
                        salesAmount: 0,
                    };
                }
                stylistMap[empId].servicesCount += 1;
                stylistMap[empId].salesAmount += price;
            }
        }
    }

    // Populate inventory log aggregates (Expenses)
    for (const log of inventoryLogs) {
        const cost = Number(log.item.cost) * log.quantityChange;
        totalExpenses += cost;

        const logDate = new Date(log.createdAt);
        const diffTime = Math.abs(now.getTime() - logDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 7) {
            const dayKey = logDate.toLocaleDateString('en-US', { weekday: 'short' });
            if (dayKey in dailyExpensesMap) {
                dailyExpensesMap[dayKey] += cost;
            }
        }

        const monthKey = logDate.toLocaleDateString('en-US', { month: 'short' });
        if (monthKey in monthlyExpensesMap) {
            monthlyExpensesMap[monthKey] += cost;
        }
    }

    const netProfit = Math.max(0, totalRevenue - totalExpenses);

    // Format Monthly Trends
    const monthlyTrends = Object.entries(monthlyMap).map(([month, data]) => {
        const expense = monthlyExpensesMap[month] || 0;
        return {
            month,
            revenue: Math.round(data.revenue * 100) / 100,
            profit: Math.round(Math.max(0, data.revenue - expense) * 100) / 100,
        };
    });

    // Format Daily Trends
    const dailyTrends = Object.entries(dailyMap).map(([day, revenue]) => ({
        day,
        revenue: Math.round(revenue * 100) / 100,
    }));

    // Format Category distribution
    const categoryDistribution = Object.entries(categoryMap).map(([category, value]) => ({
        category,
        value: Math.round(value * 100) / 100,
    }));

    // Format Stylist Performance list
    const stylistPerformance = Object.values(stylistMap).map((s) => ({
        ...s,
        salesAmount: Math.round(s.salesAmount * 100) / 100,
    })).sort((a, b) => b.salesAmount - a.salesAmount);

    return {
        kpis: {
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            netProfit: Math.round(netProfit * 100) / 100,
        },
        monthlyTrends,
        dailyTrends,
        categoryDistribution,
        stylistPerformance,
        recentLedger,
    };
}
