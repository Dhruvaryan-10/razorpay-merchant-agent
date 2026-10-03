export const formatCurrency = (amount: number | string, currency: string = 'INR') => {
  const symbols: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
  };

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  const safeAmount = isNaN(numAmount) ? 0 : numAmount;

  return `${symbols[currency] || currency} ${safeAmount.toFixed(2)}`;
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getStatusBadgeColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    failed: 'bg-red-100 text-red-800',
    instock: 'bg-green-100 text-green-800',
    lowstock: 'bg-yellow-100 text-yellow-800',
    outofstock: 'bg-red-100 text-red-800',
    publish: 'bg-green-100 text-green-800',
    draft: 'bg-gray-100 text-gray-800',
  };

  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getStatusText = (status: string) => {
  const labels: Record<string, string> = {
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
    cancelled: 'Cancelled',
    failed: 'Failed',
    instock: 'In Stock',
    lowstock: 'Low Stock',
    outofstock: 'Out of Stock',
    publish: 'Published',
    draft: 'Draft',
    live: 'Live',
    demo: 'Demo',
    connected: 'Connected',
    disconnected: 'Disconnected',
  };

  return labels[status] || status;
};
