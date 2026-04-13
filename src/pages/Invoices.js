import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FaFilePdf, FaEye, FaShoppingCart, FaPrint, FaDownload, FaFilter, FaSearch, FaMoneyBillWave, FaCalendarAlt, FaUser, FaStore } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'https://mgzon-naseej-backend.hf.space/api';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const printRef = useRef();

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [searchTerm, statusFilter, dateFilter, invoices]);

  const fetchInvoices = async () => {
    try {
      const response = await axios.get(`${API_URL}/invoices`);
      setInvoices(response.data);
      setFilteredInvoices(response.data);
    } catch (error) {
      toast.error('Failed to load invoices.');
    } finally {
      setLoading(false);
    }
  };

  const filterInvoices = () => {
    let filtered = [...invoices];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(inv => 
        inv.invoiceNumber?.toLowerCase().includes(term) ||
        inv.customerId?.name?.toLowerCase().includes(term) ||
        inv.customerId?.phone?.includes(term)
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(inv => inv.status === statusFilter);
    }
    
    if (dateFilter) {
      filtered = filtered.filter(inv => 
        new Date(inv.date).toDateString() === new Date(dateFilter).toDateString()
      );
    }
    
    setFilteredInvoices(filtered);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'unpaid': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'paid': return 'Paid';
      case 'unpaid': return 'Unpaid';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return <FaMoneyBillWave className="text-green-600" />;
      case 'unpaid': return <FaMoneyBillWave className="text-yellow-600" />;
      default: return null;
    }
  };

  const printInvoice = () => {
    const printContent = document.getElementById('invoice-print');
    const originalTitle = document.title;
    document.title = `Invoice_${selectedInvoice?.invoiceNumber}`;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice ${selectedInvoice?.invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            .invoice-header { text-align: center; margin-bottom: 30px; }
            .invoice-details { margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f5f5f5; }
            .total-row { font-weight: bold; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    document.title = originalTitle;
  };

  const downloadCSV = () => {
    const headers = ['Invoice #', 'Customer', 'Phone', 'Date', 'Total', 'Status'];
    const rows = filteredInvoices.map(inv => [
      inv.invoiceNumber,
      inv.customerId?.name || 'N/A',
      inv.customerId?.phone || 'N/A',
      new Date(inv.date).toLocaleDateString(),
      inv.totalAmount,
      inv.status
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoices_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export started');
  };

  const stats = {
    total: filteredInvoices.length,
    paid: filteredInvoices.filter(i => i.status === 'paid').length,
    unpaid: filteredInvoices.filter(i => i.status === 'unpaid').length,
    totalAmount: filteredInvoices.reduce((sum, i) => sum + i.totalAmount, 0)
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and track all customer invoices</p>
        </div>
        <Link to="/invoices/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <FaShoppingCart /> New Invoice
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
          <p className="text-xs text-gray-500">Total Invoices</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
          <p className="text-xs text-gray-500">Paid</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{stats.unpaid}</p>
          <p className="text-xs text-gray-500">Unpaid</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{stats.totalAmount.toLocaleString()} EGP</p>
          <p className="text-xs text-gray-500">Total Amount</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by invoice #, customer name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={downloadCSV} className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2 hover:bg-green-700">
            <FaDownload /> Export CSV
          </button>
          <button onClick={fetchInvoices} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
            Reset
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seller</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono text-sm font-medium">{invoice.invoiceNumber}</td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium">{invoice.customerId?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{invoice.customerId?.phone}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">{invoice.sellerId?.username || 'Unknown'}</td>
                  <td className="px-6 py-4 font-semibold">{invoice.totalAmount.toLocaleString()} EGP</td>
                  <td className="px-6 py-4 text-sm">{new Date(invoice.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(invoice.status)}`}>
                      {getStatusIcon(invoice.status)}
                      {getStatusText(invoice.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => setSelectedInvoice(invoice)} className="text-blue-600 hover:text-blue-800" title="View Details">
                        <FaEye />
                      </button>
                      <button onClick={() => { setSelectedInvoice(invoice); setTimeout(printInvoice, 100); }} className="text-gray-600 hover:text-gray-800" title="Print">
                        <FaPrint />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredInvoices.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl">
          <p className="text-gray-500">No invoices found.</p>
        </div>
      )}

      {/* Invoice Details Modal with Print Template */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto">
            {/* Print Template (hidden normally, shown when printing) */}
            <div id="invoice-print" className="hidden">
              <div className="p-8">
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold">INVOICE</h1>
                  <p className="text-gray-500">Naseej Carpets & Textiles</p>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div>
                    <p className="text-sm text-gray-500">Invoice Number</p>
                    <p className="font-mono font-bold">{selectedInvoice.invoiceNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p>{new Date(selectedInvoice.date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Customer</p>
                    <p className="font-medium">{selectedInvoice.customerId?.name}</p>
                    <p className="text-sm">{selectedInvoice.customerId?.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Seller</p>
                    <p>{selectedInvoice.sellerId?.username}</p>
                  </div>
                </div>
                <table className="w-full mb-4">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left">Product</th>
                      <th className="px-4 py-2 text-center">Qty</th>
                      <th className="px-4 py-2 text-right">Price</th>
                      <th className="px-4 py-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items?.map((item, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="px-4 py-2">{item.productId?.name || 'Unknown'}</td>
                        <td className="px-4 py-2 text-center">{item.quantity}</td>
                        <td className="px-4 py-2 text-right">{item.unitPrice.toLocaleString()} EGP</td>
                        <td className="px-4 py-2 text-right font-semibold">{item.subtotal.toLocaleString()} EGP</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50">
                      <td colSpan="3" className="px-4 py-3 text-right font-bold">Total:</td>
                      <td className="px-4 py-3 text-right font-bold text-lg">{selectedInvoice.totalAmount.toLocaleString()} EGP</td>
                    </tr>
                  </tfoot>
                </table>
                <div className="text-center text-gray-400 text-sm mt-8">
                  <p>Thank you for your business!</p>
                  <p>Naseej Carpets & Textiles - Quality since 2024</p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Invoice Details</h2>
                <button onClick={() => setSelectedInvoice(null)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
              </div>
              
              <div className="border-b pb-4 mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Invoice Number</p>
                    <p className="font-mono font-semibold">{selectedInvoice.invoiceNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p>{new Date(selectedInvoice.date).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Customer</p>
                    <p className="font-medium">{selectedInvoice.customerId?.name}</p>
                    <p className="text-sm text-gray-500">{selectedInvoice.customerId?.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Seller</p>
                    <p>{selectedInvoice.sellerId?.username}</p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold mb-2">Items</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm">Product</th>
                        <th className="px-4 py-2 text-center text-sm">Qty</th>
                        <th className="px-4 py-2 text-right text-sm">Price</th>
                        <th className="px-4 py-2 text-right text-sm">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items?.map((item, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="px-4 py-2">{item.productId?.name || 'Unknown'}</td>
                          <td className="px-4 py-2 text-center">{item.quantity}</td>
                          <td className="px-4 py-2 text-right">{item.unitPrice.toLocaleString()} EGP</td>
                          <td className="px-4 py-2 text-right font-semibold">{item.subtotal.toLocaleString()} EGP</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50">
                        <td colSpan="3" className="px-4 py-3 text-right font-bold">Total:</td>
                        <td className="px-4 py-3 text-right font-bold text-lg">{selectedInvoice.totalAmount.toLocaleString()} EGP</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button onClick={() => setSelectedInvoice(null)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
                  Close
                </button>
                <button onClick={printInvoice} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700">
                  <FaPrint /> Print Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;