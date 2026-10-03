'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Store } from '@/types';
import {  AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface ConnectionScreenProps {
  onStoreConnect: (store: Store) => void;
}

export default function ConnectionScreen({ onStoreConnect }: ConnectionScreenProps) {
  const [mode, setMode] = useState<'connection' | 'connecting'>('connection');
  const [storeUrl, setStoreUrl] = useState('');
  const [consumerKey, setConsumerKey] = useState('');
  const [consumerSecret, setConsumerSecret] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    if (!storeUrl) return 'Enter a valid WooCommerce store URL.';
    if (!consumerKey) return 'Consumer Key is required.';
    if (!consumerSecret) return 'Consumer Secret is required.';
    if (!storeUrl.startsWith('http')) return 'Store URL must start with http:// or https://';
    return '';
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setMode('connecting');
    setError('');

    try {
      const result = await api.connectWooCommerce(storeUrl, consumerKey, consumerSecret);
      setSuccess(true);
      setTimeout(() => {
        onStoreConnect(result);
      }, 1500);
    } catch (err: any) {
      setMode('connection');
      const message = err.message || 'Failed to connect';
      if (message.includes('401')) {
        setError('Your WooCommerce credentials were rejected. Verify the Consumer Key, Consumer Secret, and API permissions.');
      } else if (message.includes('timeout')) {
        setError('The store took too long to respond. Please try again.');
      } else if (message.includes('connect')) {
        setError('Couldn\'t connect to WooCommerce. Check your store URL and credentials.');
      } else {
        setError(message);
      }
    }
  };

  const handleDemo = async () => {
    setMode('connecting');
    setError('');
    try {
      const result = await api.createDemoStore();
      setSuccess(true);
      setTimeout(() => {
        onStoreConnect(result);
      }, 1500);
    } catch (err: any) {
      setMode('connection');
      setError('Failed to create demo store');
    }
  };

  if (mode === 'connecting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface to-white flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full">
          {success ? (
            <>
              <div className="mb-6 flex justify-center">
                <CheckCircle className="w-16 h-16 text-success" />
              </div>
              <h2 className="text-2xl font-bold text-primary mb-2">Connected successfully</h2>
              <p className="text-secondary mb-4">Setting up your merchant workspace...</p>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-secondary">
                  <span className="w-2 h-2 bg-success rounded-full mr-2" />
                  Connecting to merchant environment...
                </div>
                <div className="flex items-center text-sm text-secondary">
                  <span className="w-2 h-2 bg-success rounded-full mr-2" />
                  Loading orders
                </div>
                <div className="flex items-center text-sm text-secondary">
                  <span className="w-2 h-2 bg-success rounded-full mr-2" />
                  Loading products
                </div>
                <div className="flex items-center text-sm text-secondary">
                  <span className="w-2 h-2 bg-success rounded-full mr-2" />
                  Preparing merchant workspace
                </div>
              </div>
            </>
          ) : (
            <>
              <Loader className="w-12 h-12 text-accent animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-bold text-primary mb-2">Connecting...</h2>
              <p className="text-secondary">Setting up your merchant workspace</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface to-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary mb-2">Razorpay Merchant Agent</h1>
          <p className="text-lg text-secondary">Connect your commerce store</p>
          <p className="text-secondary text-sm mt-2">Bring orders, products and inventory into your merchant workspace.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* WooCommerce Connection Form */}
          <div className="card">
            <h2 className="text-xl font-bold text-primary mb-6 flex items-center">
              <span className="w-8 h-8 bg-accent text-white rounded-full flex items-center justify-center mr-2 text-sm">📦</span>
              WooCommerce
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                <AlertCircle className="w-5 h-5 text-error flex-shrink-0" />
                <p className="text-sm text-error">{error}</p>
              </div>
            )}

            <form onSubmit={handleConnect} className="space-y-4">
              <div>
                <label className="text-label">Store URL</label>
                <input
                  type="url"
                  value={storeUrl}
                  onChange={(e) => setStoreUrl(e.target.value)}
                  placeholder="https://yourstore.com"
                  className="w-full mt-1"
                />
              </div>

              <div>
                <label className="text-label">Consumer Key</label>
                <input
                  type="text"
                  value={consumerKey}
                  onChange={(e) => setConsumerKey(e.target.value)}
                  placeholder="Your API consumer key"
                  className="w-full mt-1"
                />
              </div>

              <div>
                <label className="text-label">Consumer Secret</label>
                <input
                  type="password"
                  value={consumerSecret}
                  onChange={(e) => setConsumerSecret(e.target.value)}
                  placeholder="Your API consumer secret"
                  className="w-full mt-1"
                />
              </div>

              <button
                type="submit"
                className="button button-primary w-full mt-6"
              >
                Connect WooCommerce
              </button>
            </form>
          </div>

          {/* Demo Store Button */}
          <div className="card flex flex-col">
            <h2 className="text-xl font-bold text-primary mb-6 flex items-center">
              <span className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center mr-2 text-sm">✨</span>
              Demo Store
            </h2>

            <p className="text-secondary text-sm mb-6 flex-grow">
              Explore a fully functional demo environment with synthetic WooCommerce data. Perfect for testing and demonstration.
            </p>

            <button
              onClick={handleDemo}
              className="button button-secondary w-full mt-auto"
            >
              Explore Demo Store
            </button>
          </div>
        </div>

        <div className="mt-12 text-center text-sm text-secondary">
          <p>Razorpay Merchant Agent • Premium merchant operations workspace</p>
        </div>
      </div>
    </div>
  );
}
