#!/bin/bash

# Script para configurar fail2ban con reglas personalizadas para Caddy
# Uso: sudo ./scripts/setup-fail2ban.sh

set -e

echo "🔒 Configurando fail2ban para Caddy..."

# Verificar que fail2ban esté instalado
if ! command -v fail2ban-client &> /dev/null; then
    echo "❌ fail2ban no está instalado. Instalando..."
    sudo apt update
    sudo apt install -y fail2ban
fi

# Crear directorio para configuraciones personalizadas
sudo mkdir -p /etc/fail2ban/jail.d

# Copiar configuraciones de jail
echo "📋 Copiando configuraciones de jail..."
sudo cp config/security/fail2ban/fail2ban-caddy-public.conf /etc/fail2ban/jail.d/
sudo cp config/security/fail2ban/fail2ban-caddy-monitoring.conf /etc/fail2ban/jail.d/

# Crear directorio para filtros personalizados
sudo mkdir -p /etc/fail2ban/filter.d

# Copiar filtros personalizados
echo "🔍 Copiando filtros personalizados..."
sudo cp config/security/fail2ban/filter.d/caddy-public.conf /etc/fail2ban/filter.d/
sudo cp config/security/fail2ban/filter.d/caddy-monitoring.conf /etc/fail2ban/filter.d/

# Configurar logrotate para los logs de Caddy
echo "📝 Configurando logrotate..."
sudo tee /etc/logrotate.d/caddy > /dev/null <<EOF
/volumes/wedding-app/caddy/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        systemctl reload fail2ban
    endscript
}
EOF

# Reiniciar fail2ban
echo "🔄 Reiniciando fail2ban..."
sudo systemctl restart fail2ban
sudo systemctl enable fail2ban

# Verificar estado
echo "✅ Verificando estado de fail2ban..."
sudo fail2ban-client status

echo "🎯 Jails configurados:"
sudo fail2ban-client status caddy-public
sudo fail2ban-client status caddy-monitoring

echo "📊 Comandos útiles:"
echo "  - Ver logs: sudo tail -f /var/log/fail2ban.log"
echo "  - Ver IPs baneadas: sudo fail2ban-client banned"
echo "  - Desbanear IP: sudo fail2ban-client set caddy-public unbanip <IP>"
echo "  - Desbanear IP: sudo fail2ban-client set caddy-monitoring unbanip <IP>"

echo "✅ Configuración de fail2ban completada!"
