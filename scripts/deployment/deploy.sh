#!/bin/bash

# Script de despliegue completo para producción
# Uso: ./scripts/deployment/deploy.sh

set -e

echo "🚀 Iniciando despliegue de producción..."

# Verificar que estamos en el directorio correcto
if [ ! -f "docker-compose.production.yml" ]; then
    echo "❌ Error: No se encontró docker-compose.production.yml"
    echo "   Ejecuta este script desde el directorio raíz del proyecto"
    exit 1
fi

# Verificar variables de entorno
if [ ! -f ".env" ]; then
    echo "❌ Error: No se encontró el archivo .env"
    echo "   Crea el archivo .env con las variables necesarias"
    exit 1
fi

# Verificar que Docker esté disponible
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker no está instalado"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Error: Docker Compose no está instalado"
    exit 1
fi

echo "✅ Verificaciones previas completadas"

# Inicializar volúmenes
echo "📁 Inicializando volúmenes..."
sudo ./scripts/deployment/init-volumes.sh

# Configurar fail2ban
echo "🔒 Configurando fail2ban..."
sudo ./scripts/setup-fail2ban.sh

# Construir y levantar servicios
echo "🐳 Construyendo y levantando servicios..."
docker-compose -f docker-compose.production.yml build
docker-compose -f docker-compose.production.yml up -d

# Esperar a que los servicios estén listos
echo "⏳ Esperando a que los servicios estén listos..."
sleep 30

# Configurar Elasticsearch
echo "🔧 Configurando Elasticsearch..."
./scripts/deployment/setup-elasticsearch.sh

# Verificar estado de los servicios
echo "🔍 Verificando estado de los servicios..."
docker-compose -f docker-compose.production.yml ps

# Verificar logs de Caddy
echo "📋 Verificando logs de Caddy..."
docker-compose -f docker-compose.production.yml logs caddy --tail=20

echo "✅ Despliegue completado exitosamente!"
echo ""
echo "📊 Servicios disponibles:"
echo "  - Aplicación principal: https://${DOMAIN:-tu-dominio.com}"
echo "  - Grafana: https://grafana.${DOMAIN:-tu-dominio.com}"
echo "  - Kibana: https://logs.${DOMAIN:-tu-dominio.com}"
echo "  - Prometheus: https://metrics.${DOMAIN:-tu-dominio.com}"
echo ""
echo "🔒 Seguridad configurada:"
echo "  - fail2ban activo con 2 perfiles (público y monitoreo)"
echo "  - Redes aisladas para herramientas de monitoreo"
echo "  - Logs separados por perfil de seguridad"
echo ""
echo "📝 Comandos útiles:"
echo "  - Ver logs: docker-compose -f docker-compose.production.yml logs -f"
echo "  - Reiniciar: docker-compose -f docker-compose.production.yml restart"
echo "  - Parar: docker-compose -f docker-compose.production.yml down"
