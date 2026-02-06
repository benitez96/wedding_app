import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { fileTypeFromBuffer } from "file-type";
import { verifyUserAuth } from "@/lib/server-auth";

// Forzar renderizado dinámico (no estático)
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB (aumentado para videos)

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime", // .mov
];

const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "mp4", "webm", "mov"];

export async function POST(request: NextRequest) {
  try {
    // ✅ SEGURIDAD: Verificar autenticación
    const authResult = await verifyUserAuth();

    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No se encontró ningún archivo" },
        { status: 400 },
      );
    }

    // Validar tipo de archivo (verificación básica del cliente)
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Tipo de archivo no permitido. Solo se aceptan imágenes (JPG, PNG, WebP) y videos (MP4, WebM, MOV)",
        },
        { status: 400 },
      );
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: "El archivo es demasiado grande. Tamaño máximo: 20MB",
        },
        { status: 400 },
      );
    }

    // ✅ SEGURIDAD: Validar y sanitizar extensión
    const fileExt = file.name.split(".").pop()?.toLowerCase();

    if (!fileExt || !ALLOWED_EXTENSIONS.includes(fileExt)) {
      return NextResponse.json(
        {
          success: false,
          error: "Extensión de archivo no válida",
        },
        { status: 400 },
      );
    }

    // Sanitizar extensión (eliminar caracteres no alfanuméricos)
    const sanitizedExt = fileExt.replace(/[^a-z0-9]/g, "");

    // Convertir File a Buffer
    const bytes = await file.arrayBuffer();
    const buffer = new Uint8Array(bytes);

    // ✅ SEGURIDAD: Validar el contenido REAL del archivo (no solo el MIME type)
    const detectedType = await fileTypeFromBuffer(buffer);

    if (!detectedType || !ALLOWED_TYPES.includes(detectedType.mime)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "El tipo de archivo detectado no es válido. El contenido no coincide con la extensión.",
        },
        { status: 400 },
      );
    }

    // Determinar si es imagen o video basado en el tipo REAL detectado
    const isVideo = detectedType.mime.startsWith("video/");

    // Crear directorio si no existe
    const uploadDir = join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generar nombre único
    const timestamp = Date.now();
    const prefix = isVideo ? "hero_video" : "hero";
    const fileName = `${prefix}_${timestamp}.${sanitizedExt}`;
    const filePath = join(uploadDir, fileName);

    // SECURITY: Verify resolved path is within upload directory (path traversal defense)
    const { resolve } = await import("path");
    const resolvedPath = resolve(filePath);
    const resolvedUploadDir = resolve(uploadDir);
    if (!resolvedPath.startsWith(resolvedUploadDir)) {
      return NextResponse.json(
        { success: false, error: "Ruta de archivo inválida" },
        { status: 400 },
      );
    }

    // Guardar archivo
    await writeFile(filePath, buffer);

    // Retornar URL pública
    const publicUrl = `/uploads/${fileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName,
      mediaType: isVideo ? "video" : "image",
    });
  } catch (error) {
    // Error logged server-side only - do not expose details to client
    if (process.env.NODE_ENV === "development") {
      console.error("Error al subir imagen:", error);
    }
    return NextResponse.json(
      { success: false, error: "Error al procesar la imagen" },
      { status: 500 },
    );
  }
}
