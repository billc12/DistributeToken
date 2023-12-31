import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { Typography, Box, useTheme, styled, Button } from '@mui/material'
import { useActiveWeb3React } from 'hooks/'
import { AppDispatch } from 'state/'
import { clearAllTransactions } from 'state/transactions/actions'
import { shortenAddress } from 'utils/'
import Copy from 'components/essential/Copy'
import Transaction from './Transaction'
import { OutlinedCard } from 'components/Card'
import { useAppSelector } from 'state/hooks'
import { getConnection } from 'connection'

const Dot = styled('span')({
  width: 24,
  height: 24,
  background: 'linear-gradient(135deg, #ffffff 4.17%, rgba(255, 255, 255, 0) 75%)',
  border: '0.6px solid #ffffff',
  borderRadius: '50%'
})

function renderTransactions(transactions: string[]) {
  return (
    <>
      {transactions.map((hash, i) => {
        return <Transaction key={i} hash={hash} />
      })}
    </>
  )
}

interface AccountDetailsProps {
  toggleWalletModal: () => void
  pendingTransactions: string[]
  confirmedTransactions: string[]
  ENSName?: string
  openOptions: () => void
}

export default function AccountDetails({
  toggleWalletModal,
  pendingTransactions,
  confirmedTransactions,
  ENSName,
  openOptions
}: AccountDetailsProps) {
  const { chainId, account, connector, deactivate } = useActiveWeb3React()
  const dispatch = useDispatch<AppDispatch>()
  const selectedWallet = useAppSelector(state => state.userWallet.selectedWallet)
  const curConnection = selectedWallet ? getConnection(selectedWallet) : undefined

  const theme = useTheme()

  function formatConnectorName() {
    return (
      <Typography fontSize="0.825rem" fontWeight={500}>
        Connected with {curConnection?.getName()}
      </Typography>
    )
  }

  const clearAllTransactionsCallback = useCallback(() => {
    if (chainId) dispatch(clearAllTransactions({ chainId }))
  }, [dispatch, chainId])

  return (
    <>
      <Box display="grid" width="100%" padding="16px" gridTemplateRows="50px 20px 20px" gap="12px" marginBottom="20px">
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          marginBottom="20px"
          color={theme.palette.text.secondary}
        >
          {formatConnectorName()}
          <Button
            color="secondary"
            sx={{ ml: '8px', width: 120, height: 30 }}
            onClick={() => {
              deactivate()
            }}
          >
            Disconnect
          </Button>
        </Box>

        <Box
          display="flex"
          fontSize={24}
          fontWeight={500}
          gap="16px"
          alignItems="center"
          width="100%"
          justifyContent="center"
          id="web3-account-identifier-row"
        >
          {connector && <Dot />}
          {ENSName ? <span> {ENSName}</span> : <span> {account && shortenAddress(account)}</span>}
        </Box>

        <Box display="flex" justifyContent="center" width="100%" color={theme.palette.text.secondary}>
          {account && (
            <Copy toCopy={account}>
              <Typography variant="body2">Copy Address</Typography>
            </Copy>
          )}
        </Box>
      </Box>
      <Box display="flex" gap="10px" width="100%" justifyContent="center">
        <Button variant="outlined" onClick={toggleWalletModal}>
          Close
        </Button>
        <Button
          onClick={() => {
            openOptions()
          }}
        >
          Change
        </Button>
      </Box>
      <OutlinedCard width="100%" padding="20px">
        {!!pendingTransactions.length || !!confirmedTransactions.length ? (
          <Box display="grid" gap="16px" width="100%">
            <Box display="flex" justifyContent="space-between" width="100%" fontWeight={500}>
              <Typography variant="inherit">Recent Transactions</Typography>
              <Button variant="text" onClick={clearAllTransactionsCallback}>
                (clear all)
              </Button>
            </Box>
            <Box display="grid">
              {renderTransactions(pendingTransactions)}
              {renderTransactions(confirmedTransactions)}
            </Box>
          </Box>
        ) : (
          <Box display="flex" width="100%" justifyContent="center" marginTop={1}>
            <Typography> Your transactions will appear here...</Typography>
          </Box>
        )}
      </OutlinedCard>
    </>
  )
}
