import { Box, Button, OutlinedInput, Stack, Typography } from '@mui/material'
import { useActiveWeb3React } from 'hooks'
import { useCallback, useMemo, useState } from 'react'
import { isAddress } from 'utils'
import { useCurrencyBalance, useToken } from 'state/wallet/hooks'
import { CurrencyAmount } from 'constants/token/fractions/currencyAmount'
import { useWalletModalToggle } from 'state/application/hooks'
import { useSwitchNetwork } from 'hooks/useSwitchNetwork'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { useTransfer } from 'hooks/useTransferToken'
import useModal from 'hooks/useModal'
import TransactionPendingModal from 'components/Modal/TransactionModals/TransactionPendingModal'
import TransactionSubmittedModal from 'components/Modal/TransactionModals/TransactiontionSubmittedModal'
import MessageBox from 'components/Modal/TransactionModals/MessageBox'
import { DISTRIBUTE_TOKEN } from '../../constants'
import isZero from 'utils/isZero'

const DistributesToken = () => {
  const { account, chainId } = useActiveWeb3React()
  const { showModal, hideModal } = useModal()
  const [content, setContent] = useState('')
  const [tokenAddress, setTokenAddress] = useState('0x0000000000000000000000000000000000000000')
  // const [tokenAddress, setTokenAddress] = useState('0xbE3111856e4acA828593274eA6872f27968C8DD6')
  const { run: distribute } = useTransfer()
  const isValidAddress = useMemo(() => !!isAddress(tokenAddress), [tokenAddress])
  const TOKEN_CURRENCY = useToken(tokenAddress, chainId)
  const balanceCurrency = useCurrencyBalance(account ?? undefined, TOKEN_CURRENCY ?? undefined, chainId)
  const currentAmount = useMemo(() => {
    if (!TOKEN_CURRENCY || !content) return null
    const userAddr: string[] = []
    const userAmount: any[] = []
    const splitArr = content.trim().split('\n')
    splitArr.forEach(item => {
      const addr = item.split('=')[0]
      const amount = item.split('=')[1]
      if (addr && isAddress(addr) && amount && Number(amount) > 0) {
        userAddr.push(addr)
        userAmount.push(CurrencyAmount.fromAmount(TOKEN_CURRENCY, amount) as CurrencyAmount)
      }
    })
    let totalCurrencyAmount = CurrencyAmount.fromAmount(TOKEN_CURRENCY, '0')
    userAmount &&
      userAmount.forEach((item: CurrencyAmount) => {
        totalCurrencyAmount = totalCurrencyAmount ? totalCurrencyAmount.add(item) : item
      })

    const isInsufficient = balanceCurrency && totalCurrencyAmount?.greaterThan(balanceCurrency as CurrencyAmount)
    return { isInsufficient, totalCurrencyAmount, userAddr, userAmount }
  }, [TOKEN_CURRENCY, balanceCurrency, content])
  const [approvalState, approve] = useApproveCallback(
    currentAmount?.totalCurrencyAmount,
    DISTRIBUTE_TOKEN[TOKEN_CURRENCY?.chainId || 1]
  )
  console.log(currentAmount?.userAddr, currentAmount?.userAmount)

  const distributeClick = useCallback(() => {
    if (!currentAmount?.userAddr || !currentAmount?.totalCurrencyAmount) return
    showModal(<TransactionPendingModal />)
    const isEth = isZero(tokenAddress)
    const strArr = currentAmount.userAmount.map((item: CurrencyAmount) => item.raw.toString())
    distribute(isEth, tokenAddress, currentAmount?.userAddr, strArr, currentAmount?.totalCurrencyAmount)
      .then(() => {
        hideModal()
        showModal(<TransactionSubmittedModal />)
      })
      .catch(err => {
        hideModal()
        showModal(
          <MessageBox type="error">
            {err?.data?.message || err?.error?.message || err?.message || 'unknown error'}
          </MessageBox>
        )
        console.error(err, JSON.stringify(err))
      })
  }, [
    currentAmount?.totalCurrencyAmount,
    currentAmount?.userAddr,
    currentAmount?.userAmount,
    distribute,
    hideModal,
    showModal,
    tokenAddress
  ])

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
    if (chainId !== TOKEN_CURRENCY?.chainId)
      return <Button onClick={() => switchNetwork(TOKEN_CURRENCY?.chainId)}>Switch Network</Button>
    if (currentAmount?.isInsufficient) return <Button disabled>Balance Insufficient</Button>
    if (approvalState === ApprovalState.PENDING) return <Button>Approving {TOKEN_CURRENCY?.symbol}</Button>
    if (approvalState === ApprovalState.NOT_APPROVED) return <Button onClick={toApprove}>Approve</Button>
    if (approvalState === ApprovalState.APPROVED) return <Button onClick={distributeClick}>Transfer</Button>
    return <Button onClick={distributeClick}>Transfer</Button>
  }
  return (
    <Box sx={{ width: 500 }}>
      <Box>
        <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Typography lineHeight={'150%'}>Transfer Token Address</Typography>
          <Typography>
            Token Balance : <Typography component={'span'}>{balanceCurrency?.toSignificant(30)}</Typography>
          </Typography>
        </Stack>
        <OutlinedInput
          value={tokenAddress}
          onChange={e => setTokenAddress(e.target.value)}
          sx={{ width: '100%', marginTop: 10 }}
        />
        {tokenAddress && !isValidAddress && <Typography>Please enter valid address</Typography>}
      </Box>
      <Stack
        sx={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 10,
          '& .MuiInputBase-root': { width: 500 }
        }}
        mt={40}
        mb={40}
      >
        <OutlinedInput
          placeholder="input address and amount connect with ‘=’"
          multiline
          value={content}
          onChange={e => setContent(e.target.value)}
          inputProps={{ sx: { minHeight: 144 } }}
        />
      </Stack>
      <ActionButton />
    </Box>
  )
}
export default DistributesToken
