import { useActiveWeb3React } from 'hooks'
import { useCallback } from 'react'
import { useTransactionAdder, useUserHasSubmittedRecords } from 'state/transactions/hooks'
import { useTransferTokenContract } from './useContract'
import { TransactionResponse } from '@ethersproject/providers'
import { calculateGasMargin } from 'utils'
import { CurrencyAmount } from 'constants/token'

export function useTransfer() {
  const { account } = useActiveWeb3React()
  const addTransaction = useTransactionAdder()
  const submitted = useUserHasSubmittedRecords(account || undefined, 'distribute tokens')
  const contract = useTransferTokenContract()

  const run = useCallback(
    async (
      isEth: boolean,
      tokenAddress: string,
      address: string[],
      amount: any,
      total: CurrencyAmount
    ): Promise<{
      hash: string
      transactionResult: Promise<void>
    }> => {
      if (!account) {
        return Promise.reject('no account')
      }
      if (!contract) {
        return Promise.reject('no contract')
      }
      const args = isEth ? [address, amount] : [tokenAddress, address, amount]
      const func = isEth ? 'disperseEther' : 'disperseToken'

      const estimatedGas = await contract.estimateGas[func](...args, {
        value: isEth ? total.raw.toString() : undefined
      }).catch((error: Error) => {
        console.debug('Failed to claim', error)
        throw error
      })
      return contract[func](...args, {
        value: isEth ? total.raw.toString() : undefined,
        gasLimit: calculateGasMargin(estimatedGas)
      }).then((response: TransactionResponse) => {
        addTransaction(response, {
          summary: `distribute token`,
          userSubmitted: {
            account,
            action: `distribute_token`,
            key: '1'
          }
        })
        return {
          hash: response.hash,
          transactionResult: response.wait(1).then(receipt => {
            if (receipt.status === 1) {
              Promise.resolve()
            }
            Promise.reject('The transaction seems to have failed')
          })
        }
      })
    },
    [account, contract, addTransaction]
  )

  return { run, submitted }
}
