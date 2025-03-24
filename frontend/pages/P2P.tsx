import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@redux/Store';
import { p2pService } from '@/services/p2p';
import { Order, PaymentMethod } from '@/types/p2p';
import { Button, Card, Typography, Grid, TextField, MenuItem, Box } from '@mui/material';
import { useSnackbar } from 'notistack';

export const P2P: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { userPrincipal } = useSelector((state: RootState) => state.auth);
  const principal = userPrincipal?.toString();
  const [orders, setOrders] = useState<Order[]>([]);
  const [newOrder, setNewOrder] = useState({
    amount: '',
    price: '',
    paymentMethod: ''
  });
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  useEffect(() => {
    loadData();
    loadPaymentMethods();
  }, []);

  const loadData = async () => {
    try {
      const availableOrders = await p2pService.getAvailableOrders();
      setOrders(availableOrders);
    } catch (error) {
      console.error('Error loading P2P data:', error);
      enqueueSnackbar('Failed to load P2P data', { variant: 'error' });
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const methods = await p2pService.getPaymentMethods();
      setPaymentMethods(methods);
    } catch (error) {
      console.error('Error loading payment methods:', error);
      enqueueSnackbar('Failed to load payment methods', { variant: 'error' });
    }
  };

  const handleCreateOrder = async () => {
    if (!principal) {
      enqueueSnackbar('Please login to create an order', { variant: 'error' });
      return;
    }

    try {
      const selectedMethod = paymentMethods.find(m => m.id === newOrder.paymentMethod);
      if (!selectedMethod) {
        enqueueSnackbar('Please select a payment method', { variant: 'error' });
        return;
      }

      await p2pService.createOrder({
        sellerId: principal,
        amount: parseFloat(newOrder.amount),
        price: parseFloat(newOrder.price),
        paymentMethod: selectedMethod
      });
      enqueueSnackbar('Order created successfully', { variant: 'success' });
      setNewOrder({ amount: '', price: '', paymentMethod: '' });
      loadData();
    } catch (error) {
      console.error('Error creating order:', error);
      enqueueSnackbar('Failed to create order', { variant: 'error' });
    }
  };

  const handleAcceptOrder = async (order: Order) => {
    if (!principal) {
      enqueueSnackbar('Please login to accept order', { variant: 'error' });
      return;
    }

    try {
      await p2pService.lockTokensInEscrow(order);
      await p2pService.updateOrderStatus(order.id, "payment_pending");
      enqueueSnackbar('Order accepted successfully', { variant: 'success' });
      loadData();
    } catch (error) {
      console.error('Error accepting order:', error);
      enqueueSnackbar('Failed to accept order', { variant: 'error' });
    }
  };

  const handleVerifyPayment = async (orderId: string) => {
    if (!principal) {
      enqueueSnackbar('Please login to verify payment', { variant: 'error' });
      return;
    }

    try {
      const order = await p2pService.getOrderById(orderId);
      if (!order) {
        enqueueSnackbar('Order not found', { variant: 'error' });
        return;
      }

      if (order.sellerId !== principal) {
        enqueueSnackbar('Only the seller can verify payments', { variant: 'error' });
        return;
      }

      const success = await p2pService.verifyPayment(orderId);
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

  const handleDispute = async (orderId: string) => {
    if (!principal) {
      enqueueSnackbar('Please login to dispute order', { variant: 'error' });
      return;
    }

    try {
      const order = await p2pService.getOrderById(orderId);
      if (!order) {
        enqueueSnackbar('Order not found', { variant: 'error' });
        return;
      }

      const success = await p2pService.disputeOrder(orderId);
      if (success) {
        enqueueSnackbar('Order disputed successfully', { variant: 'success' });
        loadData();
      } else {
        enqueueSnackbar('Failed to dispute order', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error disputing order:', error);
      enqueueSnackbar('Failed to dispute order', { variant: 'error' });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        P2P Exchange
      </Typography>

      {/* Create Order Form */}
      <Card sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Create New Order
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={newOrder.amount}
              onChange={(e) => setNewOrder({ ...newOrder, amount: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Price"
              type="number"
              value={newOrder.price}
              onChange={(e) => setNewOrder({ ...newOrder, price: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              select
              label="Payment Method"
              value={newOrder.paymentMethod}
              onChange={(e) => setNewOrder({ ...newOrder, paymentMethod: e.target.value })}
            >
              {paymentMethods.map((method) => (
                <MenuItem key={method.id} value={method.id}>
                  {method.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateOrder}
              disabled={!newOrder.amount || !newOrder.price || !newOrder.paymentMethod}
            >
              Create Order
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Active Orders */}
      <Typography variant="h5" gutterBottom>
        Available Orders
      </Typography>
      <Grid container spacing={2}>
        {orders.map((order) => (
          <Grid item xs={12} sm={6} md={4} key={order.id}>
            <Card sx={{ p: 2 }}>
              <Typography variant="h6">
                {order.amount} WASTE
              </Typography>
              <Typography>Price: {order.price} PHP</Typography>
              <Typography>Payment: {order.paymentMethod.name}</Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleAcceptOrder(order)}
                disabled={order.sellerId === principal}
              >
                Accept Order
              </Button>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}; 