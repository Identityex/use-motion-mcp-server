// Transaction support for atomic operations
// Ensures data consistency across Motion API and local storage

export interface TransactionOperation<T = any> {
  name: string;
  execute: () => Promise<T>;
  rollback?: () => Promise<void>;
  result?: T;
}

export class Transaction {
  private operations: TransactionOperation[] = [];
  private executed: TransactionOperation[] = [];
  private committed = false;
  private rolledBack = false;

  /**
   * Add an operation to the transaction
   */
  add<T>(name: string, execute: () => Promise<T>, rollback?: () => Promise<void>): Transaction {
    if (this.committed) {
      throw new Error('Cannot add operations to a committed transaction');
    }
    if (this.rolledBack) {
      throw new Error('Cannot add operations to a rolled back transaction');
    }

    this.operations.push({ name, execute, rollback });
    return this;
  }

  /**
   * Execute all operations in the transaction
   */
  async execute(): Promise<void> {
    if (this.committed) {
      throw new Error('Transaction already committed');
    }
    if (this.rolledBack) {
      throw new Error('Transaction already rolled back');
    }

    for (const operation of this.operations) {
      try {
        operation.result = await operation.execute();
        this.executed.push(operation);
      } catch (error) {
        // Operation failed, rollback all executed operations
        await this.rollback();
        throw new TransactionError(
          `Transaction failed at operation '${operation.name}': ${error instanceof Error ? error.message : String(error)}`,
          operation.name,
          error
        );
      }
    }
  }

  /**
   * Commit the transaction (execute if not already executed)
   * @returns Array of operation results in order of execution
   */
  async commit(): Promise<any[]> {
    if (this.committed) {
      throw new Error('Transaction already committed');
    }
    if (this.rolledBack) {
      throw new Error('Cannot commit a rolled back transaction');
    }

    // Execute if not already done
    if (this.executed.length === 0) {
      await this.execute();
    }

    this.committed = true;

    // Return results in order
    return this.operations.map(op => op.result);
  }

  /**
   * Rollback all executed operations
   */
  async rollback(): Promise<void> {
    if (this.rolledBack) {
      return; // Already rolled back
    }

    const rollbackErrors: Array<{ operation: string; error: unknown }> = [];

    // Rollback in reverse order
    for (let i = this.executed.length - 1; i >= 0; i--) {
      const operation = this.executed[i];
      if (operation && operation.rollback) {
        try {
          await operation.rollback();
        } catch (error) {
          console.error(`Failed to rollback operation ${operation.name}:`, error);
          rollbackErrors.push({
            operation: operation.name,
            error
          });
        }
      }
    }

    this.rolledBack = true;

    if (rollbackErrors.length > 0) {
      throw new RollbackError('Some rollback operations failed', rollbackErrors);
    }
  }

  /**
   * Get the result of a specific operation
   */
  getResult<T>(operationName: string): T | undefined {
    const operation = this.executed.find(op => op.name === operationName);
    return operation?.result as T | undefined;
  }

  /**
   * Get all operation results
   */
  getAllResults(): Record<string, any> {
    const results: Record<string, any> = {};
    for (const operation of this.executed) {
      if (operation.result !== undefined) {
        results[operation.name] = operation.result;
      }
    }
    return results;
  }

  /**
   * Check if the transaction is committed
   */
  isCommitted(): boolean {
    return this.committed;
  }

  /**
   * Check if the transaction is rolled back
   */
  isRolledBack(): boolean {
    return this.rolledBack;
  }
}

/**
 * Transaction-specific error
 */
export class TransactionError extends Error {
  constructor(
    message: string,
    public readonly operationName: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'TransactionError';
  }
}

/**
 * Rollback error containing all failed rollback operations
 */
export class RollbackError extends Error {
  constructor(
    message: string,
    public readonly failures: Array<{ operation: string; error: unknown }>
  ) {
    super(message);
    this.name = 'RollbackError';
  }
}

/**
 * Helper function to create a transaction with automatic error handling
 */
export async function withTransaction<T>(
  operations: Array<{
    name: string;
    execute: () => Promise<any>;
    rollback?: () => Promise<void>;
  }>,
  handler: (transaction: Transaction) => Promise<T>
): Promise<T> {
  const transaction = new Transaction();
  
  // Add all operations
  for (const op of operations) {
    transaction.add(op.name, op.execute, op.rollback);
  }

  try {
    const result = await handler(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    if (!transaction.isRolledBack()) {
      await transaction.rollback();
    }
    throw error;
  }
}