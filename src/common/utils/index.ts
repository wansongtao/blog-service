export const generateMenus = <T extends { id: number; pid: number | null }>(
  permissions: T[],
) => {
  const permissionMap = new Map<number, T & { children?: T[] }>();
  const menus: (T & { children?: T[] })[] = [];

  permissions.forEach((permission) => {
    permissionMap.set(permission.id, permission);
  });

  permissions.forEach((permission) => {
    if (!permission.pid) {
      menus.push(permission);
      return;
    }

    const parent = permissionMap.get(permission.pid);
    if (!parent) {
      menus.push(permission);
      return;
    }

    if (parent.children) {
      parent.children.push(permission);
      return;
    }

    parent.children = [permission];
  });

  return menus;
};

export const getSeconds = (time: number, unit: 's' | 'm' | 'h' | 'd') => {
  switch (unit) {
    case 's':
      return time;
    case 'm':
      return time * 60;
    case 'h':
      return time * 60 * 60;
    case 'd':
      return time * 60 * 60 * 24;
    default:
      return time;
  }
};

export const deepFindItem = <T extends Record<any, any>>(
  data: T[],
  compare: (value: T) => boolean,
  childrenKey = 'children',
): T | undefined => {
  const queue = [...data];

  while (queue.length) {
    const value = queue.shift();
    if (compare(value)) {
      return value;
    }

    if (Array.isArray(value[childrenKey]) && value[childrenKey]?.length) {
      queue.push(...value[childrenKey]);
    }
  }
};
