# Limitations & Known Issues

## Current Limitations

### Provider Support
- **Connector**: Currently WooCommerce only
- **Expansion**: Can add Shopify, Magento, etc. using connector architecture
- **Timeline**: Multi-provider support requires additional connectors

### Data Operations
- **Read-Only**: All operations are read-only (no order/product modifications)
- **Why**: Reduces complexity, improves security
- **Future**: Write operations can be added with proper authorization

### Synchronization
- **On-Demand**: Data is fetched on-request, not synced automatically
- **Caching**: No persistent caching between requests
- **Pagination**: Uses WooCommerce's pagination (100 items max per request)

### Agent Capabilities
- **Intent-Based**: Agent only understands pre-defined intents
- **No AI/ML**: Pattern matching, no external LLM calls
- **Scope**: Limited to orders, products, inventory, customers
- **Extensibility**: Can add more intents with regex patterns

### Multi-Tenancy
- **Current**: Single merchant per deployment
- **Easy Fix**: Database models support merchants, but auth not implemented
- **Future**: Add user authentication and merchant isolation

### Real-Time Updates
- **Polling**: No websockets or real-time subscriptions
- **Refresh**: User must click "Refresh" button (no auto-sync)
- **Webhooks**: Not implemented (could add for production)

### Performance
- **Large Datasets**: May slow down with 10K+ products/orders
- **Solution**: Implement caching, background workers
- **Pagination**: Current implementation loads one page at a time

### Frontend Features
- **Export**: No CSV/PDF export functionality
- **Bulk Actions**: No bulk order/product operations
- **Printing**: No invoice printing
- **Email**: No email notifications

## Known Issues

### WooCommerce API Limitations
- **Custom Fields**: May not map to normalized schema
- **Plugins**: Some plugins add non-standard fields
- **Metadata**: Custom post meta not fully supported

### Database
- **Migrations**: Alembic migrations are example-based
- **Production**: May need adjustments for specific PostgreSQL versions

### Browser Compatibility
- **Target**: Modern browsers (Chrome, Firefox, Safari, Edge)
- **IE11**: Not supported
- **Mobile**: Responsive design, tested on iOS/Android

## Production Considerations

### Not Implemented (for hackathon scope)
- User authentication
- Role-based access control (RBAC)
- Audit logging
- Rate limiting (per user/IP)
- Request signing/verification
- OAuth for WooCommerce
- TLS certificate pinning
- DDoS protection

### Security Best Practices Missing
- No request/response signing
- No API key rotation
- No rate limiting per API key
- No request validation against schema
- Minimal audit logging

### Scaling Limitations
- Single database connection
- No caching layer (Redis)
- No message queue (RabbitMQ, Kafka)
- No async background workers
- Synchronous WooCommerce API calls

### Operational Concerns
- No monitoring/alerting
- No structured logging
- No error tracking (Sentry)
- No performance monitoring (New Relic)
- No database backup automation

## Workarounds

### Large Product Catalogs
1. Implement pagination in list views
2. Add database indices on store_id, external_id
3. Implement Redis caching for product data

### Rate Limiting from WooCommerce
1. Implement exponential backoff (already done)
2. Cache responses aggressively
3. Use background workers for heavy operations

### Network Timeouts
1. Increase WOOCOMMERCE_REQUEST_TIMEOUT
2. Implement retry logic (already done)
3. Add fallback to cached data

## Future Enhancements

### High Priority
- [ ] User authentication
- [ ] Multi-tenant support
- [ ] API rate limiting
- [ ] Advanced search filters
- [ ] Order notes/comments

### Medium Priority
- [ ] CSV export
- [ ] Webhook support
- [ ] Background sync jobs
- [ ] Redis caching
- [ ] Email notifications

### Low Priority
- [ ] PDF invoice generation
- [ ] Advanced analytics
- [ ] Shopify connector
- [ ] Magento connector
- [ ] Mobile app

## How to Report Issues

1. Check this document first
2. Check browser console for errors
3. Check backend logs (`/tmp/merchant-api.log`)
4. Verify WooCommerce API is accessible
5. Test with WooCommerce credentials in `scripts/test_woocommerce.py`

## Feedback

Limitations and issues are intentional for this hackathon project. Priority focused on:
1. Real WooCommerce integration ✅
2. Complete UI implementation ✅
3. Core features (orders, products, etc) ✅
4. Agent functionality ✅
5. Production deployment structure ✅

Additional features can be added based on feedback.
