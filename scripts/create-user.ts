#!/usr/bin/env tsx

/**
 * Script para crear el primer usuario manualmente
 *
 * Uso: pnpm run internal:create-user
 *
 * Nota: En producción, los usuarios se registran vía /sign-up
 * Este script es útil solo para desarrollo/testing inicial
 */

import prisma from "../lib/prisma";
import bcrypt from "bcryptjs";
import readline from "node:readline";

// Pregunta normal (muestra lo que se escribe)
function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// Pregunta oculta (no muestra nada mientras tipeás)
function promptHidden(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  const origWrite = (rl as any)._writeToOutput;

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      (rl as any)._writeToOutput = origWrite;
      process.stdout.write("\n");
      rl.close();
      resolve(answer);
    });

    setTimeout(() => {
      (rl as any)._writeToOutput = function _writeToOutput(
        _stringToWrite: string,
      ) {
        // No escribimos nada mientras se tipea la contraseña
      };
    }, 0);

    rl.on("SIGINT", () => {
      (rl as any)._writeToOutput = origWrite;
      process.stdout.write("\n❌ Cancelado.\n");
      rl.close();
      process.exit(130);
    });
  });
}

async function main() {
  console.log("🎭 Creando usuario (Better Auth)");
  console.log("================================\n");

  try {
    // Solicitar nombre
    const name = await prompt("👤 Nombre completo: ");

    if (!name.trim()) {
      console.log("❌ El nombre no puede estar vacío");
      process.exit(1);
    }

    // Solicitar email
    const email = await prompt("📧 Email: ");

    if (!email.trim() || !email.includes("@")) {
      console.log("❌ Email inválido");
      process.exit(1);
    }

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim() },
    });

    if (existingUser) {
      console.log("❌ Ya existe un usuario con ese email");
      process.exit(1);
    }

    // Solicitar contraseña de forma segura
    const password = await promptHidden("🔒 Password (mín 8 caracteres): ");

    if (!password || password.length < 8) {
      console.log("❌ La contraseña debe tener al menos 8 caracteres");
      process.exit(1);
    }

    // Confirmar contraseña
    const confirmPassword = await promptHidden("🔐 Confirmar password: ");

    if (password !== confirmPassword) {
      console.log("❌ Las contraseñas no coinciden");
      process.exit(1);
    }

    console.log("\n⏳ Creando usuario...");

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el usuario
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim(),
        emailVerified: true, // Pre-verificado para testing
      },
    });

    // Crear la cuenta (para email/password)
    await prisma.account.create({
      data: {
        id: `${user.id}_credential`,
        userId: user.id,
        accountId: user.id,
        providerId: "credential",
        password: hashedPassword,
      },
    });

    console.log("\n✅ ¡Usuario creado exitosamente!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`👤 Nombre: ${user.name}`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`🆔 ID: ${user.id}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎉 ¡Ya puedes iniciar sesión en /login!");
  } catch (error) {
    console.error("\n💥 Error inesperado:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
