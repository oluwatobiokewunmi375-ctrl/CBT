# Production Deployment Checklist

## Pre-Deployment

- [ ] Code review completed
- [ ] All tests passing
- [ ] Database migrations prepared
- [ ] Environment variables configured
- [ ] SSL certificates ready
- [ ] Backup strategy tested

## Infrastructure

- [ ] PostgreSQL configured
  - [ ] Connection pooling enabled
  - [ ] Backups automated
  - [ ] Monitoring enabled
  - [ ] Authentication secure

- [ ] Redis configured
  - [ ] Password set
  - [ ] Persistence enabled
  - [ ] Replication configured
  - [ ] Monitoring enabled

- [ ] Docker images built
  - [ ] API image tested
  - [ ] Web image tested
  - [ ] Security scan passed
  - [ ] Images signed

## Deployment

- [ ] Run database migrations
- [ ] Deploy backend service
- [ ] Deploy frontend service
- [ ] Configure reverse proxy
- [ ] Setup SSL certificate
- [ ] Configure CDN

## Post-Deployment

- [ ] Smoke tests passed
- [ ] Health checks passing
- [ ] Monitoring alerts configured
- [ ] Logs aggregation working
- [ ] Backup jobs running
- [ ] SSL verified
- [ ] Performance acceptable

## Monitoring

- [ ] Error tracking (Sentry) active
- [ ] Performance monitoring (New Relic) active
- [ ] Log aggregation running
- [ ] Database metrics monitored
- [ ] API latency monitored
- [ ] Error rate monitored

## Communication

- [ ] Team notified
- [ ] Status page updated
- [ ] Stakeholders informed
- [ ] On-call rotation aware
- [ ] Runbook documented

## Rollback Plan

- [ ] Previous version available
- [ ] Database rollback tested
- [ ] DNS revert ready
- [ ] Communication template ready