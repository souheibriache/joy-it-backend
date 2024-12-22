export const getErrorMessage = (errors) => {
  const firstError = Array.isArray(errors) ? errors[0] : errors

  if (Array.isArray(firstError?.children) && firstError.children.length)
    return getErrorMessage(firstError?.children)

  const constraints = firstError?.constraints || {
    message: 'default error message from ValidationErrorFilter',
  }

  return constraints[Object.keys(constraints)[0]]
}
