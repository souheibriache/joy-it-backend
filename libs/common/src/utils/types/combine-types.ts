type Prettify<T> = {
  [K in keyof T]: T[K]
}

export type Combine<T1, T2> = Prettify<{
  [K in keyof (T1 | T2)]: T1[K] | T2[K]
}> &
  Prettify<T1 & T2>
