/**
 * Sistema de permisos con bitmask para control granular de acceso
 *
 * Cada permiso es un bit individual que se puede combinar usando operaciones bitwise.
 * Esto permite almacenar todos los permisos de un usuario en un solo número (BigInt).
 */

export const PERMISSIONS = {
  // Invitados (5 permisos)
  GUESTS_VIEW: 1n << 0n, // 1 - Ver lista de invitados
  GUESTS_CREATE: 1n << 1n, // 2 - Agregar nuevos invitados
  GUESTS_EDIT: 1n << 2n, // 4 - Modificar invitados existentes
  GUESTS_DELETE: 1n << 3n, // 8 - Eliminar invitados
  GUESTS_SEND: 1n << 4n, // 16 - Enviar invitaciones

  // Diseño/Theme (2 permisos)
  DESIGN_VIEW: 1n << 5n, // 32 - Ver configuración de diseño
  DESIGN_EDIT: 1n << 6n, // 64 - Modificar theme, colores, fuentes

  // Estructura (2 permisos)
  STRUCTURE_VIEW: 1n << 7n, // 128 - Ver secciones de la invitación
  STRUCTURE_EDIT: 1n << 8n, // 256 - Habilitar/deshabilitar secciones

  // Analytics (1 permiso)
  ANALYTICS_VIEW: 1n << 9n, // 512 - Ver estadísticas y métricas

  // Configuración (2 permisos)
  SETTINGS_VIEW: 1n << 10n, // 1024 - Ver configuración del evento
  SETTINGS_EDIT: 1n << 11n, // 2048 - Modificar configuración del evento

  // Colaboradores (4 permisos)
  COLLABORATORS_VIEW: 1n << 12n, // 4096 - Ver lista de colaboradores
  COLLABORATORS_INVITE: 1n << 13n, // 8192 - Invitar nuevos colaboradores
  COLLABORATORS_EDIT: 1n << 14n, // 16384 - Editar permisos de colaboradores
  COLLABORATORS_REMOVE: 1n << 15n, // 32768 - Revocar acceso a colaboradores

  // Evento - Acciones críticas (2 permisos)
  EVENT_DELETE: 1n << 16n, // 65536 - Eliminar evento
  EVENT_TRANSFER: 1n << 17n, // 131072 - Transferir ownership
} as const;

/**
 * Presets de permisos para roles comunes
 * Estos son combinaciones predefinidas que se pueden aplicar rápidamente
 */
export const PERMISSION_PRESETS = {
  /**
   * OWNER - Control total del evento
   * Tiene TODOS los permisos sin excepción
   */
  OWNER: Object.values(PERMISSIONS).reduce((acc, val) => acc | val, 0n),

  /**
   * ADMIN - Administrador del evento
   * Puede hacer todo excepto eliminar el evento o transferir ownership
   */
  ADMIN:
    PERMISSIONS.GUESTS_VIEW |
    PERMISSIONS.GUESTS_CREATE |
    PERMISSIONS.GUESTS_EDIT |
    PERMISSIONS.GUESTS_DELETE |
    PERMISSIONS.GUESTS_SEND |
    PERMISSIONS.DESIGN_VIEW |
    PERMISSIONS.DESIGN_EDIT |
    PERMISSIONS.STRUCTURE_VIEW |
    PERMISSIONS.STRUCTURE_EDIT |
    PERMISSIONS.ANALYTICS_VIEW |
    PERMISSIONS.SETTINGS_VIEW |
    PERMISSIONS.SETTINGS_EDIT |
    PERMISSIONS.COLLABORATORS_VIEW |
    PERMISSIONS.COLLABORATORS_INVITE |
    PERMISSIONS.COLLABORATORS_EDIT,

  /**
   * EDITOR - Editor del evento
   * Solo puede gestionar invitados y ver analytics
   * No puede modificar diseño, estructura ni colaboradores
   */
  EDITOR:
    PERMISSIONS.GUESTS_VIEW |
    PERMISSIONS.GUESTS_CREATE |
    PERMISSIONS.GUESTS_EDIT |
    PERMISSIONS.GUESTS_SEND |
    PERMISSIONS.ANALYTICS_VIEW,

  /**
   * VIEWER - Solo lectura
   * Puede ver todo pero no modificar nada
   */
  VIEWER:
    PERMISSIONS.GUESTS_VIEW |
    PERMISSIONS.DESIGN_VIEW |
    PERMISSIONS.STRUCTURE_VIEW |
    PERMISSIONS.ANALYTICS_VIEW,

  /**
   * CLIENT - Cliente del evento
   * Puede gestionar invitados completamente + ver diseño y analytics
   * Caso de uso: Cliente que quiere cargar y enviar sus propias invitaciones
   */
  CLIENT:
    PERMISSIONS.GUESTS_VIEW |
    PERMISSIONS.GUESTS_CREATE |
    PERMISSIONS.GUESTS_EDIT |
    PERMISSIONS.GUESTS_SEND |
    PERMISSIONS.DESIGN_VIEW |
    PERMISSIONS.STRUCTURE_VIEW |
    PERMISSIONS.ANALYTICS_VIEW,
} as const;

/**
 * Verifica si un usuario tiene un permiso específico
 *
 * @param userPermissions - Permisos del usuario (bitmask)
 * @param permission - Permiso a verificar
 * @returns true si el usuario tiene el permiso
 *
 * @example
 * hasPermission(userPerms, PERMISSIONS.GUESTS_EDIT) // true/false
 */
export function hasPermission(
  userPermissions: bigint,
  permission: bigint,
): boolean {
  return (userPermissions & permission) === permission;
}

/**
 * Verifica si un usuario tiene TODOS los permisos especificados
 *
 * @param userPermissions - Permisos del usuario
 * @param permissions - Array de permisos requeridos
 * @returns true si tiene todos los permisos
 *
 * @example
 * hasAllPermissions(userPerms, [PERMISSIONS.GUESTS_VIEW, PERMISSIONS.GUESTS_EDIT])
 */
export function hasAllPermissions(
  userPermissions: bigint,
  permissions: bigint[],
): boolean {
  return permissions.every((perm) => hasPermission(userPermissions, perm));
}

/**
 * Verifica si un usuario tiene AL MENOS UNO de los permisos especificados
 *
 * @param userPermissions - Permisos del usuario
 * @param permissions - Array de permisos
 * @returns true si tiene al menos uno
 *
 * @example
 * hasAnyPermission(userPerms, [PERMISSIONS.DESIGN_EDIT, PERMISSIONS.STRUCTURE_EDIT])
 */
export function hasAnyPermission(
  userPermissions: bigint,
  permissions: bigint[],
): boolean {
  return permissions.some((perm) => hasPermission(userPermissions, perm));
}

/**
 * Agrega un permiso a un usuario
 *
 * @param userPermissions - Permisos actuales
 * @param permission - Permiso a agregar
 * @returns Nuevos permisos
 *
 * @example
 * const newPerms = addPermission(userPerms, PERMISSIONS.DESIGN_EDIT)
 */
export function addPermission(
  userPermissions: bigint,
  permission: bigint,
): bigint {
  return userPermissions | permission;
}

/**
 * Agrega múltiples permisos a un usuario
 *
 * @param userPermissions - Permisos actuales
 * @param permissions - Array de permisos a agregar
 * @returns Nuevos permisos
 */
export function addPermissions(
  userPermissions: bigint,
  permissions: bigint[],
): bigint {
  return permissions.reduce((acc, perm) => acc | perm, userPermissions);
}

/**
 * Remueve un permiso de un usuario
 *
 * @param userPermissions - Permisos actuales
 * @param permission - Permiso a remover
 * @returns Nuevos permisos
 *
 * @example
 * const newPerms = removePermission(userPerms, PERMISSIONS.GUESTS_DELETE)
 */
export function removePermission(
  userPermissions: bigint,
  permission: bigint,
): bigint {
  return userPermissions & ~permission;
}

/**
 * Remueve múltiples permisos de un usuario
 *
 * @param userPermissions - Permisos actuales
 * @param permissions - Array de permisos a remover
 * @returns Nuevos permisos
 */
export function removePermissions(
  userPermissions: bigint,
  permissions: bigint[],
): bigint {
  return permissions.reduce((acc, perm) => acc & ~perm, userPermissions);
}

/**
 * Alterna un permiso (si lo tiene lo quita, si no lo tiene lo agrega)
 *
 * @param userPermissions - Permisos actuales
 * @param permission - Permiso a alternar
 * @returns Nuevos permisos
 *
 * @example
 * const newPerms = togglePermission(userPerms, PERMISSIONS.DESIGN_EDIT)
 */
export function togglePermission(
  userPermissions: bigint,
  permission: bigint,
): bigint {
  return userPermissions ^ permission;
}

/**
 * Obtiene los nombres de los permisos que tiene un usuario
 * Útil para debugging y logs
 *
 * @param permissions - Permisos del usuario
 * @returns Array de nombres de permisos
 *
 * @example
 * getPermissionNames(userPerms) // ['GUESTS_VIEW', 'GUESTS_EDIT', 'DESIGN_VIEW']
 */
export function getPermissionNames(permissions: bigint): string[] {
  return Object.entries(PERMISSIONS)
    .filter(([_, value]) => (permissions & value) === value)
    .map(([key]) => key);
}

/**
 * Grupos de permisos para organizar la UI
 * Agrupa permisos relacionados para facilitar la visualización
 */
export interface PermissionGroup {
  label: string;
  description: string;
  permissions: Array<{
    key: keyof typeof PERMISSIONS;
    label: string;
    description: string;
  }>;
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    label: "Invitados",
    description: "Gestión de la lista de invitados",
    permissions: [
      {
        key: "GUESTS_VIEW",
        label: "Ver",
        description: "Ver lista de invitados y sus respuestas",
      },
      {
        key: "GUESTS_CREATE",
        label: "Crear",
        description: "Agregar nuevos invitados a la lista",
      },
      {
        key: "GUESTS_EDIT",
        label: "Editar",
        description: "Modificar información de invitados existentes",
      },
      {
        key: "GUESTS_DELETE",
        label: "Eliminar",
        description: "Borrar invitados de la lista",
      },
      {
        key: "GUESTS_SEND",
        label: "Enviar",
        description: "Enviar invitaciones a los invitados",
      },
    ],
  },
  {
    label: "Diseño & Theming",
    description: "Apariencia visual de la invitación",
    permissions: [
      {
        key: "DESIGN_VIEW",
        label: "Ver",
        description: "Ver configuración actual de diseño y theme",
      },
      {
        key: "DESIGN_EDIT",
        label: "Editar",
        description: "Modificar theme, colores, fuentes y estilos",
      },
    ],
  },
  {
    label: "Estructura",
    description: "Secciones y contenido de la invitación",
    permissions: [
      {
        key: "STRUCTURE_VIEW",
        label: "Ver",
        description: "Ver qué secciones están habilitadas",
      },
      {
        key: "STRUCTURE_EDIT",
        label: "Editar",
        description: "Habilitar/deshabilitar y configurar secciones",
      },
    ],
  },
  {
    label: "Analytics",
    description: "Estadísticas y métricas del evento",
    permissions: [
      {
        key: "ANALYTICS_VIEW",
        label: "Ver",
        description: "Ver estadísticas de confirmaciones y métricas",
      },
    ],
  },
  {
    label: "Configuración",
    description: "Configuración general del evento",
    permissions: [
      {
        key: "SETTINGS_VIEW",
        label: "Ver",
        description: "Ver configuración del evento",
      },
      {
        key: "SETTINGS_EDIT",
        label: "Editar",
        description: "Modificar configuración general",
      },
    ],
  },
  {
    label: "Colaboradores",
    description: "Gestión de miembros del equipo",
    permissions: [
      {
        key: "COLLABORATORS_VIEW",
        label: "Ver",
        description: "Ver lista de colaboradores del evento",
      },
      {
        key: "COLLABORATORS_INVITE",
        label: "Invitar",
        description: "Generar links de invitación para colaboradores",
      },
      {
        key: "COLLABORATORS_EDIT",
        label: "Editar",
        description: "Modificar permisos de colaboradores existentes",
      },
      {
        key: "COLLABORATORS_REMOVE",
        label: "Revocar",
        description: "Revocar acceso a colaboradores",
      },
    ],
  },
  {
    label: "Evento (Crítico)",
    description: "Acciones críticas que afectan el evento completo",
    permissions: [
      {
        key: "EVENT_DELETE",
        label: "Eliminar Evento",
        description: "Eliminar el evento permanentemente",
      },
      {
        key: "EVENT_TRANSFER",
        label: "Transferir Ownership",
        description: "Transferir la propiedad del evento a otro usuario",
      },
    ],
  },
];
