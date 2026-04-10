// 信用等级 - 对齐 credit_level.go
export enum CreditScoreLevel {
  Danger = 0,  // LevelDanger
  Midium = 1,  // LevelMidium
  Good = 2     // LevelGood
}

// 性别 - 对齐 gender.go
export enum Gender {
  Unknown = 0,  // GenderUnknown
  Male = 1,     // GenderMale
  Female = 2    // GenderFemale
}

// 权限 - 对齐 permission.go
export enum Permission {
  Normal = 0,  // NormalPermission
  Admin = 1    // AdminPermission
}

// 枚举→中文映射（用于界面展示）
export const CreditLevelMap: Record<CreditScoreLevel, { label: string; type: 'danger' | 'warning' | 'success' | 'info' }> = {
  [CreditScoreLevel.Danger]: { label: '危险', type: 'danger' },
  [CreditScoreLevel.Midium]: { label: '中等', type: 'warning' },
  [CreditScoreLevel.Good]: { label: '良好', type: 'success' }
}

export const GenderMap: Record<Gender, string> = {
  [Gender.Unknown]: '未知',
  [Gender.Male]: '男',
  [Gender.Female]: '女'
}

export const PermissionMap: Record<Permission, string> = {
  [Permission.Normal]: '普通用户',
  [Permission.Admin]: '管理员'
}