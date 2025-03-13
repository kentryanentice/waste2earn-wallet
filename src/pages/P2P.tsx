import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { P2PService } from '../services/p2p/P2PService';
import { P2POffer, P2PTransaction, P2PPaymentVerification } from '../types/p2p';
import { databaseService } from '../services/database/DatabaseService';
import { Button, Card, Typography, Grid, TextField, MenuItem, Box } from '@mui/material';
import { useSnackbar } from 'notistack';

const p2pService = new P2PService(databaseService);

export const P2P: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const user = useSelector((state: RootState) => state.auth.user);
  const [offers, setOffers] = useState<P2POffer[]>([]);
  const [userOffers, setUserOffers] = useState<P2POffer[]>([]);
  const [transactions, setTransactions] = useState<P2PTransaction[]>([]);
  const [newOffer, setNewOffer] = useState({
    amount: '',
    currency: 'USD',
    price: '',
    paymentMethod: 'bank'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [activeOffers, userOffersList, userTransactions] = await Promise.all([
        p2pService.getActiveOffers(),
        p2pService.getUserOffers(user?.id || ''),
        p2pService.getUserTransactions(user?.id || '')
      ]);
      setOffers(activeOffers);
      setUserOffers(userOffersList);
      setTransactions(userTransactions);
    } catch (error) {
      console.error('Error loading P2P data:', error);
      enqueueSnackbar('Failed to load P2P data', { variant: 'error' });
    }
  };

  const handleCreateOffer = async () => {
    if (!user) {
      enqueueSnackbar('Please login to create an offer', { variant: 'error' });
      return;
    }

    try {
      await p2pService.createOffer({
        userId: user.id,
        amount: parseFloat(newOffer.amount),
        currency: newOffer.currency,
        price: parseFloat(newOffer.price),
        paymentMethod: newOffer.paymentMethod
      });
      enqueueSnackbar('Offer created successfully', { variant: 'success' });
      setNewOffer({ amount: '', currency: 'USD', price: '', paymentMethod: 'bank' });
      loadData();
    } catch (error) {
      console.error('Error creating offer:', error);
      enqueueSnackbar('Failed to create offer', { variant: 'error' });
    }
  };

  const handleBuy = async (offer: P2POffer) => {
    if (!user) {
      enqueueSnackbar('Please login to buy', { variant: 'error' });
      return;
    }

    try {
      await p2pService.createTransaction({
        offerId: offer.id,
        buyerId: user.id,
        sellerId: offer.userId,
        amount: offer.amount,
        currency: offer.currency
      });
      enqueueSnackbar('Transaction created successfully', { variant: 'success' });
      loadData();
    } catch (error) {
      console.error('Error creating transaction:', error);
      enqueueSnackbar('Failed to create transaction', { variant: 'error' });
    }
  };

  const handleVerifyPayment = async (transactionId: string, verificationId: string) => {
    try {
      const success = await p2pService.verifyPayment(transactionId, verificationId);
      if (success) {
        enqueueSnackbar('Payment verified successfully', { variant: 'success' });
        loadData();
      } else {
        enqueueSnackbar('Failed to verify payment', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      enqueueSnackbar('Failed to verify payment', { variant: 'error' });
    }
  };

  const handleDispute = async (transactionId: string, reason: string) => {
    try {
      const success = await p2pService.disputeTransaction(transactionId, reason);
      if (success) {
        enqueueSnackbar('Transaction disputed successfully', { variant: 'success' });
        loadData();
      } else {
        enqueueSnackbar('Failed to dispute transaction', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error disputing transaction:', error);
      enqueueSnackbar('Failed to dispute transaction', { variant: 'error' });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        P2P Exchange
      </Typography>

      {/* Create Offer Form */}
      <Card sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Create New Offer
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={newOffer.amount}
              onChange={(e) => setNewOffer({ ...newOffer, amount: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Currency"
              value={newOffer.currency}
              onChange={(e) => setNewOffer({ ...newOffer, currency: e.target.value })}
            >
              <MenuItem value="USD">USD</MenuItem>
              <MenuItem value="EUR">EUR</MenuItem>
              <MenuItem value="GBP">GBP</MenuItem>
              <MenuItem value="PHP">PHP</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Price"
              type="number"
              value={newOffer.price}
              onChange={(e) => setNewOffer({ ...newOffer, price: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Payment Method"
              value={newOffer.paymentMethod}
              onChange={(e) => setNewOffer({ ...newOffer, paymentMethod: e.target.value })}
            >
              <MenuItem value="bank">Bank Transfer</MenuItem>
              <MenuItem value="cash">Cash</MenuItem>
              <MenuItem value="mobile">Mobile Money</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateOffer}
              disabled={!newOffer.amount || !newOffer.price}
            >
              Create Offer
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Active Offers */}
      <Typography variant="h5" gutterBottom>
        Active Offers
      </Typography>
      <Grid container spacing={2}>
        {offers.map((offer) => (
          <Grid item xs={12} sm={6} md={4} key={offer.id}>
            <Card sx={{ p: 2 }}>
              <Typography variant="h6">
                {offer.amount} {offer.currency}
              </Typography>
              <Typography>Price: {offer.price}</Typography>
              <Typography>Payment: {offer.paymentMethod}</Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleBuy(offer)}
                disabled={offer.userId === user?.id}
              >
                Buy
              </Button>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* User's Transactions */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Your Transactions
      </Typography>
      <Grid container spacing={2}>
        {transactions.map((transaction) => (
          <Grid item xs={12} key={transaction.id}>
            <Card sx={{ p: 2 }}>
              <Typography variant="h6">
                Transaction #{transaction.id}
              </Typography>
              <Typography>Amount: {transaction.amount} {transaction.currency}</Typography>
              <Typography>Status: {transaction.status}</Typography>
              {transaction.status === 'pending' && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleVerifyPayment(transaction.id, '')}
                >
                  Verify Payment
                </Button>
              )}
              {transaction.status === 'pending' && (
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => handleDispute(transaction.id, 'Payment not received')}
                >
                  Dispute
                </Button>
              )}
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}; 