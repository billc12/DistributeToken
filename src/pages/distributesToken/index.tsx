import { Box, Button, OutlinedInput, Stack, Typography } from '@mui/material'
import { isAddress } from 'ethers/lib/utils'
import { useMemo, useState } from 'react'
import { ChainId } from 'constants/chain'
import { useActiveWeb3React } from 'hooks'
import { useCurrencyBalance } from 'state/wallet/hooks'
import { Currency } from 'constants/token/currency'
import BigNumber from 'bignumber.js'
import { useBaseContract } from 'hooks/useContract'

interface IToken {
  chainId: ChainId | number | undefined
  address: string
  decimals: number
  symbol?: string
  logoURI?: string
  smallUrl?: string
  balance?: number
  name?: string
  dangerous?: boolean
}
const supportToken: IToken[] = [
  {
    chainId: ChainId.SEPOLIA,
    name: 'USDT',
    address: '0x5c58eC0b4A18aFB85f9D6B02FE3e6454f988436E',
    symbol: 'USDT',
    decimals: 6,
    logoURI: ''
  }
]
const abi = [
  {
    inputs: [
      { internalType: 'address', name: 'token', type: 'address' },
      { internalType: 'address[]', name: 'tos', type: 'address[]' },
      { internalType: 'uint256[]', name: 'amounts', type: 'uint256[]' }
    ],
    name: 'distributes',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'token', type: 'address' },
      { internalType: 'address[]', name: 'tos', type: 'address[]' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' }
    ],
    name: 'distributesSameAmount',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
]
const BalanceBox = ({ tokenCurrency }: { tokenCurrency: Currency }) => {
  const { account, chainId } = useActiveWeb3React()
  const balance = useCurrencyBalance(account, tokenCurrency, chainId)
  return <Typography component={'span'}>{balance?.toSignificant(18)}</Typography>
}
// 可以编写提交按钮了
// const toBlock = ({})=>{}
const DistributesToken = () => {
  //   const { chainId } = useActiveWeb3React()
  const [tokenAddress, setTokenAddress] = useState('')
  const [toAccount, setToAccount] = useState({
    account: '',
    amount: new BigNumber(0)
  })
  const tokenCurrency = useMemo(() => {
    const token = supportToken.find(
      s => isAddress(tokenAddress) && isAddress(tokenAddress) === isAddress(s.address)
    ) as IToken
    if (token) {
      return new Currency(
        (token?.chainId as number) || ChainId.SEPOLIA,
        token?.address,
        token?.decimals,
        token?.symbol,
        token?.name,
        token?.logoURI
      )
    }
    return null
  }, [tokenAddress])
  const contract = useBaseContract('0xa1d5fbd7ed05a6da1c03dc372a7dcd3332c48fd8', abi, true, 11155111)
  console.log(contract)

  return (
    <Box sx={{ width: 500 }}>
      <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Typography>转移的token地址</Typography>
        <Typography>token balance: {tokenCurrency && <BalanceBox tokenCurrency={tokenCurrency} />}</Typography>
      </Stack>
      <Box>
        <OutlinedInput
          value={tokenAddress}
          onChange={e => setTokenAddress(e.target.value)}
          sx={{ width: '100%', marginTop: 10 }}
          placeholder="address"
        />
        {!isAddress(tokenAddress) && (
          <Typography mt={5} sx={{ color: 'red' }}>
            请输入合法地址
          </Typography>
        )}
      </Box>
      <Stack mt={20}>
        <Stack sx={{ flexDirection: 'row', gap: 20, alignItems: 'center' }}>
          <Box>
            <Typography>用户地址</Typography>
            <OutlinedInput
              value={toAccount.account}
              onChange={e =>
                setToAccount({
                  ...toAccount,
                  account: e.target.value
                })
              }
              sx={{ width: 200, marginTop: 5 }}
            />
          </Box>
          <Box>
            <Typography>数量</Typography>
            <OutlinedInput
              value={toAccount.amount}
              onChange={e =>
                setToAccount({
                  ...toAccount,
                  amount: new BigNumber(e.target.value)
                })
              }
              sx={{ width: 200, marginTop: 5 }}
            />
          </Box>
          <Button sx={{ whiteSpace: 'nowrap' }}>增加</Button>
        </Stack>
      </Stack>
    </Box>
  )
}
export default DistributesToken
