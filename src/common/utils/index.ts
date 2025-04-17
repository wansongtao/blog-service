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

export const deepFindItem = <T extends Record<string, any>>(
  data: T[],
  compare: (value: T) => boolean,
  childrenKey = 'children',
): T | undefined => {
  let item: T | undefined = undefined;

  for (let i = 0; i < data.length; i++) {
    const value = data[i];
    if (compare(value)) {
      item = value;
      break;
    }

    if (!value[childrenKey]) {
      continue;
    }

    item = deepFindItem(value[childrenKey], compare, childrenKey);
    if (item !== undefined) {
      break;
    }
  }

  return item;
};
