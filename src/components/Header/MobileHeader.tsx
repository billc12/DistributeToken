import { useState, useCallback } from 'react'
import { ExpandMore, Menu, Close } from '@mui/icons-material'
import { NavLink } from 'react-router-dom'
import { Box, MenuItem, AppBar, styled, Theme, Button } from '@mui/material'
import Modal from 'components/Modal'
import Logo from '../../assets/svg/logo.svg'
import { ExternalLink } from 'theme/components'
import { ShowOnMobile } from 'theme/index'
import Image from 'components/Image'
import { Tabs } from './'

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  position: 'relative',
  height: theme.height.mobileHeader,
  backgroundColor: theme.palette.background.default,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  boxShadow: 'none',
  padding: '28px 24px'
}))

const MainLogo = styled(NavLink)({
  '& img': {
    height: 50
  },
  '&:hover': {
    cursor: 'pointer'
  }
})

const StyledNavLink = styled(NavLink)({})

const navLinkSx = {
  cursor: 'pointer',
  textDecoration: 'none',
  fontSize: 24,
  color: (theme: Theme) => theme.palette.text.primary,
  padding: '13px 24px',
  width: '100%',
  textAlign: 'left',
  display: 'flex',
  justifyContent: 'flex-start',
  '&.active': {
    color: (theme: Theme) => theme.palette.primary.main
  },
  '&:hover': {
    color: (theme: Theme) => theme.palette.primary.main
  }
} as const

export default function MobileHeader() {
  const [isOpen, setIsOpen] = useState(false)

  const handleClick = useCallback(() => {
    setIsOpen(true)
  }, [])

  const handleDismiss = useCallback(() => {
    setIsOpen(false)
  }, [])

  const MobileMenu = useCallback(
    ({ isOpen, onDismiss }: { isOpen: boolean; onDismiss: () => void }) => (
      <Modal isCardOnMobile customOnDismiss={onDismiss} customIsOpen={isOpen} maxWidth="900px">
        <Box display="grid" gap="15px">
          {Tabs.map(({ title, route, link, titleContent, subTab }) => {
            const content = titleContent ?? title
            return subTab ? (
              <Accordion placeholder="About">
                {subTab.map(sub => {
                  const subContent = sub.titleContent ?? sub.title
                  return sub.link ? (
                    <MenuItem key={sub.link}>
                      <ExternalLink href={sub.link} sx={navLinkSx}>
                        {subContent}
                      </ExternalLink>
                    </MenuItem>
                  ) : (
                    <MenuItem key={sub.title} onClick={onDismiss}>
                      <StyledNavLink to={sub.route ?? ''} className={'link'} sx={navLinkSx}>
                        {subContent}
                      </StyledNavLink>
                    </MenuItem>
                  )
                })}
              </Accordion>
            ) : link ? (
              <ExternalLink href={link} sx={navLinkSx} key={link}>
                {content}
              </ExternalLink>
            ) : (
              route && (
                <StyledNavLink key={title} id={`${route}-nav-link`} to={route} sx={navLinkSx} onClick={onDismiss}>
                  {content}
                </StyledNavLink>
              )
            )
          })}
        </Box>
      </Modal>
    ),
    []
  )

  return (
    <>
      <MobileMenu isOpen={isOpen} onDismiss={handleDismiss} />
      <ShowOnMobile breakpoint="md">
        <StyledAppBar>
          <Box display="flex" alignItems="center">
            <MainLogo id={'logo'} to={'/'}>
              <Image src={Logo} alt={'logo'} />
            </MainLogo>
          </Box>
          {isOpen ? (
            <Button variant="text" onClick={handleDismiss}>
              {<Close />}
            </Button>
          ) : (
            <Button variant="text" onClick={handleClick}>
              {<Menu />}
            </Button>
          )}
        </StyledAppBar>
      </ShowOnMobile>
    </>
  )
}

function Accordion({ children, placeholder }: { children: React.ReactNode; placeholder: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const handleClick = useCallback(() => {
    setIsOpen(state => !state)
  }, [])
  return (
    <>
      <Box sx={navLinkSx} display="flex" alignItems="center" gap={12} onClick={handleClick}>
        {placeholder}{' '}
        <ExpandMore
          sx={{
            transform: isOpen ? 'rotate(180deg)' : ''
          }}
        />
      </Box>
      <Box padding="0 15px"> {isOpen && children}</Box>
    </>
  )
}
