import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator'

@ValidatorConstraint({ name: 'isUnique', async: false })
export class IsUnique implements ValidatorConstraintInterface {
  validate(values: any[]): boolean {
    return values.length === Array.from(new Set(values)).length
  }
  defaultMessage(): string {
    return 'Duplicate elements'
  }
}
