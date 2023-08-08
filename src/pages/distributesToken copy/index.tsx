import { Box, Button, OutlinedInput, Stack, Typography } from '@mui/material'
import { isAddress } from 'ethers/lib/utils'
import { useMemo, useState } from 'react'
import { ChainId } from 'constants/chain'
import { useActiveWeb3React } from 'hooks'
import { useCurrencyBalance } from 'state/wallet/hooks'
import { Currency } from 'constants/token/currency'
import { useBaseContract } from 'hooks/useContract'
import { useSwitchNetwork } from 'hooks/useSwitchNetwork'
import { useWalletModalToggle } from 'state/application/hooks'
import { CurrencyAmount } from 'constants/token/fractions/currencyAmount'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'

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
    //0xB7912cCB16F4CBfB807e23ff4BD1eD1B001B70dF
    // 0xeeD4F9e2d60a315d171F6d034b8D08c5E905f30D
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
interface IUser {
  account: string
  amount: string
}
const connectAddress = '0xa1d5fbd7ed05a6da1c03dc372a7dcd3332c48fd8'
const BalanceBox = ({ tokenCurrency }: { tokenCurrency: Currency }) => {
  const { account, chainId } = useActiveWeb3React()
  const balance = useCurrencyBalance(account, tokenCurrency, chainId)
  console.log('balance')
  console.log(balance)

  return <Typography component={'span'}>{balance?.toSignificant(18)}</Typography>
}
const useThan = (formCurrencyAmount: CurrencyAmount, toCurrencyAmount: CurrencyAmount) => {
  return useMemo(() => !formCurrencyAmount.lessThan(toCurrencyAmount), [formCurrencyAmount, toCurrencyAmount])
}
// 钱包显示的价格和实际转账的价格不一样，应该是和精度有关
const ToBlock = ({
  formCurrency,
  userArr,
  allCurrencyAmount
}: {
  formCurrency: Currency
  userArr: IUser[]
  allCurrencyAmount: CurrencyAmount
}) => {
  const { chainId, account } = useActiveWeb3React()
  const formCurrencyAmount = useCurrencyBalance(account, formCurrency, chainId)
  const contract = useBaseContract('0xa1d5fbd7ed05a6da1c03dc372a7dcd3332c48fd8', abi, true, 11155111)
  const toDistribute = () => {
    console.log('toDistribute')
    contract?.distributes(
      formCurrency.address,
      userArr.map(i => i.account),
      userArr.map(i => i.amount)
    )
  }
  console.log(contract)
  const isSufficient = useThan(formCurrencyAmount as CurrencyAmount, allCurrencyAmount as CurrencyAmount)
  if (!isSufficient) {
    return <Button>余额不足</Button>
  }
  return <Button onClick={toDistribute}>确认</Button>
}
// 授权： 授权的状态，是否授权，授权的余额，授权
// 授权的CurrencyAmount
// 授权过后会有一个额度，在获取授权状态的时候，需要指定授权token的数量
// 当授权的token超过额度时，需要重新授权
const ToApprove = ({ allCurrencyAmount }: { allCurrencyAmount: CurrencyAmount }) => {
  const [approvalState, approve] = useApproveCallback(allCurrencyAmount, connectAddress)
  console.log('approvalState', approvalState)
  const toApprove = async () => {
    try {
      const res = await approve()
      console.log(res)
    } catch (error) {
      console.log(error)
    }
  }
  if (approvalState === ApprovalState.NOT_APPROVED) return <Button onClick={toApprove}>ToApprove</Button>
  if (approvalState === ApprovalState.PENDING) return <Button>正在授权</Button>
  return null
}

const DistributesToken = () => {
  const { chainId, account } = useActiveWeb3React()
  const [tokenAddress, setTokenAddress] = useState('')
  const walletModalToggle = useWalletModalToggle()
  const switchNetwork = useSwitchNetwork()
  const [toAccount, setToAccount] = useState<IUser[]>([
    {
      account: '',
      amount: ''
    }
  ])
  const addRow = () => {
    setToAccount([...toAccount, { account: '', amount: '' }])
  }
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
  const allCurrencyAmount = useMemo(() => {
    console.log(tokenCurrency)

    if (!tokenCurrency) return null
    //fromAmount(): 第二个参数不能为0
    // 要怎么去创建一个初始值？
    let total: CurrencyAmount | undefined = undefined
    if (toAccount.every(i => Number(i.amount) && i.amount)) {
      total = CurrencyAmount.fromAmount(tokenCurrency, toAccount[0].amount)
      toAccount.forEach((item, index) => {
        if (index === 0) return
        total = total?.add(CurrencyAmount.fromAmount(tokenCurrency, item.amount) as CurrencyAmount)
      })
      console.log('total')
      console.log(total?.toSignificant())
    }

    return total
  }, [tokenCurrency, toAccount])
  const ErrorButton = () => {
    if (!account) {
      return <Button onClick={walletModalToggle}> Connect Wallet </Button>
    }
    if (chainId !== ChainId.SEPOLIA) {
      return <Button onClick={() => switchNetwork(ChainId.SEPOLIA)}>Switch NetWork</Button>
    }
    return null
  }
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
        {toAccount.map((item, index) => (
          <Stack key={index} sx={{ flexDirection: 'row', gap: 20, alignItems: 'center' }}>
            <Box>
              <Typography>用户地址</Typography>
              <OutlinedInput
                value={item.account}
                onChange={e => {
                  const newArr = [...toAccount]
                  newArr[index].account = e.target.value
                  setToAccount(newArr)
                }}
                sx={{ width: 200, marginTop: 5 }}
              />
            </Box>
            <Box>
              <Typography>数量</Typography>
              <OutlinedInput
                value={item.amount}
                onChange={e => {
                  const newArr = [...toAccount]
                  newArr[index].amount = e.target.value
                  setToAccount(newArr)
                }}
                sx={{ width: 200, marginTop: 5 }}
              />
            </Box>
            <Button sx={{ whiteSpace: 'nowrap' }} onClick={addRow}>
              增加
            </Button>
          </Stack>
        ))}
      </Stack>
      {ErrorButton()}
      {tokenCurrency && allCurrencyAmount && allCurrencyAmount && (
        <ToApprove allCurrencyAmount={allCurrencyAmount as CurrencyAmount} />
      )}
      {tokenCurrency && allCurrencyAmount && (
        <ToBlock
          formCurrency={tokenCurrency}
          userArr={toAccount}
          allCurrencyAmount={allCurrencyAmount as CurrencyAmount}
        />
      )}
    </Box>
  )
}
export default DistributesToken
