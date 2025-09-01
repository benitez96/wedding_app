#!/bin/bash

# Script para inicializar los volúmenes del sistema
# Uso: sudo ./scripts/deployment/init-volumes.sh

set -e

echo "📁 Inicializando volúmenes del sistema..."

# Crear directorio principal de volúmenes
sudo mkdir -p /volumes/wedding-app

# Crear subdirectorios para cada servicio
echo "📂 Creando directorios de volúmenes..."
sudo mkdir -p /volumes/wedding-app/{logs,postgres,elasticsearch,prometheus,grafana,caddy/{data,config,logs}}

# Establecer permisos correctos
echo "🔐 Estableciendo permisos..."
sudo chown -R 1000:1000 /volumes/wedding-app/elasticsearch
sudo chown -R 472:472 /volumes/wedding-app/grafana
sudo chown -R 999:999 /volumes/wedding-app/postgres
sudo chown -R 65534:65534 /volumes/wedding-app/prometheus

# Permisos para logs
sudo chmod 755 /volumes/wedding-app/logs
sudo chmod 755 /volumes/wedding-app/caddy/logs

echo "✅ Volúmenes inicializados correctamente!"
echo "📊 Estructura creada:"
echo "  /volumes/wedding-app/"
echo "  ├── logs/           # Logs de la aplicación"
echo "  ├── postgres/       # Base de datos PostgreSQL"
echo "  ├── elasticsearch/  # Datos de Elasticsearch"
echo "  ├── prometheus/     # Métricas de Prometheus"
echo "  ├── grafana/        # Configuración de Grafana"
echo "  └── caddy/"
echo "      ├── data/       # Certificados SSL"
echo "      ├── config/     # Configuración de Caddy"
echo "      └── logs/       # Logs de acceso"
