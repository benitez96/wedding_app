"use client";

import { useQRCode } from "next-qrcode";

interface InvitationQRCodeProps {
  tokenId: string;
  guestName: string;
  className?: string;
}

/**
 * Componente QR para invitación pública
 *
 * El QR contiene únicamente el tokenId de la invitación.
 * Este mismo token se usa en /r/[token] para acceder a la invitación.
 *
 * Al escanear en el evento:
 * - Staff lee el tokenId del QR
 * - Busca la invitación asociada
 * - Registra el check-in
 */
export default function InvitationQRCode({
  tokenId,
  guestName: _guestName,
  className = "",
}: InvitationQRCodeProps) {
  const { Canvas } = useQRCode();

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <Canvas
          text={tokenId}
          options={{
            errorCorrectionLevel: "M",
            margin: 2,
            scale: 4,
            width: 256,
            color: {
              dark: "#000000",
              light: "#FFFFFF",
            },
          }}
        />
      </div>

      <div className="text-center">
        <p className="text-sm font-medium text-default-700">Código de acceso</p>
        <p className="text-xs text-default-500">
          Mostrar al ingresar al evento
        </p>
      </div>

      {/* Token ID (para debug, ocultar en producción) */}
      {process.env.NODE_ENV === "development" && (
        <div className="text-xs text-default-400 font-mono">{tokenId}</div>
      )}
    </div>
  );
}
