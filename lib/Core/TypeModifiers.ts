import { If, AllowsUndefined, AllowsNull } from "./TypeConditionals";

/**
 * Makes a target type `| undefined` if the source type is `| undefined`.
 * @example
 * type T = CopyUndefined<number | undefined, string>; // string | undefined
 */
export type CopyUndefined<TSource, TTarget> = If<
  AllowsUndefined<TSource>,
  TTarget | undefined,
  TTarget
>;

/**
 * Makes a target type `| null` if the source type is `| null`.
 * @example
 * type T = CopyNull<number | null, string>; // string | undefined
 */
export type CopyNull<TSource, TTarget> = If<
  AllowsNull<TSource>,
  TTarget | null,
  TTarget
>;

/**
 * Makes a target type `| null` and/or `| undefined` if the source
 * type is these.
 * @example
 * type T = CopyNullAndUndefined<number | null | undefined, string>; // string | null | undefined
 */
export type CopyNullAndUndefined<TSource, TTarget> = If<
  AllowsNull<TSource>,
  If<AllowsUndefined<TSource>, TTarget | null | undefined, TTarget | null>,
  If<AllowsUndefined<TSource>, TTarget | undefined, TTarget>
>;

/**
 * Removes `| undefined` from the type.
 * @example
 * type T = NotUndefined<number | undefined>; // number
 */
export type NotUndefined<T> = T extends undefined ? never : T;

/**
 * Makes all properties required to be present. Any that were previously optional are
 * allowed to be undefined.
 * @example
 * type T = Complete<{
 *     foo?: number; // becomes `foo: number | undefined`
 * }>;
 */
export type Complete<T> = {
  [P in keyof Required<T>]: Pick<T, P> extends Required<Pick<T, P>>
    ? T[P]
    : T[P] | undefined;
};
