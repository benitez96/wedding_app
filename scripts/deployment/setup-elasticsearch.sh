#!/bin/bash

# Script para configurar Elasticsearch con pipeline de geolocalización
# Uso: ./scripts/deployment/setup-elasticsearch.sh

set -e

echo "🔧 Configurando Elasticsearch..."

# Esperar a que Elasticsearch esté listo
echo "⏳ Esperando a que Elasticsearch esté listo..."
until curl -s http://localhost:9200/_cluster/health > /dev/null; do
    echo "  Esperando Elasticsearch..."
    sleep 5
done

echo "✅ Elasticsearch está listo"

# Crear el pipeline de ingest para geolocalización
echo "📋 Creando pipeline de ingest..."
curl -X PUT "localhost:9200/_ingest/pipeline/wedding-app-geoip" \
  -H "Content-Type: application/json" \
  -d @config/elasticsearch/ingest-pipeline.json

echo "✅ Pipeline creado exitosamente"

# Verificar que el pipeline se creó correctamente
echo "🔍 Verificando pipeline..."
curl -s "localhost:9200/_ingest/pipeline/wedding-app-geoip" | jq '.'

# Crear template de índice para logs
echo "📊 Creando template de índice..."
curl -X PUT "localhost:9200/_template/wedding-app-logs" \
  -H "Content-Type: application/json" \
  -d '{
    "index_patterns": ["wedding-app-logs-*"],
    "settings": {
      "number_of_shards": 1,
      "number_of_replicas": 0,
      "index.lifecycle.name": "wedding-app-logs-policy"
    },
    "mappings": {
      "properties": {
        "remote_addr": { "type": "ip" },
        "ban_ip": { "type": "ip" },
        "unban_ip": { "type": "ip" },
        "geoip": {
          "properties": {
            "location": { "type": "geo_point" },
            "country_name": { "type": "keyword" },
            "city_name": { "type": "keyword" },
            "region_name": { "type": "keyword" }
          }
        },
        "ban_geoip": {
          "properties": {
            "location": { "type": "geo_point" },
            "country_name": { "type": "keyword" },
            "city_name": { "type": "keyword" },
            "region_name": { "type": "keyword" }
          }
        },
        "unban_geoip": {
          "properties": {
            "location": { "type": "geo_point" },
            "country_name": { "type": "keyword" },
            "city_name": { "type": "keyword" },
            "region_name": { "type": "keyword" }
          }
        }
      }
    }
  }'

echo "✅ Template de índice creado"

# Crear política de lifecycle para logs (opcional)
echo "📅 Creando política de lifecycle..."
curl -X PUT "localhost:9200/_ilm/policy/wedding-app-logs-policy" \
  -H "Content-Type: application/json" \
  -d '{
    "policy": {
      "phases": {
        "hot": {
          "min_age": "0ms",
          "actions": {
            "rollover": {
              "max_size": "1GB",
              "max_age": "1d"
            }
          }
        },
        "delete": {
          "min_age": "30d",
          "actions": {
            "delete": {}
          }
        }
      }
    }
  }'

echo "✅ Política de lifecycle creada"

echo "🎉 Configuración de Elasticsearch completada!"
echo ""
echo "📊 Ahora puedes:"
echo "  - Ver logs con geolocalización en Kibana"
echo "  - Crear mapas con las ubicaciones de las IPs"
echo "  - Analizar tráfico por país/región"
echo "  - Ver IPs baneadas con su ubicación geográfica"
