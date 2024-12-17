import { User, Profile, Permission } from '@prisma/client';

export class UserPermissionInfoEntity {
  user_name: User['userName'];
  nick_name: Profile['nickName'];
  avatar: Profile['avatar'];
  role_names: string;
  id: Permission['id'];
  pid: Permission['pid'];
  name: Permission['name'];
  path: Permission['path'];
  permission: Permission['permission'];
  type: Permission['type'];
  component: Permission['component'];
  cache: Permission['cache'];
  hidden: Permission['hidden'];
  icon: Permission['icon'];
  redirect: Permission['redirect'];
  props: Permission['props'];
  sort: Permission['sort'];
}
