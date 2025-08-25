'use client';

import { useState } from 'react';
import { Button } from '@heroui/button';
import { Copy, Check } from 'lucide-react';

interface BankInfoProps {
  alias: string;
  bankName?: string;
  accountType?: string;
  accountHolder?: string;
}

export default function BankInfo({ 
  alias, 
  bankName = "Banco", 
  accountType = "Cuenta Corriente",
  accountHolder = "NOMBRE APELLIDO"
}: BankInfoProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(alias);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  return (
    <div className="bg-secondary/20 rounded-lg p-6 max-w-md w-full">
      <div className="text-center space-y-4">
        <h3 className="text-lg font-semibold">Datos Bancarios</h3>
        
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Banco:</span> {bankName}
          </div>
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Tipo de cuenta:</span> {accountType}
          </div>
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Titular:</span> {accountHolder}
          </div>
        </div>

        <div className="bg-background rounded-md p-3 border">
          <div className="text-sm text-muted-foreground mb-1">ALIAS</div>
          <div className="font-mono text-lg font-bold break-all">{alias}</div>
        </div>

        <Button
          color="primary"
          variant="flat"
          startContent={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          onClick={handleCopy}
          className="w-full"
        >
          {copied ? '¡Copiado!' : 'Copiar ALIAS'}
        </Button>
      </div>
    </div>
  );
}
