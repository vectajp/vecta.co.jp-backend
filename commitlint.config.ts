import type { UserConfig } from '@commitlint/types'
import { RuleConfigSeverity } from '@commitlint/types'

// noinspection JSUnusedGlobalSymbols
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'subject-case': [RuleConfigSeverity.Disabled, 'never', []],
  },
} satisfies UserConfig
