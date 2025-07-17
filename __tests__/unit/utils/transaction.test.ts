// Unit tests for transaction utility
// Tests atomic operations and rollback functionality

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Transaction } from '../../../src/services/utils/transaction';

describe('Transaction', () => {
  let transaction: Transaction;
  
  beforeEach(() => {
    transaction = new Transaction();
  });

  describe('Basic operations', () => {
    it('should execute operations in order', async () => {
      const executionOrder: number[] = [];
      
      transaction.add('op1', async () => {
        executionOrder.push(1);
        return 'result1';
      });
      
      transaction.add('op2', async () => {
        executionOrder.push(2);
        return 'result2';
      });
      
      transaction.add('op3', async () => {
        executionOrder.push(3);
        return 'result3';
      });
      
      await transaction.commit();
      
      expect(executionOrder).toEqual([1, 2, 3]);
    });

    it('should return results in order', async () => {
      transaction.add('op1', async () => 'result1');
      transaction.add('op2', async () => 'result2');
      transaction.add('op3', async () => 'result3');
      
      const results = await transaction.commit();
      
      expect(results).toEqual(['result1', 'result2', 'result3']);
    });

    it('should handle empty transaction', async () => {
      const results = await transaction.commit();
      expect(results).toEqual([]);
    });

    it('should only execute once on multiple commits', async () => {
      let executionCount = 0;
      
      transaction.add('op1', async () => {
        executionCount++;
        return 'result';
      });
      
      await transaction.commit();
      
      // Should throw on subsequent commits since transaction is already committed
      await expect(transaction.commit()).rejects.toThrow('Transaction already committed');
      await expect(transaction.commit()).rejects.toThrow('Transaction already committed');
      
      expect(executionCount).toBe(1);
    });
  });

  describe('Error handling', () => {
    it('should stop execution on first error', async () => {
      const executionOrder: number[] = [];
      
      transaction.add('op1', async () => {
        executionOrder.push(1);
        return 'result1';
      });
      
      transaction.add('op2', async () => {
        executionOrder.push(2);
        throw new Error('Operation 2 failed');
      });
      
      transaction.add('op3', async () => {
        executionOrder.push(3);
        return 'result3';
      });
      
      await expect(transaction.commit()).rejects.toThrow('Transaction failed at operation');
      expect(executionOrder).toEqual([1, 2]); // op3 should not execute
    });

    it('should throw error after attempting rollback', async () => {
      transaction.add('op1', async () => 'result1');
      transaction.add('op2', async () => {
        throw new Error('Failed operation');
      });
      
      await expect(transaction.commit()).rejects.toThrow('Transaction failed at operation');
    });
  });

  describe('Rollback functionality', () => {
    it('should rollback operations in reverse order', async () => {
      const rollbackOrder: number[] = [];
      
      transaction.add(
        'op1',
        async () => 'result1',
        async () => { rollbackOrder.push(1); }
      );
      
      transaction.add(
        'op2',
        async () => {
          throw new Error('Op2 failed');
        },
        async () => { rollbackOrder.push(2); }
      );
      
      transaction.add(
        'op3',
        async () => 'result3',
        async () => { rollbackOrder.push(3); }
      );
      
      await expect(transaction.commit()).rejects.toThrow('Op2 failed');
      expect(rollbackOrder).toEqual([1]); // Only op1 should be rolled back
    });

    it('should handle rollback errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {}) as any;
      
      transaction.add(
        'op1',
        async () => 'result1',
        async () => { throw new Error('Rollback failed'); }
      );
      
      transaction.add(
        'op2',
        async () => { throw new Error('Op2 failed'); }
      );
      
      await expect(transaction.commit()).rejects.toThrow('Some rollback operations failed');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to rollback operation op1:',
        expect.any(Error)
      );
      
      consoleErrorSpy.mockRestore();
    });

    it('should not rollback operations that were not executed', async () => {
      const rollbackCalls: string[] = [];
      
      transaction.add(
        'op1',
        async () => 'result1',
        async () => { rollbackCalls.push('rollback1'); }
      );
      
      transaction.add(
        'op2',
        async () => { throw new Error('Failed'); },
        async () => { rollbackCalls.push('rollback2'); }
      );
      
      transaction.add(
        'op3',
        async () => 'result3',
        async () => { rollbackCalls.push('rollback3'); }
      );
      
      await expect(transaction.commit()).rejects.toThrow('Failed');
      expect(rollbackCalls).toEqual(['rollback1']); // Only op1 was executed successfully
    });

    it('should store operation results', async () => {
      transaction.add(
        'op1',
        async () => ({ id: '123', data: 'test' })
      );
      
      transaction.add(
        'op2',
        async () => { throw new Error('Failed'); }
      );
      
      await expect(transaction.commit()).rejects.toThrow('Failed');
      
      // Check that we can get the result of the first operation
      const result = transaction.getResult('op1');
      expect(result).toEqual({ id: '123', data: 'test' });
    });
  });

  describe('Manual rollback', () => {
    it('should allow manual rollback', async () => {
      const rollbackOrder: string[] = [];
      
      transaction.add(
        'op1',
        async () => 'result1',
        async () => { rollbackOrder.push('rollback1'); }
      );
      
      transaction.add(
        'op2',
        async () => 'result2',
        async () => { rollbackOrder.push('rollback2'); }
      );
      
      // Execute but don't commit
      await transaction['execute']();
      
      // Manual rollback
      await transaction.rollback();
      
      expect(rollbackOrder).toEqual(['rollback2', 'rollback1']);
    });

    it('should handle manual rollback without execution', async () => {
      const rollbackCalls: string[] = [];
      
      transaction.add(
        'op1',
        async () => 'result1',
        async () => { rollbackCalls.push('rollback1'); }
      );
      
      // Rollback without executing
      await transaction.rollback();
      
      expect(rollbackCalls).toEqual([]); // Nothing to rollback
    });
  });

  describe('Complex scenarios', () => {
    it('should handle async operations with delays', async () => {
      const results: string[] = [];
      
      transaction.add('op1', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        results.push('delayed1');
        return 'result1';
      });
      
      transaction.add('op2', async () => {
        results.push('immediate2');
        return 'result2';
      });
      
      transaction.add('op3', async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
        results.push('delayed3');
        return 'result3';
      });
      
      await transaction.commit();
      
      // Should maintain order despite delays
      expect(results).toEqual(['delayed1', 'immediate2', 'delayed3']);
    });

    it('should handle operations that modify external state', async () => {
      const externalState = { counter: 0, items: [] as string[] };
      
      transaction.add(
        'increment',
        async () => {
          externalState.counter++;
          return externalState.counter;
        },
        async () => {
          externalState.counter--;
        }
      );
      
      transaction.add(
        'addItem',
        async () => {
          externalState.items.push('item1');
          return 'item1';
        },
        async () => {
          externalState.items.pop();
        }
      );
      
      transaction.add(
        'failingOp',
        async () => {
          throw new Error('This operation fails');
        }
      );
      
      await expect(transaction.commit()).rejects.toThrow('This operation fails');
      
      // State should be rolled back
      expect(externalState.counter).toBe(0);
      expect(externalState.items).toEqual([]);
    });

    it('should handle operations with different return types', async () => {
      transaction.add('stringOp', async () => 'string result');
      transaction.add('numberOp', async () => 42);
      transaction.add('objectOp', async () => ({ key: 'value' }));
      transaction.add('arrayOp', async () => [1, 2, 3]);
      transaction.add('booleanOp', async () => true);
      transaction.add('nullOp', async () => null);
      
      const results = await transaction.commit();
      
      expect(results).toEqual([
        'string result',
        42,
        { key: 'value' },
        [1, 2, 3],
        true,
        null,
      ]);
    });
  });
});