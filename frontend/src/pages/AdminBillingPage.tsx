import { useState, useEffect } from 'react';
import { Search, DollarSign, Calendar, Filter, Download, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useAuthStore } from '../store/authStore';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import { formatCurrency } from '../utils/formatters';

interface Billing {
  billing_id: string;
  user_id: string;
  user_email: string;
  first_name: string;
  last_name: string;
  booking_id: string;
  booking_type: 'flight' | 'hotel' | 'car';
  transaction_id: string;
  amount: number;
  tax: number;
  total_amount: number;
  payment_method: string;
  transaction_status: 'pending' | 'completed' | 'failed' | 'refunded';
  transaction_date: string;
  invoice_id: string;
}

const AdminBillingPage = () => {
  const { user } = useAuthStore();
  const [billings, setBillings] = useState<Billing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState<Billing | null>(null);

  // Filter states
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    month: '',
    bookingType: '',
    status: '',
    paymentMethod: '',
    minAmount: '',
    maxAmount: '',
    userId: '',
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      searchBillings();
    }
  }, [user]);

  const searchBillings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/billing/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...filters,
          minAmount: filters.minAmount ? parseFloat(filters.minAmount) : undefined,
          maxAmount: filters.maxAmount ? parseFloat(filters.maxAmount) : undefined,
          limit: 100,
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch billings');
      
      const data = await response.json();
      setBillings(data.billings || []);
      toast.success(`Found ${data.count} billing records`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to search billings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      month: '',
      bookingType: '',
      status: '',
      paymentMethod: '',
      minAmount: '',
      maxAmount: '',
      userId: '',
    });
  };

  const downloadReport = () => {
    // Convert billings to CSV
    const headers = ['Billing ID', 'Date', 'Customer', 'Email', 'Type', 'Amount', 'Tax', 'Total', 'Status', 'Payment Method'];
    const rows = billings.map(b => [
      b.billing_id,
      new Date(b.transaction_date).toLocaleDateString(),
      `${b.first_name} ${b.last_name}`,
      b.user_email,
      b.booking_type,
      b.amount,
      b.tax,
      b.total_amount,
      b.transaction_status,
      b.payment_method,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billings_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Report downloaded!');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      case 'pending': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
      case 'failed': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      case 'refunded': return 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
            <p>You need admin privileges to access this page.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold mb-2">Billing Management</h1>
            <p className="text-slate-600 dark:text-slate-400">
              Search and manage all billing transactions
            </p>
          </div>
          <Button onClick={downloadReport} disabled={billings.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Search Filters
            </h2>
            <button
              onClick={clearFilters}
              className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date Range */}
            <Input
              label="Start Date"
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              icon={<Calendar className="w-5 h-5" />}
            />
            <Input
              label="End Date"
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              icon={<Calendar className="w-5 h-5" />}
            />
            <Input
              label="Month (YYYY-MM)"
              type="month"
              value={filters.month}
              onChange={(e) => handleFilterChange('month', e.target.value)}
              icon={<Calendar className="w-5 h-5" />}
            />

            {/* Type and Status */}
            <Select
              label="Booking Type"
              value={filters.bookingType}
              onChange={(e) => handleFilterChange('bookingType', e.target.value)}
              options={[
                { value: '', label: 'All Types' },
                { value: 'flight', label: 'Flight' },
                { value: 'hotel', label: 'Hotel' },
                { value: 'car', label: 'Car' },
              ]}
            />
            <Select
              label="Status"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'completed', label: 'Completed' },
                { value: 'pending', label: 'Pending' },
                { value: 'failed', label: 'Failed' },
                { value: 'refunded', label: 'Refunded' },
              ]}
            />
            <Select
              label="Payment Method"
              value={filters.paymentMethod}
              onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
              options={[
                { value: '', label: 'All Methods' },
                { value: 'credit_card', label: 'Credit Card' },
                { value: 'debit_card', label: 'Debit Card' },
                { value: 'paypal', label: 'PayPal' },
                { value: 'apple_pay', label: 'Apple Pay' },
              ]}
            />

            {/* Amount Range */}
            <Input
              label="Min Amount"
              type="number"
              value={filters.minAmount}
              onChange={(e) => handleFilterChange('minAmount', e.target.value)}
              placeholder="0.00"
              icon={<DollarSign className="w-5 h-5" />}
            />
            <Input
              label="Max Amount"
              type="number"
              value={filters.maxAmount}
              onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
              placeholder="999999.99"
              icon={<DollarSign className="w-5 h-5" />}
            />

            {/* User ID */}
            <Input
              label="User ID (Optional)"
              value={filters.userId}
              onChange={(e) => handleFilterChange('userId', e.target.value)}
              placeholder="Enter user ID"
            />
          </div>

          <div className="mt-6">
            <Button onClick={searchBillings} disabled={isLoading} className="w-full">
              <Search className="w-5 h-5 mr-2" />
              {isLoading ? 'Searching...' : 'Search Billings'}
            </Button>
          </div>
        </Card>

        {/* Results */}
        <Card>
          <h2 className="text-xl font-bold mb-4">
            Search Results ({billings.length} records)
          </h2>

          {billings.length === 0 ? (
            <div className="text-center py-12 text-slate-600 dark:text-slate-400">
              <DollarSign className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>No billing records found. Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Billing ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Customer</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Amount</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {billings.map((billing) => (
                    <tr key={billing.billing_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 text-sm font-mono">{billing.billing_id}</td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(billing.transaction_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div>
                          <div className="font-medium">{billing.first_name} {billing.last_name}</div>
                          <div className="text-xs text-slate-500">{billing.user_email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm capitalize">{billing.booking_type}</td>
                      <td className="px-4 py-3 text-sm font-semibold">
                        {formatCurrency(billing.total_amount)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(billing.transaction_status)}`}>
                          {billing.transaction_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => setSelectedBilling(billing)}
                          className="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Billing Details Modal */}
        {selectedBilling && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Billing Details</h2>
                  <button
                    onClick={() => setSelectedBilling(null)}
                    className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-slate-600 dark:text-slate-400">Billing ID</label>
                      <p className="font-mono font-medium">{selectedBilling.billing_id}</p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-600 dark:text-slate-400">Transaction ID</label>
                      <p className="font-mono font-medium">{selectedBilling.transaction_id}</p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-600 dark:text-slate-400">Invoice ID</label>
                      <p className="font-mono font-medium">{selectedBilling.invoice_id || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-600 dark:text-slate-400">Booking ID</label>
                      <p className="font-mono font-medium">{selectedBilling.booking_id}</p>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                    <h3 className="font-bold mb-3">Customer Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-slate-600 dark:text-slate-400">Name</label>
                        <p className="font-medium">{selectedBilling.first_name} {selectedBilling.last_name}</p>
                      </div>
                      <div>
                        <label className="text-sm text-slate-600 dark:text-slate-400">Email</label>
                        <p className="font-medium">{selectedBilling.user_email}</p>
                      </div>
                      <div>
                        <label className="text-sm text-slate-600 dark:text-slate-400">User ID</label>
                        <p className="font-mono">{selectedBilling.user_id}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                    <h3 className="font-bold mb-3">Payment Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-slate-600 dark:text-slate-400">Booking Type</label>
                        <p className="font-medium capitalize">{selectedBilling.booking_type}</p>
                      </div>
                      <div>
                        <label className="text-sm text-slate-600 dark:text-slate-400">Payment Method</label>
                        <p className="font-medium capitalize">{selectedBilling.payment_method.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <label className="text-sm text-slate-600 dark:text-slate-400">Status</label>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedBilling.transaction_status)}`}>
                          {selectedBilling.transaction_status}
                        </span>
                      </div>
                      <div>
                        <label className="text-sm text-slate-600 dark:text-slate-400">Transaction Date</label>
                        <p className="font-medium">
                          {new Date(selectedBilling.transaction_date).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                    <h3 className="font-bold mb-3">Amount Breakdown</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
                        <span className="font-medium">{formatCurrency(selectedBilling.amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Tax</span>
                        <span className="font-medium">{formatCurrency(selectedBilling.tax)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t border-slate-200 dark:border-slate-700 pt-2">
                        <span>Total</span>
                        <span className="text-blue-600 dark:text-blue-400">
                          {formatCurrency(selectedBilling.total_amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button onClick={() => setSelectedBilling(null)} variant="secondary">
                    Close
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AdminBillingPage;

