import { ItemFilter, LogoIcon, Sp } from './common'
import { TransitionGroup } from 'react-transition-group'
import ReceiptModal from './ReceiptModal'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import TxRow from './TxRow'
import React from 'react'

const ListHeader = styled.div`
  display: flex;
  align-items: baseline;
  position: sticky;
  background: ${p => p.theme.colors.bg.primary};
  top: 7.2rem;
  left: 0;
  right: 0;
  z-index: 1;
  margin: 0 -4.8rem;
  padding: 0 4.8rem;
`

const ListTitle = styled.div`
  flex-grow: 1;
  line-height: 2.5rem;
  font-size: 2rem;
  font-weight: 600;
  text-shadow: 0 1px 1px ${p => p.theme.colors.darkShade};
`

const TabsContainer = styled.div`
  display: flex;
`

const Tab = styled.button`
  font: inherit;
  line-height: 1.8rem;
  font-size: 1.4rem;
  font-weight: 600;
  letter-spacing: 1.4px;
  text-align: center;
  text-shadow: 0 1px 1px ${p => p.theme.colors.darkShade};
  opacity: ${p => (p.isActive ? '1' : '0.5')};
  text-transform: uppercase;
  padding: 1.6rem;
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  border-bottom: 2px solid ${p => (p.isActive ? 'white' : 'transparent')};
  margin-bottom: 1px;
  transition: 0.3s;
  &:focus {
    outline: none;
  }
`

const List = styled.div`
  border-radius: 2px;
  background-color: #ffffff;
  box-shadow: 0 4px 8px 0 ${p => p.theme.colors.darkShade};
`

const FooterLogo = styled.div`
  padding: 4.8rem;
  width: 3.2rem;
  margin: 0 auto;
`

export default class TxList extends React.Component {
  static propTypes = {
    items: PropTypes.arrayOf(
      PropTypes.shape({
        transaction: PropTypes.shape({
          hash: PropTypes.string.isRequired
        }).isRequired
      })
    ).isRequired
  }

  state = {
    activeModal: null,
    selectedTx: null
  }

  onTxClicked = selectedTx => {
    this.setState({ activeModal: 'receipt', selectedTx })
  }

  onCloseModal = () => this.setState({ activeModal: null })

  render() {
    const { items } = this.props

    return (
      <React.Fragment>
        <ItemFilter extractValue={tx => tx.meta.outgoing} items={items}>
          {({ filteredItems, onFilterChange, activeFilter }) => (
            <Sp mt={6}>
              <ListHeader>
                <ListTitle>Transactions</ListTitle>
                <TabsContainer>
                  <Tab
                    isActive={activeFilter === ''}
                    onClick={() => onFilterChange('')}
                  >
                    All
                  </Tab>
                  <Tab
                    isActive={activeFilter === true}
                    onClick={() => onFilterChange(true)}
                  >
                    Sent
                  </Tab>
                  <Tab
                    isActive={activeFilter === false}
                    onClick={() => onFilterChange(false)}
                  >
                    Received
                  </Tab>
                  <Tab
                    isActive={activeFilter === 'auction'}
                    onClick={() => onFilterChange('auction')}
                  >
                    Auction
                  </Tab>
                  <Tab
                    isActive={activeFilter === 'converted'}
                    onClick={() => onFilterChange('converted')}
                  >
                    Converted
                  </Tab>
                </TabsContainer>
              </ListHeader>

              <List>
                <TransitionGroup>
                  {filteredItems.map(tx => (
                    <TxRow
                      onClick={() => this.onTxClicked(tx.transaction.hash)}
                      key={tx.transaction.hash}
                      {...tx}
                    />
                  ))}
                </TransitionGroup>
                <FooterLogo>
                  <LogoIcon />
                </FooterLogo>
              </List>
            </Sp>
          )}
        </ItemFilter>
        <ReceiptModal
          onRequestClose={this.onCloseModal}
          isOpen={this.state.activeModal === 'receipt'}
          tx={items.find(tx => tx.transaction.hash === this.state.selectedTx)}
        />
      </React.Fragment>
    )
  }
}