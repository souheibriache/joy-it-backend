import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator'

@ValidatorConstraint({ name: 'isUnique', async: false })
export class IsUnique implements ValidatorConstraintInterface {
  validate(values: any[]): boolean {
    if (!values) return true
    if (!Array.isArray(values)) return true
    return values.length === new Set(values).size
  }
  defaultMessage(): string {
    return 'Duplicate elements are not allowed'
  }
}
