import { Box, Button, OutlinedInput, Stack, Typography } from '@mui/material'
import { ChainId } from 'constants/chain'
import { Currency } from 'constants/token/currency'
import { useActiveWeb3React } from 'hooks'
import { useMemo, useState } from 'react'
import { isAddress } from 'utils'
import { useCurrencyBalance } from 'state/wallet/hooks'
import { CurrencyAmount } from 'constants/token/fractions/currencyAmount'
import { useWalletModalToggle } from 'state/application/hooks'
import { useSwitchNetwork } from 'hooks/useSwitchNetwork'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
interface Token {
  chainId: ChainId
  address: string
  decimals: number
  symbol?: string
  logoURI?: string
  name?: string
  dangerous?: boolean
}
interface IAccount {
  account: string
  amount: string
}
const tokenList: Token[] = [
  {
    chainId: ChainId.SEPOLIA,
    name: 'USDT',
    address: '0x5c58eC0b4A18aFB85f9D6B02FE3e6454f988436E',
    symbol: 'USDT',
    decimals: 6,
    logoURI: ''
  } //0xB7912cCB16F4CBfB807e23ff4BD1eD1B001B70dF
  // 0xeeD4F9e2d60a315d171F6d034b8D08c5E905f30D
]
const connectAddress = '0xa1d5fbd7ed05a6da1c03dc372a7dcd3332c48fd8'
const DistributesToken = () => {
  const { account, chainId } = useActiveWeb3React()
  const [tokenAddress, setTokenAddress] = useState('0x5c58eC0b4A18aFB85f9D6B02FE3e6454f988436E')

  const [accountList, setAccountList] = useState<IAccount[]>([
    { account: '0xB7912cCB16F4CBfB807e23ff4BD1eD1B001B70dF', amount: '' }
  ])
  const isValidAddress = useMemo(
    () => !!isAddress(tokenAddress) && tokenList.some(i => isAddress(i.address) === isAddress(tokenAddress)),
    [tokenAddress]
  )
  const tokenCurrency = useMemo(() => {
    if (account && chainId === ChainId.SEPOLIA && isValidAddress) {
      const token = new Currency(ChainId.SEPOLIA, '0x5c58eC0b4A18aFB85f9D6B02FE3e6454f988436E', 6, 'USDT', 'USDT', '')
      return token
    }
    return undefined
  }, [account, chainId, isValidAddress])

  const balanceCurrency = useCurrencyBalance(account ?? undefined, tokenCurrency ?? undefined, chainId)
  const currentAmount = useMemo(() => {
    if (!tokenCurrency) return null
    if (!accountList.every(item => item.account && Number(item.amount) > 0)) return null
    let totalCurrencyAmount = CurrencyAmount.fromAmount(tokenCurrency, accountList[0].amount)
    accountList.forEach((item, index) => {
      if (index) {
        totalCurrencyAmount = totalCurrencyAmount?.add(
          CurrencyAmount.fromAmount(tokenCurrency, item.amount) as CurrencyAmount
        )
      }
    })
    const isInsufficient = totalCurrencyAmount?.greaterThan(balanceCurrency as CurrencyAmount)
    return { isInsufficient, totalCurrencyAmount }
  }, [tokenCurrency, accountList, balanceCurrency])
  const [approvalState, approve] = useApproveCallback(currentAmount?.totalCurrencyAmount, connectAddress)

  const walletModalToggle = useWalletModalToggle()
  const switchNetwork = useSwitchNetwork()
  const toApprove = async () => {
    const { transactionReceipt } = await approve()
    transactionReceipt.then(res => {
      console.log('res')
      console.log(res)
    })
  }
  const ActionButton = () => {
    if (!account) return <Button onClick={walletModalToggle}>Connect Wallet</Button>
    if (chainId !== ChainId.SEPOLIA)
      return <Button onClick={() => switchNetwork(ChainId.SEPOLIA)}>Switch Network</Button>
    if (currentAmount?.isInsufficient) return <Button disabled>余额不足</Button>
    if (approvalState === ApprovalState.PENDING) return <Button>正在授权</Button>
    if (approvalState === ApprovalState.NOT_APPROVED) return <Button onClick={toApprove}>去授权</Button>
    if (approvalState === ApprovalState.APPROVED) return <Button>交易</Button>
    return null
  }
  return (
    <Box sx={{ width: 500 }}>
      <Box>
        <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Typography>转移的token地址</Typography>
          <Typography>
            token balance : <Typography component={'span'}>{balanceCurrency?.toSignificant(30)}</Typography>
          </Typography>
        </Stack>
        <OutlinedInput
          value={tokenAddress}
          onChange={e => setTokenAddress(e.target.value)}
          sx={{ width: '100%', marginTop: 10 }}
        />
        {tokenAddress && !isValidAddress && <Typography>请输入正确的token地址</Typography>}
      </Box>
      <Box>
        {accountList.map((item, index) => (
          <Stack
            key={index}
            sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}
          >
            <Box>
              <Typography>用户地址</Typography>
              <OutlinedInput
                sx={{ width: 200 }}
                value={item.account}
                onChange={({ target }) => {
                  const newArr = [...accountList]
                  newArr[index].account = target.value
                  setAccountList([...newArr])
                }}
              />
            </Box>
            <Box>
              <Typography>数量</Typography>
              <OutlinedInput
                sx={{ width: 200 }}
                value={item.amount}
                onChange={({ target }) => {
                  const newArr = [...accountList]
                  newArr[index].amount = target.value
                  setAccountList([...newArr])
                }}
              />
            </Box>
            <Button onClick={() => setAccountList([...accountList, { account: '', amount: '' }])}>增加</Button>
          </Stack>
        ))}
      </Box>
      <ActionButton />
    </Box>
  )
}
export default DistributesToken
