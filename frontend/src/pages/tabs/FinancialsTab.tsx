import {
  TrendingUp,
  DollarSign,
  BarChart3,
  Users,
  Percent,
  CreditCard,
  Calendar,
  ShieldAlert,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend,
} from 'recharts';
import type { FinancialData } from '../../types';
import { PageHeader, StatCard } from '../../components/common';
import { fetchWithTimeout } from '../../utils/api';
import { getApiUrl, getAuthToken } from '../../utils/getApiUrl';

interface FinancialsTabProps {
  selectedBranch: string;
  employeeRole: string;
}

export function FinancialsTab({ selectedBranch, employeeRole }: FinancialsTabProps) {
  const isAuthorized = employeeRole === 'OWNER' || employeeRole === 'ADMIN';

  const API_URL = getApiUrl();

  const {
    data: financialsData,
    isLoading,
    isError,
    refetch,
  } = useQuery<FinancialData>({
    queryKey: ['financials', selectedBranch],
    queryFn: async () => {
      const token = getAuthToken();
      const res = await fetchWithTimeout(`${API_URL}/api/branches/${selectedBranch}/financials`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch financials data');
      return res.json();
    },
    enabled: isAuthorized && !!selectedBranch,
  });

  if (!isAuthorized) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 40px' }}>
        <div
          style={{
            backgroundColor: 'var(--accent-glow)',
            color: 'var(--accent)',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          <ShieldAlert size={36} />
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-sans)',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '12px',
          }}
        >
          Access Denied
        </h2>
        <p
          style={{
            color: 'var(--text-secondary)',
            maxWidth: '480px',
            margin: '0 auto',
            fontSize: '15px',
          }}
        >
          Financial ledgers and salon analytics are reserved for salon Owners and Branch
          Administrators only.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className="glass-panel"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 40px',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '4px solid var(--accent)',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '16px',
          }}
        />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>
          Analyzing salon ledger database...
        </p>
      </div>
    );
  }

  if (isError || !financialsData) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 40px' }}>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>
          Failed to load analytics
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          An error occurred while connecting to the database or retrieving transaction summaries.
        </p>
        <button className="btn-primary" onClick={() => refetch()}>
          Retry Query
        </button>
      </div>
    );
  }

  const { kpis, monthlyTrends, categoryDistribution, stylistPerformance, recentLedger } =
    financialsData;

  return (
    <div className="glass-panel">
      <PageHeader
        title="Financial Ledger & Performance"
        subtitle="Track monthly/daily revenue trends, service category rankings, and stylist commissions."
        action={
          <span
            className="micro-badge"
            style={{
              backgroundColor: 'var(--accent-glow)',
              color: 'var(--accent)',
              border: '1px solid var(--border-color)',
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontWeight: 600,
              padding: '6px 12px',
              borderRadius: '20px',
            }}
          >
            {employeeRole === 'OWNER' ? 'Owner Mode (All Branches)' : 'Branch Manager'}
          </span>
        }
      />

      {/* KPI Cards Grid */}
      <div
        className="grid-4"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          marginBottom: '32px',
        }}
      >
        <StatCard
          label="Total Revenue"
          value={`₱${kpis.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<DollarSign size={24} />}
        />
        <StatCard
          label="Net Profit"
          value={`₱${kpis.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<TrendingUp size={24} />}
        />
        <StatCard
          label="Stylist Commissions"
          value={`₱${kpis.totalCommission.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<Percent size={24} />}
        />
        <StatCard
          label="Tax Provision (10%)"
          value={`₱${kpis.totalTax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<CreditCard size={24} />}
        />
      </div>

      {/* Charts Section */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
          gap: '24px',
          marginBottom: '32px',
        }}
      >
        {/* Monthly Trend Area Chart */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.4)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h3
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Calendar size={18} style={{ color: 'var(--accent)' }} /> 6-Month Revenue & Profit Trend
          </h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--success-green)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--success-green)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.04)" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `₱${val}`}
                />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(val: any) => [`₱${Number(val).toLocaleString()}`, '']}
                  contentStyle={{
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    boxShadow: 'var(--shadow-md)',
                  }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Area
                  name="Revenue"
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#revenueGrad)"
                />
                <Area
                  name="Net Profit"
                  type="monotone"
                  dataKey="profit"
                  stroke="var(--success-green)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#profitGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Bar Chart */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.4)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h3
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <BarChart3 size={18} style={{ color: 'var(--accent-blue)' }} /> Revenue by Treatment
            Category
          </h3>
          {categoryDistribution.length === 0 ? (
            <div
              style={{
                display: 'flex',
                height: '300px',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                fontSize: '14px',
              }}
            >
              No treatment sales data available.
            </div>
          ) : (
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryDistribution}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.04)" />
                  <XAxis
                    dataKey="category"
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `₱${val}`}
                  />
                  <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(val: any) => [`₱${Number(val).toLocaleString()}`, 'Sales']}
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      boxShadow: 'var(--shadow-md)',
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {categoryDistribution.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index % 2 === 0 ? 'var(--accent)' : 'var(--accent-blue)'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard and Transaction Log section */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
          gap: '24px',
        }}
      >
        {/* Stylist Leaderboard */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.4)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h3
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Users size={18} style={{ color: 'var(--accent)' }} /> Stylist Performance & Leaderboard
          </h3>
          {stylistPerformance.length === 0 ? (
            <div
              style={{
                padding: '40px 0',
                textAlign: 'center',
                color: 'var(--text-secondary)',
                fontSize: '14px',
              }}
            >
              No stylist activity recorded yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  textAlign: 'left',
                  fontSize: '14px',
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <th style={{ padding: '12px 8px', fontWeight: 600 }}>Stylist Name</th>
                    <th style={{ padding: '12px 8px', fontWeight: 600 }}>Services</th>
                    <th style={{ padding: '12px 8px', fontWeight: 600 }}>Sales Value</th>
                    <th style={{ padding: '12px 8px', fontWeight: 600 }}>Commissions (30%)</th>
                  </tr>
                </thead>
                <tbody>
                  {stylistPerformance.map((stylist) => (
                    <tr
                      key={stylist.employeeId}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <td style={{ padding: '14px 8px', fontWeight: 500 }}>
                        {stylist.employeeName}
                      </td>
                      <td style={{ padding: '14px 8px' }}>{stylist.servicesCount} services</td>
                      <td style={{ padding: '14px 8px', fontWeight: 600 }}>
                        ₱{stylist.salesAmount.toFixed(2)}
                      </td>
                      <td
                        style={{
                          padding: '14px 8px',
                          color: 'var(--success-green)',
                          fontWeight: 600,
                        }}
                      >
                        ₱{stylist.commissionEarned.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Ledger Audit Trail */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.4)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h3
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <TrendingUp size={18} style={{ color: 'var(--success-green)' }} /> Recent Transactions
            Ledger
          </h3>
          {recentLedger.length === 0 ? (
            <div
              style={{
                padding: '40px 0',
                textAlign: 'center',
                color: 'var(--text-secondary)',
                fontSize: '14px',
              }}
            >
              No transactions recorded in this branch yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  textAlign: 'left',
                  fontSize: '14px',
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <th style={{ padding: '12px 8px', fontWeight: 600 }}>Client</th>
                    <th style={{ padding: '12px 8px', fontWeight: 600 }}>Payment</th>
                    <th style={{ padding: '12px 8px', fontWeight: 600 }}>Amount</th>
                    <th style={{ padding: '12px 8px', fontWeight: 600 }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLedger.map((tx) => (
                    <tr
                      key={tx.id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <td style={{ padding: '14px 8px' }}>
                        <div style={{ fontWeight: 500 }}>{tx.clientName}</div>
                        <div
                          style={{
                            fontSize: '11px',
                            color: 'var(--text-secondary)',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            maxWidth: '200px',
                          }}
                          title={tx.services.join(', ')}
                        >
                          {tx.services.join(', ')}
                        </div>
                      </td>
                      <td style={{ padding: '14px 8px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            textTransform: 'uppercase',
                            background: 'rgba(0,0,0,0.04)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontWeight: 600,
                          }}
                        >
                          {tx.paymentMethod}
                        </span>
                      </td>
                      <td style={{ padding: '14px 8px', fontWeight: 600 }}>
                        ₱{tx.totalAmount.toFixed(2)}
                      </td>
                      <td
                        style={{
                          padding: '14px 8px',
                          fontSize: '12px',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {new Date(tx.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
