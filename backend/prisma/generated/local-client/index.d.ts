
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model QuestionPaper
 * 
 */
export type QuestionPaper = $Result.DefaultSelection<Prisma.$QuestionPaperPayload>

/**
 * ##  Prisma Client ʲˢ
 * 
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more QuestionPapers
 * const questionPapers = await prisma.questionPaper.findMany()
 * ```
 *
 * 
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   * 
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more QuestionPapers
   * const questionPapers = await prisma.questionPaper.findMany()
   * ```
   *
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): void;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb, ExtArgs>

      /**
   * `prisma.questionPaper`: Exposes CRUD operations for the **QuestionPaper** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more QuestionPapers
    * const questionPapers = await prisma.questionPaper.findMany()
    * ```
    */
  get questionPaper(): Prisma.QuestionPaperDelegate<ExtArgs>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError
  export import NotFoundError = runtime.NotFoundError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics 
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 5.20.0
   * Query Engine version: 06fc58a368dc7be9fbbbe894adf8d445d208c284
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion 

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? K : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    QuestionPaper: 'QuestionPaper'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb extends $Utils.Fn<{extArgs: $Extensions.InternalArgs, clientOptions: PrismaClientOptions }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], this['params']['clientOptions']>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> = {
    meta: {
      modelProps: "questionPaper"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      QuestionPaper: {
        payload: Prisma.$QuestionPaperPayload<ExtArgs>
        fields: Prisma.QuestionPaperFieldRefs
        operations: {
          findUnique: {
            args: Prisma.QuestionPaperFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionPaperPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.QuestionPaperFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionPaperPayload>
          }
          findFirst: {
            args: Prisma.QuestionPaperFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionPaperPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.QuestionPaperFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionPaperPayload>
          }
          findMany: {
            args: Prisma.QuestionPaperFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionPaperPayload>[]
          }
          create: {
            args: Prisma.QuestionPaperCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionPaperPayload>
          }
          createMany: {
            args: Prisma.QuestionPaperCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.QuestionPaperCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionPaperPayload>[]
          }
          delete: {
            args: Prisma.QuestionPaperDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionPaperPayload>
          }
          update: {
            args: Prisma.QuestionPaperUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionPaperPayload>
          }
          deleteMany: {
            args: Prisma.QuestionPaperDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.QuestionPaperUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.QuestionPaperUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionPaperPayload>
          }
          aggregate: {
            args: Prisma.QuestionPaperAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateQuestionPaper>
          }
          groupBy: {
            args: Prisma.QuestionPaperGroupByArgs<ExtArgs>
            result: $Utils.Optional<QuestionPaperGroupByOutputType>[]
          }
          count: {
            args: Prisma.QuestionPaperCountArgs<ExtArgs>
            result: $Utils.Optional<QuestionPaperCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
  }


  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */



  /**
   * Models
   */

  /**
   * Model QuestionPaper
   */

  export type AggregateQuestionPaper = {
    _count: QuestionPaperCountAggregateOutputType | null
    _min: QuestionPaperMinAggregateOutputType | null
    _max: QuestionPaperMaxAggregateOutputType | null
  }

  export type QuestionPaperMinAggregateOutputType = {
    id: string | null
    classId: string | null
    subject: string | null
    title: string | null
    examType: string | null
    fileUrl: string | null
    dateUploaded: Date | null
    uploadedBy: string | null
  }

  export type QuestionPaperMaxAggregateOutputType = {
    id: string | null
    classId: string | null
    subject: string | null
    title: string | null
    examType: string | null
    fileUrl: string | null
    dateUploaded: Date | null
    uploadedBy: string | null
  }

  export type QuestionPaperCountAggregateOutputType = {
    id: number
    classId: number
    subject: number
    title: number
    examType: number
    fileUrl: number
    dateUploaded: number
    uploadedBy: number
    _all: number
  }


  export type QuestionPaperMinAggregateInputType = {
    id?: true
    classId?: true
    subject?: true
    title?: true
    examType?: true
    fileUrl?: true
    dateUploaded?: true
    uploadedBy?: true
  }

  export type QuestionPaperMaxAggregateInputType = {
    id?: true
    classId?: true
    subject?: true
    title?: true
    examType?: true
    fileUrl?: true
    dateUploaded?: true
    uploadedBy?: true
  }

  export type QuestionPaperCountAggregateInputType = {
    id?: true
    classId?: true
    subject?: true
    title?: true
    examType?: true
    fileUrl?: true
    dateUploaded?: true
    uploadedBy?: true
    _all?: true
  }

  export type QuestionPaperAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which QuestionPaper to aggregate.
     */
    where?: QuestionPaperWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuestionPapers to fetch.
     */
    orderBy?: QuestionPaperOrderByWithRelationInput | QuestionPaperOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: QuestionPaperWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuestionPapers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuestionPapers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned QuestionPapers
    **/
    _count?: true | QuestionPaperCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: QuestionPaperMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: QuestionPaperMaxAggregateInputType
  }

  export type GetQuestionPaperAggregateType<T extends QuestionPaperAggregateArgs> = {
        [P in keyof T & keyof AggregateQuestionPaper]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateQuestionPaper[P]>
      : GetScalarType<T[P], AggregateQuestionPaper[P]>
  }




  export type QuestionPaperGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: QuestionPaperWhereInput
    orderBy?: QuestionPaperOrderByWithAggregationInput | QuestionPaperOrderByWithAggregationInput[]
    by: QuestionPaperScalarFieldEnum[] | QuestionPaperScalarFieldEnum
    having?: QuestionPaperScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: QuestionPaperCountAggregateInputType | true
    _min?: QuestionPaperMinAggregateInputType
    _max?: QuestionPaperMaxAggregateInputType
  }

  export type QuestionPaperGroupByOutputType = {
    id: string
    classId: string
    subject: string
    title: string
    examType: string
    fileUrl: string
    dateUploaded: Date
    uploadedBy: string
    _count: QuestionPaperCountAggregateOutputType | null
    _min: QuestionPaperMinAggregateOutputType | null
    _max: QuestionPaperMaxAggregateOutputType | null
  }

  type GetQuestionPaperGroupByPayload<T extends QuestionPaperGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<QuestionPaperGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof QuestionPaperGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], QuestionPaperGroupByOutputType[P]>
            : GetScalarType<T[P], QuestionPaperGroupByOutputType[P]>
        }
      >
    >


  export type QuestionPaperSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    classId?: boolean
    subject?: boolean
    title?: boolean
    examType?: boolean
    fileUrl?: boolean
    dateUploaded?: boolean
    uploadedBy?: boolean
  }, ExtArgs["result"]["questionPaper"]>

  export type QuestionPaperSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    classId?: boolean
    subject?: boolean
    title?: boolean
    examType?: boolean
    fileUrl?: boolean
    dateUploaded?: boolean
    uploadedBy?: boolean
  }, ExtArgs["result"]["questionPaper"]>

  export type QuestionPaperSelectScalar = {
    id?: boolean
    classId?: boolean
    subject?: boolean
    title?: boolean
    examType?: boolean
    fileUrl?: boolean
    dateUploaded?: boolean
    uploadedBy?: boolean
  }


  export type $QuestionPaperPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "QuestionPaper"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      classId: string
      subject: string
      title: string
      examType: string
      fileUrl: string
      dateUploaded: Date
      uploadedBy: string
    }, ExtArgs["result"]["questionPaper"]>
    composites: {}
  }

  type QuestionPaperGetPayload<S extends boolean | null | undefined | QuestionPaperDefaultArgs> = $Result.GetResult<Prisma.$QuestionPaperPayload, S>

  type QuestionPaperCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<QuestionPaperFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: QuestionPaperCountAggregateInputType | true
    }

  export interface QuestionPaperDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['QuestionPaper'], meta: { name: 'QuestionPaper' } }
    /**
     * Find zero or one QuestionPaper that matches the filter.
     * @param {QuestionPaperFindUniqueArgs} args - Arguments to find a QuestionPaper
     * @example
     * // Get one QuestionPaper
     * const questionPaper = await prisma.questionPaper.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends QuestionPaperFindUniqueArgs>(args: SelectSubset<T, QuestionPaperFindUniqueArgs<ExtArgs>>): Prisma__QuestionPaperClient<$Result.GetResult<Prisma.$QuestionPaperPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one QuestionPaper that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {QuestionPaperFindUniqueOrThrowArgs} args - Arguments to find a QuestionPaper
     * @example
     * // Get one QuestionPaper
     * const questionPaper = await prisma.questionPaper.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends QuestionPaperFindUniqueOrThrowArgs>(args: SelectSubset<T, QuestionPaperFindUniqueOrThrowArgs<ExtArgs>>): Prisma__QuestionPaperClient<$Result.GetResult<Prisma.$QuestionPaperPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first QuestionPaper that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuestionPaperFindFirstArgs} args - Arguments to find a QuestionPaper
     * @example
     * // Get one QuestionPaper
     * const questionPaper = await prisma.questionPaper.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends QuestionPaperFindFirstArgs>(args?: SelectSubset<T, QuestionPaperFindFirstArgs<ExtArgs>>): Prisma__QuestionPaperClient<$Result.GetResult<Prisma.$QuestionPaperPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first QuestionPaper that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuestionPaperFindFirstOrThrowArgs} args - Arguments to find a QuestionPaper
     * @example
     * // Get one QuestionPaper
     * const questionPaper = await prisma.questionPaper.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends QuestionPaperFindFirstOrThrowArgs>(args?: SelectSubset<T, QuestionPaperFindFirstOrThrowArgs<ExtArgs>>): Prisma__QuestionPaperClient<$Result.GetResult<Prisma.$QuestionPaperPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more QuestionPapers that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuestionPaperFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all QuestionPapers
     * const questionPapers = await prisma.questionPaper.findMany()
     * 
     * // Get first 10 QuestionPapers
     * const questionPapers = await prisma.questionPaper.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const questionPaperWithIdOnly = await prisma.questionPaper.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends QuestionPaperFindManyArgs>(args?: SelectSubset<T, QuestionPaperFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuestionPaperPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a QuestionPaper.
     * @param {QuestionPaperCreateArgs} args - Arguments to create a QuestionPaper.
     * @example
     * // Create one QuestionPaper
     * const QuestionPaper = await prisma.questionPaper.create({
     *   data: {
     *     // ... data to create a QuestionPaper
     *   }
     * })
     * 
     */
    create<T extends QuestionPaperCreateArgs>(args: SelectSubset<T, QuestionPaperCreateArgs<ExtArgs>>): Prisma__QuestionPaperClient<$Result.GetResult<Prisma.$QuestionPaperPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many QuestionPapers.
     * @param {QuestionPaperCreateManyArgs} args - Arguments to create many QuestionPapers.
     * @example
     * // Create many QuestionPapers
     * const questionPaper = await prisma.questionPaper.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends QuestionPaperCreateManyArgs>(args?: SelectSubset<T, QuestionPaperCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many QuestionPapers and returns the data saved in the database.
     * @param {QuestionPaperCreateManyAndReturnArgs} args - Arguments to create many QuestionPapers.
     * @example
     * // Create many QuestionPapers
     * const questionPaper = await prisma.questionPaper.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many QuestionPapers and only return the `id`
     * const questionPaperWithIdOnly = await prisma.questionPaper.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends QuestionPaperCreateManyAndReturnArgs>(args?: SelectSubset<T, QuestionPaperCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuestionPaperPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a QuestionPaper.
     * @param {QuestionPaperDeleteArgs} args - Arguments to delete one QuestionPaper.
     * @example
     * // Delete one QuestionPaper
     * const QuestionPaper = await prisma.questionPaper.delete({
     *   where: {
     *     // ... filter to delete one QuestionPaper
     *   }
     * })
     * 
     */
    delete<T extends QuestionPaperDeleteArgs>(args: SelectSubset<T, QuestionPaperDeleteArgs<ExtArgs>>): Prisma__QuestionPaperClient<$Result.GetResult<Prisma.$QuestionPaperPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one QuestionPaper.
     * @param {QuestionPaperUpdateArgs} args - Arguments to update one QuestionPaper.
     * @example
     * // Update one QuestionPaper
     * const questionPaper = await prisma.questionPaper.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends QuestionPaperUpdateArgs>(args: SelectSubset<T, QuestionPaperUpdateArgs<ExtArgs>>): Prisma__QuestionPaperClient<$Result.GetResult<Prisma.$QuestionPaperPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more QuestionPapers.
     * @param {QuestionPaperDeleteManyArgs} args - Arguments to filter QuestionPapers to delete.
     * @example
     * // Delete a few QuestionPapers
     * const { count } = await prisma.questionPaper.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends QuestionPaperDeleteManyArgs>(args?: SelectSubset<T, QuestionPaperDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more QuestionPapers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuestionPaperUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many QuestionPapers
     * const questionPaper = await prisma.questionPaper.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends QuestionPaperUpdateManyArgs>(args: SelectSubset<T, QuestionPaperUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one QuestionPaper.
     * @param {QuestionPaperUpsertArgs} args - Arguments to update or create a QuestionPaper.
     * @example
     * // Update or create a QuestionPaper
     * const questionPaper = await prisma.questionPaper.upsert({
     *   create: {
     *     // ... data to create a QuestionPaper
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the QuestionPaper we want to update
     *   }
     * })
     */
    upsert<T extends QuestionPaperUpsertArgs>(args: SelectSubset<T, QuestionPaperUpsertArgs<ExtArgs>>): Prisma__QuestionPaperClient<$Result.GetResult<Prisma.$QuestionPaperPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of QuestionPapers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuestionPaperCountArgs} args - Arguments to filter QuestionPapers to count.
     * @example
     * // Count the number of QuestionPapers
     * const count = await prisma.questionPaper.count({
     *   where: {
     *     // ... the filter for the QuestionPapers we want to count
     *   }
     * })
    **/
    count<T extends QuestionPaperCountArgs>(
      args?: Subset<T, QuestionPaperCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], QuestionPaperCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a QuestionPaper.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuestionPaperAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends QuestionPaperAggregateArgs>(args: Subset<T, QuestionPaperAggregateArgs>): Prisma.PrismaPromise<GetQuestionPaperAggregateType<T>>

    /**
     * Group by QuestionPaper.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuestionPaperGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends QuestionPaperGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: QuestionPaperGroupByArgs['orderBy'] }
        : { orderBy?: QuestionPaperGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, QuestionPaperGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetQuestionPaperGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the QuestionPaper model
   */
  readonly fields: QuestionPaperFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for QuestionPaper.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__QuestionPaperClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the QuestionPaper model
   */ 
  interface QuestionPaperFieldRefs {
    readonly id: FieldRef<"QuestionPaper", 'String'>
    readonly classId: FieldRef<"QuestionPaper", 'String'>
    readonly subject: FieldRef<"QuestionPaper", 'String'>
    readonly title: FieldRef<"QuestionPaper", 'String'>
    readonly examType: FieldRef<"QuestionPaper", 'String'>
    readonly fileUrl: FieldRef<"QuestionPaper", 'String'>
    readonly dateUploaded: FieldRef<"QuestionPaper", 'DateTime'>
    readonly uploadedBy: FieldRef<"QuestionPaper", 'String'>
  }
    

  // Custom InputTypes
  /**
   * QuestionPaper findUnique
   */
  export type QuestionPaperFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionPaper
     */
    select?: QuestionPaperSelect<ExtArgs> | null
    /**
     * Filter, which QuestionPaper to fetch.
     */
    where: QuestionPaperWhereUniqueInput
  }

  /**
   * QuestionPaper findUniqueOrThrow
   */
  export type QuestionPaperFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionPaper
     */
    select?: QuestionPaperSelect<ExtArgs> | null
    /**
     * Filter, which QuestionPaper to fetch.
     */
    where: QuestionPaperWhereUniqueInput
  }

  /**
   * QuestionPaper findFirst
   */
  export type QuestionPaperFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionPaper
     */
    select?: QuestionPaperSelect<ExtArgs> | null
    /**
     * Filter, which QuestionPaper to fetch.
     */
    where?: QuestionPaperWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuestionPapers to fetch.
     */
    orderBy?: QuestionPaperOrderByWithRelationInput | QuestionPaperOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for QuestionPapers.
     */
    cursor?: QuestionPaperWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuestionPapers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuestionPapers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of QuestionPapers.
     */
    distinct?: QuestionPaperScalarFieldEnum | QuestionPaperScalarFieldEnum[]
  }

  /**
   * QuestionPaper findFirstOrThrow
   */
  export type QuestionPaperFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionPaper
     */
    select?: QuestionPaperSelect<ExtArgs> | null
    /**
     * Filter, which QuestionPaper to fetch.
     */
    where?: QuestionPaperWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuestionPapers to fetch.
     */
    orderBy?: QuestionPaperOrderByWithRelationInput | QuestionPaperOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for QuestionPapers.
     */
    cursor?: QuestionPaperWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuestionPapers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuestionPapers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of QuestionPapers.
     */
    distinct?: QuestionPaperScalarFieldEnum | QuestionPaperScalarFieldEnum[]
  }

  /**
   * QuestionPaper findMany
   */
  export type QuestionPaperFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionPaper
     */
    select?: QuestionPaperSelect<ExtArgs> | null
    /**
     * Filter, which QuestionPapers to fetch.
     */
    where?: QuestionPaperWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuestionPapers to fetch.
     */
    orderBy?: QuestionPaperOrderByWithRelationInput | QuestionPaperOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing QuestionPapers.
     */
    cursor?: QuestionPaperWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuestionPapers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuestionPapers.
     */
    skip?: number
    distinct?: QuestionPaperScalarFieldEnum | QuestionPaperScalarFieldEnum[]
  }

  /**
   * QuestionPaper create
   */
  export type QuestionPaperCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionPaper
     */
    select?: QuestionPaperSelect<ExtArgs> | null
    /**
     * The data needed to create a QuestionPaper.
     */
    data: XOR<QuestionPaperCreateInput, QuestionPaperUncheckedCreateInput>
  }

  /**
   * QuestionPaper createMany
   */
  export type QuestionPaperCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many QuestionPapers.
     */
    data: QuestionPaperCreateManyInput | QuestionPaperCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * QuestionPaper createManyAndReturn
   */
  export type QuestionPaperCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionPaper
     */
    select?: QuestionPaperSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many QuestionPapers.
     */
    data: QuestionPaperCreateManyInput | QuestionPaperCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * QuestionPaper update
   */
  export type QuestionPaperUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionPaper
     */
    select?: QuestionPaperSelect<ExtArgs> | null
    /**
     * The data needed to update a QuestionPaper.
     */
    data: XOR<QuestionPaperUpdateInput, QuestionPaperUncheckedUpdateInput>
    /**
     * Choose, which QuestionPaper to update.
     */
    where: QuestionPaperWhereUniqueInput
  }

  /**
   * QuestionPaper updateMany
   */
  export type QuestionPaperUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update QuestionPapers.
     */
    data: XOR<QuestionPaperUpdateManyMutationInput, QuestionPaperUncheckedUpdateManyInput>
    /**
     * Filter which QuestionPapers to update
     */
    where?: QuestionPaperWhereInput
  }

  /**
   * QuestionPaper upsert
   */
  export type QuestionPaperUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionPaper
     */
    select?: QuestionPaperSelect<ExtArgs> | null
    /**
     * The filter to search for the QuestionPaper to update in case it exists.
     */
    where: QuestionPaperWhereUniqueInput
    /**
     * In case the QuestionPaper found by the `where` argument doesn't exist, create a new QuestionPaper with this data.
     */
    create: XOR<QuestionPaperCreateInput, QuestionPaperUncheckedCreateInput>
    /**
     * In case the QuestionPaper was found with the provided `where` argument, update it with this data.
     */
    update: XOR<QuestionPaperUpdateInput, QuestionPaperUncheckedUpdateInput>
  }

  /**
   * QuestionPaper delete
   */
  export type QuestionPaperDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionPaper
     */
    select?: QuestionPaperSelect<ExtArgs> | null
    /**
     * Filter which QuestionPaper to delete.
     */
    where: QuestionPaperWhereUniqueInput
  }

  /**
   * QuestionPaper deleteMany
   */
  export type QuestionPaperDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which QuestionPapers to delete
     */
    where?: QuestionPaperWhereInput
  }

  /**
   * QuestionPaper without action
   */
  export type QuestionPaperDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionPaper
     */
    select?: QuestionPaperSelect<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const QuestionPaperScalarFieldEnum: {
    id: 'id',
    classId: 'classId',
    subject: 'subject',
    title: 'title',
    examType: 'examType',
    fileUrl: 'fileUrl',
    dateUploaded: 'dateUploaded',
    uploadedBy: 'uploadedBy'
  };

  export type QuestionPaperScalarFieldEnum = (typeof QuestionPaperScalarFieldEnum)[keyof typeof QuestionPaperScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  /**
   * Field references 
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    
  /**
   * Deep Input Types
   */


  export type QuestionPaperWhereInput = {
    AND?: QuestionPaperWhereInput | QuestionPaperWhereInput[]
    OR?: QuestionPaperWhereInput[]
    NOT?: QuestionPaperWhereInput | QuestionPaperWhereInput[]
    id?: StringFilter<"QuestionPaper"> | string
    classId?: StringFilter<"QuestionPaper"> | string
    subject?: StringFilter<"QuestionPaper"> | string
    title?: StringFilter<"QuestionPaper"> | string
    examType?: StringFilter<"QuestionPaper"> | string
    fileUrl?: StringFilter<"QuestionPaper"> | string
    dateUploaded?: DateTimeFilter<"QuestionPaper"> | Date | string
    uploadedBy?: StringFilter<"QuestionPaper"> | string
  }

  export type QuestionPaperOrderByWithRelationInput = {
    id?: SortOrder
    classId?: SortOrder
    subject?: SortOrder
    title?: SortOrder
    examType?: SortOrder
    fileUrl?: SortOrder
    dateUploaded?: SortOrder
    uploadedBy?: SortOrder
  }

  export type QuestionPaperWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: QuestionPaperWhereInput | QuestionPaperWhereInput[]
    OR?: QuestionPaperWhereInput[]
    NOT?: QuestionPaperWhereInput | QuestionPaperWhereInput[]
    classId?: StringFilter<"QuestionPaper"> | string
    subject?: StringFilter<"QuestionPaper"> | string
    title?: StringFilter<"QuestionPaper"> | string
    examType?: StringFilter<"QuestionPaper"> | string
    fileUrl?: StringFilter<"QuestionPaper"> | string
    dateUploaded?: DateTimeFilter<"QuestionPaper"> | Date | string
    uploadedBy?: StringFilter<"QuestionPaper"> | string
  }, "id">

  export type QuestionPaperOrderByWithAggregationInput = {
    id?: SortOrder
    classId?: SortOrder
    subject?: SortOrder
    title?: SortOrder
    examType?: SortOrder
    fileUrl?: SortOrder
    dateUploaded?: SortOrder
    uploadedBy?: SortOrder
    _count?: QuestionPaperCountOrderByAggregateInput
    _max?: QuestionPaperMaxOrderByAggregateInput
    _min?: QuestionPaperMinOrderByAggregateInput
  }

  export type QuestionPaperScalarWhereWithAggregatesInput = {
    AND?: QuestionPaperScalarWhereWithAggregatesInput | QuestionPaperScalarWhereWithAggregatesInput[]
    OR?: QuestionPaperScalarWhereWithAggregatesInput[]
    NOT?: QuestionPaperScalarWhereWithAggregatesInput | QuestionPaperScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"QuestionPaper"> | string
    classId?: StringWithAggregatesFilter<"QuestionPaper"> | string
    subject?: StringWithAggregatesFilter<"QuestionPaper"> | string
    title?: StringWithAggregatesFilter<"QuestionPaper"> | string
    examType?: StringWithAggregatesFilter<"QuestionPaper"> | string
    fileUrl?: StringWithAggregatesFilter<"QuestionPaper"> | string
    dateUploaded?: DateTimeWithAggregatesFilter<"QuestionPaper"> | Date | string
    uploadedBy?: StringWithAggregatesFilter<"QuestionPaper"> | string
  }

  export type QuestionPaperCreateInput = {
    id?: string
    classId: string
    subject: string
    title: string
    examType: string
    fileUrl: string
    dateUploaded?: Date | string
    uploadedBy: string
  }

  export type QuestionPaperUncheckedCreateInput = {
    id?: string
    classId: string
    subject: string
    title: string
    examType: string
    fileUrl: string
    dateUploaded?: Date | string
    uploadedBy: string
  }

  export type QuestionPaperUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    classId?: StringFieldUpdateOperationsInput | string
    subject?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    examType?: StringFieldUpdateOperationsInput | string
    fileUrl?: StringFieldUpdateOperationsInput | string
    dateUploaded?: DateTimeFieldUpdateOperationsInput | Date | string
    uploadedBy?: StringFieldUpdateOperationsInput | string
  }

  export type QuestionPaperUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    classId?: StringFieldUpdateOperationsInput | string
    subject?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    examType?: StringFieldUpdateOperationsInput | string
    fileUrl?: StringFieldUpdateOperationsInput | string
    dateUploaded?: DateTimeFieldUpdateOperationsInput | Date | string
    uploadedBy?: StringFieldUpdateOperationsInput | string
  }

  export type QuestionPaperCreateManyInput = {
    id?: string
    classId: string
    subject: string
    title: string
    examType: string
    fileUrl: string
    dateUploaded?: Date | string
    uploadedBy: string
  }

  export type QuestionPaperUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    classId?: StringFieldUpdateOperationsInput | string
    subject?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    examType?: StringFieldUpdateOperationsInput | string
    fileUrl?: StringFieldUpdateOperationsInput | string
    dateUploaded?: DateTimeFieldUpdateOperationsInput | Date | string
    uploadedBy?: StringFieldUpdateOperationsInput | string
  }

  export type QuestionPaperUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    classId?: StringFieldUpdateOperationsInput | string
    subject?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    examType?: StringFieldUpdateOperationsInput | string
    fileUrl?: StringFieldUpdateOperationsInput | string
    dateUploaded?: DateTimeFieldUpdateOperationsInput | Date | string
    uploadedBy?: StringFieldUpdateOperationsInput | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type QuestionPaperCountOrderByAggregateInput = {
    id?: SortOrder
    classId?: SortOrder
    subject?: SortOrder
    title?: SortOrder
    examType?: SortOrder
    fileUrl?: SortOrder
    dateUploaded?: SortOrder
    uploadedBy?: SortOrder
  }

  export type QuestionPaperMaxOrderByAggregateInput = {
    id?: SortOrder
    classId?: SortOrder
    subject?: SortOrder
    title?: SortOrder
    examType?: SortOrder
    fileUrl?: SortOrder
    dateUploaded?: SortOrder
    uploadedBy?: SortOrder
  }

  export type QuestionPaperMinOrderByAggregateInput = {
    id?: SortOrder
    classId?: SortOrder
    subject?: SortOrder
    title?: SortOrder
    examType?: SortOrder
    fileUrl?: SortOrder
    dateUploaded?: SortOrder
    uploadedBy?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }



  /**
   * Aliases for legacy arg types
   */
    /**
     * @deprecated Use QuestionPaperDefaultArgs instead
     */
    export type QuestionPaperArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = QuestionPaperDefaultArgs<ExtArgs>

  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}