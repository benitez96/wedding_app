#!/bin/bash

# Script para verificar el estado de los servicios de monitoreo
# Uso: ./scripts/deployment/check-monitoring.sh

set -e

echo "🔍 Verificando servicios de monitoreo..."

# Verificar que los servicios estén corriendo
echo "📊 Estado de los servicios:"
docker-compose -f docker-compose.production.yml ps

echo ""
echo "🌐 Verificando endpoints:"

# Verificar Elasticsearch
echo "📈 Elasticsearch:"
if curl -s http://localhost:9200/_cluster/health > /dev/null; then
    echo "  ✅ Elasticsearch está funcionando"
    curl -s http://localhost:9200/_cluster/health | jq '.'
else
    echo "  ❌ Elasticsearch no responde"
fi

# Verificar Kibana
echo ""
echo "📋 Kibana:"
if curl -s http://localhost:5601/api/status > /dev/null; then
    echo "  ✅ Kibana está funcionando"
else
    echo "  ❌ Kibana no responde"
fi

# Verificar Prometheus
echo ""
echo "📊 Prometheus:"
if curl -s http://localhost:9090/api/v1/status/config > /dev/null; then
    echo "  ✅ Prometheus está funcionando"
    echo "  📈 Targets activos:"
    curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, instance: .labels.instance, health: .health}'
else
    echo "  ❌ Prometheus no responde"
fi

# Verificar Grafana
echo ""
echo "📈 Grafana:"
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "  ✅ Grafana está funcionando"
else
    echo "  ❌ Grafana no responde"
fi

# Verificar Caddy
echo ""
echo "🌐 Caddy:"
if curl -s http://localhost:2019/config > /dev/null; then
    echo "  ✅ Caddy está funcionando"
else
    echo "  ❌ Caddy no responde"
fi

# Verificar logs de fail2ban
echo ""
echo "🔒 Fail2ban:"
if sudo fail2ban-client status > /dev/null 2>&1; then
    echo "  ✅ Fail2ban está funcionando"
    echo "  🎯 Jails activos:"
    sudo fail2ban-client status | grep "Jail list" -A 10
else
    echo "  ❌ Fail2ban no está funcionando"
fi

# Verificar logs de Caddy
echo ""
echo "📝 Logs de Caddy:"
if [ -f "/volumes/wedding-app/caddy/logs/public_access.log" ]; then
    echo "  ✅ Logs públicos encontrados"
    echo "  📊 Últimas 5 líneas:"
    tail -5 /volumes/wedding-app/caddy/logs/public_access.log
else
    echo "  ❌ No se encontraron logs públicos"
fi

if [ -f "/volumes/wedding-app/caddy/logs/monitoring_access.log" ]; then
    echo "  ✅ Logs de monitoreo encontrados"
    echo "  📊 Últimas 5 líneas:"
    tail -5 /volumes/wedding-app/caddy/logs/monitoring_access.log
else
    echo "  ❌ No se encontraron logs de monitoreo"
fi

echo ""
echo "🎯 Para acceder a los servicios:"
echo "  - Grafana: https://grafana.${DOMAIN:-localhost}"
echo "  - Kibana: https://logs.${DOMAIN:-localhost}"
echo "  - Prometheus: https://metrics.${DOMAIN:-localhost}"
echo ""
echo "📊 En Kibana puedes ver:"
echo "  - Mapa de IPs con geolocalización"
echo "  - Logs de fail2ban con IPs baneadas"
echo "  - Análisis de tráfico por país/región"
echo "  - Intentos de acceso no autorizado"
